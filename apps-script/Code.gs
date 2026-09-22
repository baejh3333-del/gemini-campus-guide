/**
 * 경품 응모 접수 — Google Apps Script 웹앱.
 *
 * 설치 순서
 * 1. 응모 내역을 담을 구글 시트를 새로 만든다. 접근 권한은 운영 담당자 2명까지만.
 * 2. 확장 프로그램 > Apps Script 를 열고 이 파일 내용을 붙여넣는다.
 * 3. 아래 SECRET 을 길고 무작위한 문자열로 바꾼다.
 *    같은 값을 Vercel 환경변수 ENTRY_SHARED_SECRET 에도 넣는다.
 * 4. 배포 > 새 배포 > 유형: 웹 앱
 *      - 실행 계정: 나
 *      - 액세스 권한: 모든 사용자
 *    배포 후 나오는 /exec URL 을 Vercel 환경변수 ENTRY_WEBHOOK_URL 에 넣는다.
 *    첫 배포 때 Google Drive 권한을 묻는다. 캡처를 "응모 캡처" 폴더에 저장하기 위해서다.
 *
 * 이미 배포해 둔 경우: 이 파일로 교체한 뒤 배포 > 배포 관리 > 수정 > 버전: 새 버전.
 * (그냥 저장만 하면 /exec 는 옛 코드로 돈다. URL 은 바뀌지 않는다.)
 *
 * 캡처는 스크립트 소유자 내 드라이브의 "응모 캡처" 폴더에 쌓인다. 공유하지 말 것.
 * 파기할 때 시트와 함께 이 폴더도 휴지통 비우기까지 해야 한다.
 *
 * 주의: 이 URL 은 절대 클라이언트 코드나 공개 저장소에 넣지 않는다.
 * 반드시 Next.js 의 /api/entry 를 거쳐서만 호출되게 한다.
 */

var SECRET = "여기에-ENTRY_SHARED_SECRET-과-같은-값";
var SHEET_NAME = "응모";

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // 비밀키가 없거나 다르면 즉시 거부. 시트 주소가 유출돼도 아무나 못 쓴다.
    if (!body.secret || body.secret !== SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }

    var name = String(body.name || "").trim();
    var phone = String(body.phone || "").replace(/[^0-9]/g, "");

    if (name.length < 2 || name.length > 20) {
      return json({ ok: false, error: "bad name" });
    }
    if (!/^01[016789][0-9]{7,8}$/.test(phone)) {
      return json({ ok: false, error: "bad phone" });
    }
    var image = String(body.image || "");
    if (!/^data:image\/jpeg;base64,\/9j\//.test(image) || image.length > 3000000) {
      return json({ ok: false, error: "bad image" });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // 동시 제출로 중복 검사가 새는 것을 막는다
    try {
      var sheet = getSheet();

      // 전화번호 기준 중복 응모 차단. 숫자만 비교하고, 앞자리 0 이 빠진 채
      // 숫자로 저장된 예전 행도 잡히도록 앞쪽 0 을 떼고 비교한다.
      var last = sheet.getLastRow();
      if (last > 1) {
        var phones = sheet.getRange(2, 3, last - 1, 1).getValues();
        for (var i = 0; i < phones.length; i++) {
          if (digits(phones[i][0]) === digits(phone)) {
            return json({ ok: true, duplicate: true });
          }
        }
      }

      // 중복이 아닐 때만 저장해야 같은 사람 캡처가 폴더에 여러 장 쌓이지 않는다.
      var file = getFolder().createFile(
        Utilities.newBlob(
          Utilities.base64Decode(image.split(",")[1]),
          "image/jpeg",
          Utilities.formatDate(new Date(), "Asia/Seoul", "MMdd_HHmmss") +
            "_" + phone.slice(-4) + ".jpg"
        )
      );

      var p = body.progress || {};
      var started = new Date(p.startedAt);
      sheet.appendRow([
        new Date(),
        cell(name),
        // 010-1234-5678 형태로. 숫자만 넣으면 appendRow 가 숫자로 바꿔 앞자리 0 이 사라진다.
        phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3"),
        isNaN(started) ? "" : started,
        cell(studyTime(p.stepTimes)),
        cell(p.quizAttempts),
        file.getUrl(),
      ]);
      return json({ ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json({ ok: false, error: "server error" });
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["제출시각", "이름", "전화번호", "학습시작", "학습시간", "퀴즈시도", "캡처"]);
    // 전화번호는 텍스트로, 시각은 "9월 15일 16:12" 처럼 날짜·시·분까지만
    sheet.getRange("C:C").setNumberFormat("@");
    sheet.getRange("A:A").setNumberFormat('M"월" d"일" HH:mm');
    sheet.getRange("D:D").setNumberFormat('M"월" d"일" HH:mm');
  }
  // 캡처 기능 전에 만든 시트에는 G열 제목이 없다
  if (sheet.getRange(1, 7).getValue() === "") sheet.getRange(1, 7).setValue("캡처");
  return sheet;
}

var FOLDER_NAME = "응모 캡처";

function getFolder() {
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

var STEP_LABELS = [
  ["benefit", "STEP0"],
  ["prompt", "STEP1"],
  ["research", "STEP2"],
  ["notebook", "STEP3"],
  ["gem", "STEP4"],
];

// { prompt: 41, research: 250, ... } (초) -> "총 5분 (STEP1 1분 미만 · STEP2 4분)"
function studyTime(t) {
  t = t || {};
  var total = 0;
  var parts = [];
  for (var i = 0; i < STEP_LABELS.length; i++) {
    var sec = Number(t[STEP_LABELS[i][0]]);
    if (!(sec >= 0)) continue; // 기록이 없거나 이상한 값
    total += sec;
    parts.push(STEP_LABELS[i][1] + " " + minutes(sec));
  }
  return parts.length ? "총 " + minutes(total) + " (" + parts.join(" · ") + ")" : "";
}

function minutes(sec) {
  return sec < 60 ? "1분 미만" : Math.round(sec / 60) + "분";
}

function digits(v) {
  return String(v).replace(/[^0-9]/g, "").replace(/^0+/, "");
}

// appendRow 는 = + - @ 로 시작하는 문자열을 수식으로 해석한다.
// 이름에 =IMAGE("..."&C3) 를 넣으면 시트를 여는 순간 다른 응모자 번호가 샐 수 있다.
// 앞에 ' 를 붙이면 그대로 글자로 저장된다. 길이도 잘라 시트 오염을 막는다.
function cell(v) {
  var s = v == null ? "" : String(v).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
