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
 *
 * 랭킹 복사 수는 "랭킹" 시트에 따로 저장합니다(지난 일/주/월 행은 자동 정리).
 * 예전 버전이 "플레이그라운드" 시트에 남긴 "__rk__:" 행은 이 스크립트를 새 버전으로 배포한 뒤
 * 편집기에서 migrateLegacyRankingRows 를 한 번 실행하면 "랭킹" 시트로 옮겨지고 지워집니다.
 * ──────────────────────────────────────────────────────────
 */

var SECRET = "여기에-PLAYGROUND_SHARED_SECRET-과-같은-값";
var SHEET_NAME = "플레이그라운드";
var RANK_SHEET_NAME = "랭킹";
var LEGACY_RANK_PREFIX = "__rk__:";
var RANK_KEY_RE = /^[dwm]:\d{4}-\d{2}(-\d{2})?$/;

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
    if (action === "list") {
      var existingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (existingSheet && existingSheet.getLastRow() > 0) {
        return json({ ok: true, prompts: readAllPrompts(existingSheet) });
      }
    }
    if (action === "rank_list") {
      var listKey = String(body.key || "");
      if (!RANK_KEY_RE.test(listKey)) return json({ ok: false, error: "invalid key" });
      return json({ ok: true, counts: readRankCounts(listKey) });
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      if (action === "rank_incr") {
        return json(incrementRank(body));
      }

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

        var existingRow = findRowById(sheet, id);
        if (existingRow > 1) {
          return json({ ok: true, prompt: rowToPrompt(sheet.getRange(existingRow, 1, 1, 11).getValues()[0]) });
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
          cell(p.artwork || "", 44000),
        ]);
        SpreadsheetApp.flush();

        return json({
          ok: true,
          prompt: {
            id: id,
            createdAt: createdAt,
            author: author,
            category: category,
            variant: variant,
            artwork: p.artwork || "",
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
          var rowValues = sheet.getRange(rowIdx, 1, 1, 11).getValues()[0];
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
      "AI아트워크",
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange("A:H").setNumberFormat("@");
  }
  if (!sheet.getRange(1, 11).getValue()) sheet.getRange(1, 11).setValue("AI아트워크");
  sheet.getRange("K:K").setNumberFormat("@");
  return sheet;
}

function readAllPrompts(sheet) {
  var last = sheet.getLastRow();
  if (last <= 1) return [];
  var values = sheet.getRange(2, 1, last - 1, 11).getValues();
  var list = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var item = rowToPrompt(values[i]);
    if (item.id && item.title && item.body && item.id.indexOf(LEGACY_RANK_PREFIX) !== 0) {
      list.push(item);
    }
  }
  return list;
}

/* ── 랭킹 카운터 ("랭킹" 시트: 키 | 프롬프트ID | 복사수) ─────────────── */

function getRankSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(RANK_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(RANK_SHEET_NAME);
    sheet.appendRow(["키", "프롬프트ID", "복사수"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A:B").setNumberFormat("@");
  }
  return sheet;
}

function readRankRows(sheet) {
  var last = sheet.getLastRow();
  if (last <= 1) return [];
  return sheet.getRange(2, 1, last - 1, 3).getValues();
}

function readRankCounts(key) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RANK_SHEET_NAME);
  var counts = {};
  if (!sheet) return counts;
  var rows = readRankRows(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      var rowPromptId = String(rows[i][1]);
      counts[rowPromptId] = (counts[rowPromptId] || 0) + (Number(rows[i][2]) || 0);
    }
  }
  return counts;
}

/**
 * body.keys 는 지금 일/주/월 키 3개. 그 키들의 행만 남기고(지난 기간 행은 삭제)
 * promptId 의 각 키 복사 수를 1씩 올린다.
 */
function incrementRank(body) {
  var promptId = String(body.promptId || "").trim();
  var keys = Array.isArray(body.keys) ? body.keys.map(String) : [];
  if (!promptId || promptId.length > 80 || /^[=+\-@]/.test(promptId)) {
    return { ok: false, error: "invalid promptId" };
  }
  if (keys.length === 0 || keys.length > 3 || !keys.every(function (k) { return RANK_KEY_RE.test(k); })) {
    return { ok: false, error: "invalid keys" };
  }

  var sheet = getRankSheet();
  var rows = readRankRows(sheet);
  var kept = [];
  for (var i = 0; i < rows.length; i++) {
    if (keys.indexOf(String(rows[i][0])) !== -1) kept.push(rows[i]);
  }
  var pruned = kept.length !== rows.length;

  var appended = [];
  for (var k = 0; k < keys.length; k++) {
    var found = false;
    for (var r = 0; r < kept.length; r++) {
      if (String(kept[r][0]) === keys[k] && String(kept[r][1]) === promptId) {
        kept[r][2] = (Number(kept[r][2]) || 0) + 1;
        found = true;
        break;
      }
    }
    if (!found) appended.push([keys[k], promptId, 1]);
  }

  var all = kept.concat(appended);
  if (pruned && rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).clearContent();
  }
  if (all.length > 0) {
    sheet.getRange(2, 1, all.length, 3).setValues(all);
  }
  return { ok: true };
}

/**
 * 한 번만 편집기에서 직접 실행: 예전 "__rk__:" 행을 "랭킹" 시트로 옮기고 플레이그라운드 시트에서 지운다.
 * 지난 기간 행은 다음 복사 때 incrementRank 가 정리한다.
 */
function migrateLegacyRankingRows() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet();
    var last = sheet.getLastRow();
    if (last <= 1) return;
    var values = sheet.getRange(2, 1, last - 1, 9).getValues();
    var rankSheet = getRankSheet();
    var moved = [];
    var deleteRows = [];
    for (var i = 0; i < values.length; i++) {
      var id = unquote(values[i][0]);
      if (id.indexOf(LEGACY_RANK_PREFIX) !== 0) continue;
      var match = /^__rk__:([dwm]:\d{4}-\d{2}(?:-\d{2})?):(.+)$/.exec(id);
      if (match) moved.push([match[1], match[2], Number(values[i][8]) || 0]);
      deleteRows.push(i + 2);
    }
    if (moved.length > 0) {
      rankSheet.getRange(rankSheet.getLastRow() + 1, 1, moved.length, 3).setValues(moved);
    }
    // 아래에서 위로, 연속 구간 단위로 지워야 행 번호가 밀리지 않는다.
    for (var j = deleteRows.length - 1; j >= 0; ) {
      var end = deleteRows[j];
      var start = end;
      while (j - 1 >= 0 && deleteRows[j - 1] === start - 1) {
        j--;
        start--;
      }
      sheet.deleteRows(start, end - start + 1);
      j--;
    }
  } finally {
    lock.releaseLock();
  }
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
    artwork: unquote(row[10]) || "",
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
