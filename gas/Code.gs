const SHEET_SENTENCES = "Sentences";
const SHEET_RESULTS = "Results";

function doGet(e) {
  try {
    if (e.parameter.action === "getBank") {
      return jsonOutput({ok:true, sentences:getBank()});
    }
    return jsonOutput({ok:false, error:"Unknown action"});
  } catch (err) {
    return jsonOutput({ok:false, error:String(err)});
  }
}

function doPost(e) {
  var p = {};
  var result;
  try {
    var raw = (e.parameter && e.parameter.payload) || (e.postData && e.postData.contents) || "{}";
    p = JSON.parse(raw);
    var action = p.action;

    if (action === "teacherLogin") {
      checkPin(p.pin);
      result = {ok:true};
    } else if (action === "getBank") {
      result = {ok:true, sentences:getBank()};
    } else if (action === "addSentences") {
      checkPin(p.pin);
      var sheet = getSheet(SHEET_SENTENCES);
      (p.sentences || []).map(function(s){return String(s).trim().slice(0,500);})
        .filter(function(s){return !!s;})
        .forEach(function(s){sheet.appendRow([Utilities.getUuid(), s, new Date()]);});
      result = {ok:true};
    } else if (action === "deleteSentence") {
      checkPin(p.pin);
      var sh = getSheet(SHEET_SENTENCES);
      var rows = sh.getDataRange().getValues();
      var deleted = false;
      for (var i=1; i<rows.length; i++) {
        if (String(rows[i][0]) === String(p.id)) {
          sh.deleteRow(i+1);
          deleted = true;
          break;
        }
      }
      if (!deleted) throw new Error("題目不存在");
      result = {ok:true};
    } else if (action === "saveResult") {
      getSheet(SHEET_RESULTS).appendRow([
        new Date(), clean(p.className), clean(p.studentId), clean(p.studentName),
        Number(p.avgCompleteness)||0, Number(p.avgAccuracy)||0, Number(p.attempts)||0,
        JSON.stringify(p.details || [])
      ]);
      result = {ok:true};
    } else if (action === "getGrades") {
      checkPin(p.pin);
      var data = getSheet(SHEET_RESULTS).getDataRange().getValues().slice(1)
        .filter(function(r){
          return (!p.className || String(r[1]).indexOf(p.className)!==-1) &&
                 (!p.studentId || String(r[2]).indexOf(p.studentId)!==-1);
        }).reverse().slice(0,500).map(function(r){
          return {
            timestamp:r[0] instanceof Date ? Utilities.formatDate(r[0],Session.getScriptTimeZone(),"yyyy-MM-dd HH:mm") : String(r[0]),
            className:r[1], studentId:r[2], studentName:r[3],
            avgCompleteness:r[4], avgAccuracy:r[5], attempts:r[6]
          };
        });
      result = {ok:true, results:data};
    } else {
      result = {ok:false, error:"Unknown action"};
    }
  } catch (err) {
    result = {ok:false, error:String(err)};
  }
  return htmlResponse(result, p.requestId);
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(SHEET_SENTENCES);
  if (!s) {
    s = ss.insertSheet(SHEET_SENTENCES);
    s.appendRow(["id","sentence","createdAt"]);
    s.setFrozenRows(1);
  }
  var r = ss.getSheetByName(SHEET_RESULTS);
  if (!r) {
    r = ss.insertSheet(SHEET_RESULTS);
    r.appendRow(["timestamp","className","studentId","studentName","avgCompleteness","avgAccuracy","attempts","details"]);
    r.setFrozenRows(1);
  }
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("TEACHER_PIN")) {
    props.setProperty("TEACHER_PIN","請更換為自訂教師密碼");
  }
  if (s.getLastRow() === 1) {
    var starter = [
      "Good morning. How are you today?",
      "My name is Kevin.",
      "I would like a glass of water, please.",
      "Could you speak more slowly?",
      "The weather is beautiful this afternoon.",
      "I usually walk to school with my friends.",
      "Practice makes progress every day.",
      "Please read the sentence aloud.",
      "I enjoy learning English because it is useful.",
      "Thank you for your time and attention."
    ];
    starter.forEach(function(sentence){
      s.appendRow([Utilities.getUuid(), sentence, new Date()]);
    });
  }
}

function getBank() {
  return getSheet(SHEET_SENTENCES).getDataRange().getValues().slice(1)
    .filter(function(r){return r[1];})
    .map(function(r){return {id:String(r[0]), text:String(r[1])};});
}

function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error("請先執行 setup()");
  return sheet;
}

function checkPin(value) {
  var saved = PropertiesService.getScriptProperties().getProperty("TEACHER_PIN");
  if (!saved || saved === "請更換為自訂教師密碼" || String(value||"") !== saved) {
    throw new Error("教師 PIN 錯誤或尚未設定");
  }
}

function clean(value) {
  return String(value||"").replace(/[<>]/g,"").slice(0,100);
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlResponse(value, requestId) {
  var message = JSON.stringify({
    channel:"pronunciation-api",
    requestId:requestId || "",
    payload:value
  }).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
  var html = "<!doctype html><html><body><script>window.parent.postMessage(" +
    message + ", '*');</script></body></html>";
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}