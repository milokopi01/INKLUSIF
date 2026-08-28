/**
 * JPKS SK Selama (K) — Google Apps Script Backend
 * API CRUD untuk Google Sheets & Folder Google Drive
 *
 * Cara penggunaan:
 * 1. Buka script.google.com → New Project
 * 2. Tampal kod ini ke dalam Code.gs
 * 3. Jalankan fungsi setup() sekali (membuat spreadsheet, folder, sheet)
 * 4. Jalankan deployWebApp() untuk dapatkan URL Web App
 * 5. Salin URL dan masukkan di Tetapan aplikasi
 */

var SPREADSHEET_NAME = 'JPKS_SK_Selama_K';
var FOLDER_NAME = 'JPKS_SK_Selama_K_Drive';
var SHEETS = {
  GURU: 'Guru_PPKI',
  MURID: 'Murid_PPKI',
  ORGCHART: 'Carta_Organisasi',
  SCHEDULE: 'Jadual_Bimbingan',
  MINIT: 'Minit_Mesyuarat',
  PPT: 'Prestasi_PPT',
  PRASARANA: 'Prasarana_OKU',
  SWOT: 'SWOT_Tahunan',
  SURAT: 'Surat_Pelantikan'
};

var SHEET_HEADERS = {
  Guru_PPKI: ['id', 'nama', 'gred', 'opsyen', 'subjek'],
  Murid_PPKI: ['id', 'nama', 'mykid', 'oku', 'diagnosis', 'kelas', 'jenis', 'guru_mentor', 'markah_saringan', 'status'],
  Carta_Organisasi: ['jawatan', 'nama', 'jawatan_full'],
  Jadual_Bimbingan: ['hari', 'masa', 'subjek_kelas'],
  Minit_Mesyuarat: ['bil', 'tarikh', 'masa', 'tempat', 'pengerusi', 'ahli', 'agenda', 'maklumBalas', 'keputusan'],
  Prestasi_PPT: ['id', 'nama', 'kelas', 'bm', 'bi', 'matematik', 'sains'],
  Prasarana_OKU: ['id', 'item', 'lokasi', 'status', 'catatan'],
  SWOT_Tahunan: ['tahun', 'kekuatan', 'kelemahan', 'peluang', 'ancaman'],
  Surat_Pelantikan: ['nama', 'jawatan', 'tarikh', 'sekolah', 'guruBesar']
};

/* ============================================================
   SETUP — Jalankan sekali sahaja
   ============================================================ */
function setup() {
  var ss = getOrCreateSpreadsheet();
  var folder = getOrCreateFolder();
  for (var key in SHEETS) {
    var sheetName = SHEETS[key];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    var headers = SHEET_HEADERS[sheetName];
    if (headers && sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  Logger.log('Setup selesai. Spreadsheet ID: ' + ss.getId());
  Logger.log('Folder ID: ' + folder.getId());
}

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    var file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  return ss;
}

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(FOLDER_NAME);
}

/* ============================================================
   WEB APP ENTRY POINT
   ============================================================ */
function doPost(e) {
  var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var result;

    switch (action) {
      case 'list': result = handleList(body); break;
      case 'create': result = handleCreate(body); break;
      case 'update': result = handleUpdate(body); break;
      case 'delete': result = handleDelete(body); break;
      case 'uploadFile': result = handleUploadFile(body); break;
      case 'listFiles': result = handleListFiles(body); break;
      case 'deleteFile': result = handleDeleteFile(body); break;
      default: result = { ok: false, error: 'Tindakan tidak diketahui: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: 'API JPKS SK Selama (K) beroperasi.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   CRUD HANDLERS
   ============================================================ */
function handleList(body) {
  var sheetName = body.sheet;
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: 'Sheet tidak wujud: ' + sheetName };

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, data: [] };

  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return { ok: true, data: rows };
}

function handleCreate(body) {
  var sheetName = body.sheet;
  var record = body.record;
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: 'Sheet tidak wujud: ' + sheetName };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { return record[h] !== undefined ? record[h] : ''; });
  if (!record.id) {
    row[headers.indexOf('id')] = 'rec_' + new Date().getTime();
  }
  sheet.appendRow(row);
  var newId = row[headers.indexOf('id')];
  return { ok: true, id: newId, msg: 'Rekod ditambah.' };
}

function handleUpdate(body) {
  var sheetName = body.sheet;
  var id = body.id;
  var record = body.record;
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: 'Sheet tidak wujud: ' + sheetName };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  if (idCol === -1) return { ok: false, error: 'Sheet tiada lajur id.' };

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      for (var j = 0; j < headers.length; j++) {
        if (record[headers[j]] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(record[headers[j]]);
        }
      }
      return { ok: true, msg: 'Rekod dikemas kini.' };
    }
  }
  return { ok: false, error: 'Rekod tidak dijumpai.' };
}

function handleDelete(body) {
  var sheetName = body.sheet;
  var id = body.id;
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: 'Sheet tidak wujud: ' + sheetName };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  if (idCol === -1) return { ok: false, error: 'Sheet tiada lajur id.' };

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { ok: true, msg: 'Rekod dipadam.' };
    }
  }
  return { ok: false, error: 'Rekod tidak dijumpai.' };
}

/* ============================================================
   FILE UPLOAD / DRIVE HANDLERS
   ============================================================ */
function handleUploadFile(body) {
  try {
    var folder = getOrCreateFolder();
    var fileName = body.fileName || 'fail_' + new Date().getTime();
    var base64Data = body.fileData;
    var mimeType = body.mimeType || 'application/octet-stream';

    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { ok: true, fileId: file.getId(), url: file.getUrl(), msg: 'Fail dimuat naik.' };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function handleListFiles(body) {
  var folder = getOrCreateFolder();
  var files = folder.getFiles();
  var result = [];
  while (files.hasNext()) {
    var f = files.next();
    result.push({ id: f.getId(), name: f.getName(), url: f.getUrl(), size: f.getSize(), date: f.getDateCreated() });
  }
  return { ok: true, files: result };
}

function handleDeleteFile(body) {
  var folder = getOrCreateFolder();
  var file = DriveApp.getFileById(body.fileId);
  if (file.getParents().hasNext() && file.getParents().next().getId() === folder.getId()) {
    DriveApp.getFileById(body.fileId).setTrashed(true);
    return { ok: true, msg: 'Fail dipadam.' };
  }
  return { ok: false, error: 'Fail tidak dijumpai dalam folder.' };
}

/* ============================================================
   DEPLOY WEB APP — Jalankan untuk dapatkan URL
   ============================================================ */
function deployWebApp() {
  Logger.log('Untuk deploy: Publish > Deploy as web app > Execute as: Me > Access: Anyone > Deploy');
  Logger.log('Salin URL Web App dan tampal dalam Tetapan aplikasi.');
}
