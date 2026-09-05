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

    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // 동시 제출로 중복 검사가 새는 것을 막는다
    try {
      var sheet = getSheet();

      // 전화번호 기준 중복 응모 차단
      var last = sheet.getLastRow();
      if (last > 1) {
        var phones = sheet.getRange(2, 3, last - 1, 1).getValues();
        for (var i = 0; i < phones.length; i++) {
          if (String(phones[i][0]) === phone) {
            return json({ ok: true, duplicate: true });
          }
        }
      }

      var p = body.progress || {};
      sheet.appendRow([
        new Date(),
        name,
        phone, // 문자열로 넣어야 앞자리 0 이 살아남는다
        (p.completed || []).join(","),
        JSON.stringify(p.stepTimes || {}),
        p.quizAttempts || "",
        p.signup || "",
        p.startedAt || "",
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
    sheet.appendRow([
      "제출시각",
      "이름",
      "전화번호",
      "완료단계",
      "단계별소요초",
      "퀴즈시도",
      "혜택가입",
      "학습시작시각",
    ]);
    // 전화번호 열을 텍스트로 고정 (앞자리 0 보존)
    sheet.getRange("C:C").setNumberFormat("@");
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
