// ═══════════════════════════════════════════════════════
// PANTRY SYNC — Google Apps Script
// Paste this entire file into Extensions > Apps Script
// ═══════════════════════════════════════════════════════

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Data");
  }
  
  var data = sheet.getDataRange().getValues();
  var result = {};
  
  for (var i = 0; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    if (key && val) {
      try {
        result[key] = JSON.parse(val);
      } catch (err) {
        result[key] = val;
      }
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Data");
  }
  
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Invalid JSON" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var key = body.key;
  var value = JSON.stringify(body.value);
  
  // Find existing row with this key, or append
  var data = sheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([key, value]);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, key: key }))
    .setMimeType(ContentService.MimeType.JSON);
}
