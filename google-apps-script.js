// ═══════════════════════════════════════════════════════
// PANTRY SYNC v2 — Google Apps Script
// 
// IMPORTANT: After pasting this, you must:
// 1. Save (Ctrl+S)
// 2. Deploy > Manage deployments > Edit (pencil icon)
// 3. Change version to "New version"
// 4. Click Deploy
// ═══════════════════════════════════════════════════════

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Data");
  if (!sheet) sheet = ss.insertSheet("Data");
  return sheet;
}

function readAll() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var result = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      try { result[data[i][0]] = JSON.parse(data[i][1]); }
      catch (e) { result[data[i][0]] = data[i][1]; }
    }
  }
  return result;
}

function writeKey(key, value) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var jsonVal = typeof value === "string" ? value : JSON.stringify(value);
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(jsonVal);
      return;
    }
  }
  sheet.appendRow([key, jsonVal]);
}

function doGet(e) {
  var result = readAll();
  var output = JSON.stringify(result);
  
  // Support JSONP callback for cross-origin
  var callback = e.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + output + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body = null;
  
  // Try form parameter first (from iframe form POST)
  if (e.parameter && e.parameter.payload) {
    try { body = JSON.parse(e.parameter.payload); } catch (err) { }
  }
  
  // Fallback: try raw POST body
  if (!body && e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); } catch (err) { }
  }
  
  if (!body || !body.key) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "No data received" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  writeKey(body.key, body.value);
  
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, key: body.key }))
    .setMimeType(ContentService.MimeType.JSON);
}
