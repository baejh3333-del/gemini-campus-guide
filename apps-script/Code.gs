/**
 * 플레이그라운드 프롬프트 DB — Google Apps Script 웹앱.
 *
 * 학우들이 플레이그라운드에 올린 프롬프트, 복사 수, 좋아요 수를
 * 구글 시트의 "플레이그라운드" 시트에 영구 저장합니다.
 * 운영진이 시트에서 직접 행을 수정하거나 부적절한 글을 삭제하면 사이트에 바로 반영됩니다.
 *
 * ── 설치 순서 ─────────────────────────────────────────────
 * 1. 구글 시트를 새로 만든다 (또는 기존 운영 시트를 연다).
 * 2. 상단 메뉴: 확장 프로그램 > Apps Script 를 열고 이 파일 내용을 붙여넣는다.
 * 3. 아래 SECRET 값을 원하는 비밀번호 문자열로 바꾼다.
 *    같은 값을 Vercel 환경변수 PLAYGROUND_SHARED_SECRET 에도 넣는다.
 * 4. 우측 상단 [배포] > [새 배포] > 유형: [웹 앱]
 *      - 다음 사용자로 실행: 나
 *      - 액세스 권한이 있는 사용자: 모든 사용자
 *    배포 후 나오는 https://script.google.com/macros/s/.../exec 주소를
 *    Vercel 환경변수 PLAYGROUND_WEBHOOK_URL 에 넣는다.
 *
 * 이미 배포한 스크립트를 수정할 때:
 * [배포] > [배포 관리] > 연필 아이콘(수정) > 버전: [새 버전] > [배포]
 * ──────────────────────────────────────────────────────────
 */

var SECRET = "여기에-PLAYGROUND_SHARED_SECRET-과-같은-값";
var SHEET_NAME = "플레이그라운드";

function doGet(e) {
  try {
    var sheet = getSheet();
    return json({ ok: true, prompts: readAllPrompts(sheet) });
  } catch (err) {
    return json({ ok: false, error: "server error" });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (!body.secret || body.secret !== SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }

    var action = String(body.action || "list");
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      var sheet = getSheet();

      if (action === "list") {
        return json({ ok: true, prompts: readAllPrompts(sheet) });
      }

      if (action === "create") {
        var p = body.prompt || {};
        var id = String(p.id || "").trim();
        var title = String(p.title || "").trim().slice(0, 60);
        var description = String(p.description || "").trim().slice(0, 140);
        var promptBody = String(p.body || "").trim().slice(0, 4000);
        var author = String(p.author || "익명 학우").trim().slice(0, 20);
        var category = String(p.category || "릴스·카드뉴스").trim().slice(0, 40);
        var variant = String(p.variant || "orbit").trim().slice(0, 20);
        var createdAt = String(p.createdAt || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd"));

        if (!id || title.length < 2 || promptBody.length < 10) {
          return json({ ok: false, error: "invalid fields" });
        }

        sheet.appendRow([
          cell(id, 80),
          cell(createdAt, 20),
          cell(author, 20),
          cell(category, 40),
          cell(variant, 20),
          cell(title, 60),
          cell(description, 140),
          cell(promptBody, 4000),
          0,
          1,
        ]);

        return json({
          ok: true,
          prompt: {
            id: id,
            createdAt: createdAt,
            author: author,
            category: category,
            variant: variant,
            title: title,
            description: description,
            body: promptBody,
            copies: 0,
            likes: 1,
          },
        });
      }

      if (action === "copy" || action === "like") {
        var targetId = String(body.id || "").trim();
        var rowIdx = findRowById(sheet, targetId);
        if (rowIdx > 1) {
          var col = action === "copy" ? 9 : 10; // I열(copies=9), J열(likes=10)
          var currentVal = Number(sheet.getRange(rowIdx, col).getValue()) || 0;
          var nextVal = currentVal + 1;
          sheet.getRange(rowIdx, col).setValue(nextVal);
          var rowValues = sheet.getRange(rowIdx, 1, 1, 10).getValues()[0];
          return json({ ok: true, prompt: rowToPrompt(rowValues) });
        }
        // 기본 제공(Seed) 프롬프트에 첫 복사/좋아요가 눌렸을 때 시트에 행 자동 생성
        if (body.seed && body.seed.id === targetId) {
          var s = body.seed;
          var copies = (Number(s.copies) || 0) + (action === "copy" ? 1 : 0);
          var likes = (Number(s.likes) || 0) + (action === "like" ? 1 : 0);
          sheet.appendRow([
            cell(s.id, 80),
            cell(s.createdAt, 20),
            cell(s.author, 20),
            cell(s.category, 40),
            cell(s.variant, 20),
            cell(s.title, 60),
            cell(s.description, 140),
            cell(s.body, 4000),
            copies,
            likes,
          ]);
          return json({
            ok: true,
            prompt: {
              id: s.id,
              createdAt: s.createdAt,
              author: s.author,
              category: s.category,
              variant: s.variant,
              title: s.title,
              description: s.description,
              body: s.body,
              copies: copies,
              likes: likes,
            },
          });
        }
        return json({ ok: false, error: "not found" });
      }

      if (action === "delete") {
        var delId = String(body.id || "").trim();
        var delRow = findRowById(sheet, delId);
        if (delRow > 1) {
          sheet.deleteRow(delRow);
          return json({ ok: true });
        }
        return json({ ok: false, error: "not found" });
      }

      return json({ ok: false, error: "unknown action" });
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
      "ID",
      "작성일",
      "작성자",
      "카테고리",
      "그래픽테마",
      "제목",
      "한줄설명",
      "프롬프트본문",
      "복사수",
      "좋아요수",
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange("A:H").setNumberFormat("@");
  }
  return sheet;
}

function readAllPrompts(sheet) {
  var last = sheet.getLastRow();
  if (last <= 1) return [];
  var values = sheet.getRange(2, 1, last - 1, 10).getValues();
  var list = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var item = rowToPrompt(values[i]);
    if (item.id && item.title && item.body) {
      list.push(item);
    }
  }
  return list;
}

function findRowById(sheet, id) {
  if (!id) return -1;
  var last = sheet.getLastRow();
  if (last <= 1) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (unquote(ids[i][0]) === id) {
      return i + 2;
    }
  }
  return -1;
}

function rowToPrompt(row) {
  return {
    id: unquote(row[0]),
    createdAt: unquote(row[1]),
    author: unquote(row[2]) || "익명 학우",
    category: unquote(row[3]) || "릴스·카드뉴스",
    variant: unquote(row[4]) || "orbit",
    title: unquote(row[5]),
    description: unquote(row[6]),
    body: unquote(row[7]),
    copies: Number(row[8]) || 0,
    likes: Number(row[9]) || 0,
  };
}

function unquote(v) {
  var s = v == null ? "" : String(v);
  return s.indexOf("'") === 0 ? s.slice(1) : s;
}

// = + - @ 로 시작하는 수식 주입(Formula Injection) 방지
function cell(v, maxLen) {
  var s = v == null ? "" : String(v).slice(0, maxLen || 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
