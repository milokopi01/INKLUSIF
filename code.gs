/**
 * JPKS SK Selama (K) — Google Apps Script Backend
 * Sistem Pengurusan Program Pendidikan Inklusif
 *
 * Struktur: Pangkalan data hibrid Google Sheets + Google Drive
 * Enjin Proxy AI Groq dengan auto-rotasi API Key
 *
 * Cara penggunaan:
 * 1. Buka script.google.com → New Project
 * 2. Tampal kod ini ke dalam Code.gs
 * 3. Jalankan fungsi setup() sekali (cipta tab & data contoh)
 * 4. Deploy > Deploy as web app > Execute as: Me > Access: Anyone > Deploy
 * 5. Salin URL Web App ke Tetapan aplikasi
 */

/* ============================================================
   KONFIGURASI — ID tetap (hardcoded)
   ============================================================ */
var SPREADSHEET_ID = '1JRKh71JpYnZoSAQJ6iZ7B2TcwefETXoCWELPHMzAJPo';
var DRIVE_FOLDER_ID = '1X4j3KueUHiN-0x3OawDz_0CzewT7dWcz';

var SHEETS = {
  MURID: 'Murid',
  SARINGAN: 'Saringan',
  GURU: 'Guru',
  PRASARANA: 'Prasarana',
  CARTA: 'Carta_Organisasi',
  FAIL: 'Fail_Upload',
  APIKEY: 'apikey'
};

var SHEET_HEADERS = {
  Murid: ['id', 'nama', 'mykid', 'oku', 'diagnosis', 'kelas', 'jenis', 'guru_mentor', 'markah_saringan', 'status'],
  Saringan: ['id', 'murid_id', 'murid_nama', 'tarikh', 'markah', 'peratus', 'keputusan', 'catatan'],
  Guru: ['id', 'nama', 'gred', 'opsyen', 'subjek'],
  Prasarana: ['id', 'item', 'lokasi', 'status', 'catatan'],
  Carta_Organisasi: ['jawatan', 'nama', 'jawatan_full'],
  Fail_Upload: ['id', 'tajuk_kecil', 'nama_fail', 'mime_type', 'saiz', 'url', 'file_id', 'tarikh'],
  apikey: ['API_KEY']
};

/* ============================================================
   DATA CONTOH (Fasa 1)
   ============================================================ */
var SAMPLE_GURU = [
  ['g1', 'En. Ahmad bin Isa', 'DG44', 'Pendidikan Khas', 'Matematik'],
  ['g2', 'Pn. Siti Aminah binti Ramli', 'DG44', 'Pendidikan Khas', 'Bahasa Melayu'],
  ['g3', 'Cik Norashikin binti Mohd Yusof', 'DG41', 'Pendidikan Khas', 'Bahasa Inggeris'],
  ['g4', 'En. Mohd Zaki bin Ridzuan', 'DG41', 'Pendidikan Khas', 'Sains'],
  ['g5', 'Pn. Faridah binti Kassim', 'DG44', 'Terapi Cara Kerja', 'Pend. Seni Visual']
];

var SAMPLE_MURID = [
  ['m1', 'Muhammad Amirul bin Roslan', '150112085341', 'LD120415000084', 'Slow Learner', '1 Bestari', 'Inklusif Separa', 'Pn. Siti Aminah', 64, 'Layak Inklusif Separa (Bukan Akademik)'],
  ['m2', 'Chong Wei Han', '120520085113', 'DE120520000122', 'Masalah Pendengaran', '4 Amanah', 'Inklusif Separa', 'Cik Norashikin', 76, 'Layak Inklusif Separa (Akademik)'],
  ['m3', 'Farah Shahidah binti Ahmad', '100714085442', 'LD120710000213', 'Autisme Ringan', '6 Dedikasi', 'Inklusif Separa', 'En. Mohd Zaki', 84, 'Layak Inklusif Separa (Akademik)']
];

var SAMPLE_PRASARANA = [
  ['pr1', 'Tempat Letak Kerusi Roda', 'Hadapan Blok A', 'Ada', '2 petak disediakan'],
  ['pr2', 'Ramp Tangga Lereng', 'Pintu Utama', 'Ada', 'Mengikut spesifikasi KPM'],
  ['pr3', 'Tandas Mesra OKU', 'Bawah & Tingkat 1', 'Ada', 'Grab bar & alarm kecemasan'],
  ['pr4', 'Laluan Taktil', 'Koridor Utama', 'Tiada', 'Perlu penambahbaikan'],
  ['pr5', 'Papan Tanda Braille', 'Bilik PPKI', 'Tiada', 'Dalam perancangan'],
  ['pr6', 'Ruang Selamat / Sensory Room', 'Bilik PPKI', 'Ada', 'Lengkap dengan alat terapi']
];

var SAMPLE_CARTA = [
  ['Pengerusi', 'Tn. Hj. Abdul Rahman bin Hassan', 'Guru Besar'],
  ['Naib Pengerusi', 'Pn. Hajjah Norliza binti Othman', 'Penolong Kanan Pentadbiran'],
  ['Penyelaras', 'En. Ahmad bin Isa', 'Penyelaras PPKI'],
  ['Guru Pendamping', 'Pn. Siti Aminah binti Ramli', 'Guru PPKI'],
  ['PPM', 'Pn. Rosnah binti Abdullah', 'Pembantu Pendidikan Murid']
];

/* ============================================================
   SETUP — Auto-Create & Auto-Populate Sheets
   ============================================================ */
function setup() {
  ensureSheets();
  Logger.log('Setup selesai. Spreadsheet ID: ' + SPREADSHEET_ID);
  Logger.log('Drive Folder ID: ' + DRIVE_FOLDER_ID);
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getDriveFolder() {
  return DriveApp.getFolderById(DRIVE_FOLDER_ID);
}

function ensureSheets() {
  var ss = getSpreadsheet();
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
  populateSampleData(ss);
}

function populateSampleData(ss) {
  var sheetInfo = [
    { name: 'Guru', headers: SHEET_HEADERS.Guru, data: SAMPLE_GURU },
    { name: 'Murid', headers: SHEET_HEADERS.Murid, data: SAMPLE_MURID },
    { name: 'Prasarana', headers: SHEET_HEADERS.Prasarana, data: SAMPLE_PRASARANA },
    { name: 'Carta_Organisasi', headers: SHEET_HEADERS.Carta_Organisasi, data: SAMPLE_CARTA }
  ];
  sheetInfo.forEach(function(info) {
    var sheet = ss.getSheetByName(info.name);
    if (sheet && sheet.getLastRow() <= 1 && info.data && info.data.length > 0) {
      sheet.getRange(2, 1, info.data.length, info.headers.length).setValues(info.data);
    }
  });
}

/* ============================================================
   WEB APP ENTRY POINTS
   ============================================================ */
function doGet(e) {
  ensureSheets();
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || 'ping';

  var result;
  try {
    switch (action) {
      case 'ping':
        result = { ok: true, msg: 'API JPKS SK Selama (K) beroperasi.', time: new Date().toISOString() };
        break;
      case 'list':
        result = handleList({ sheet: params.sheet });
        break;
      case 'listFiles':
        result = handleListFiles();
        break;
      case 'getApiKeys':
        result = handleGetApiKeys();
        break;
      default:
        result = { ok: false, error: 'Tindakan GET tidak diketahui: ' + action };
    }
  } catch (err) {
    result = { ok: false, error: err.toString() };
  }
  return jsonOut(result);
}

function doPost(e) {
  ensureSheets();
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: 'JSON tidak sah: ' + err.toString() });
  }

  var action = body.action;
  var result;
  try {
    switch (action) {
      case 'create': result = handleCreate(body); break;
      case 'update': result = handleUpdate(body); break;
      case 'delete': result = handleDelete(body); break;
      case 'uploadToDrive': result = handleUploadToDrive(body); break;
      case 'deleteFile': result = handleDeleteFile(body); break;
      case 'callGroq': result = handleCallGroq(body); break;
      default: result = { ok: false, error: 'Tindakan POST tidak diketahui: ' + action };
    }
  } catch (err) {
    result = { ok: false, error: err.toString() };
  }
  return jsonOut(result);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   CRUD HANDLERS
   ============================================================ */
function handleList(body) {
  var sheetName = body.sheet;
  var ss = getSpreadsheet();
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
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: 'Sheet tidak wujud: ' + sheetName };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { return record[h] !== undefined ? record[h] : ''; });
  var idCol = headers.indexOf('id');
  if (idCol !== -1 && !row[idCol]) {
    row[idCol] = 'rec_' + new Date().getTime();
  }
  sheet.appendRow(row);
  var newId = idCol !== -1 ? row[idCol] : null;
  return { ok: true, id: newId, msg: 'Rekod ditambah.' };
}

function handleUpdate(body) {
  var sheetName = body.sheet;
  var id = body.id;
  var record = body.record;
  var ss = getSpreadsheet();
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
  var ss = getSpreadsheet();
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
   FAIL UPLOAD / DRIVE HANDLERS
   ============================================================ */
function handleUploadToDrive(body) {
  try {
    var folder = getDriveFolder();
    var fileName = body.fileName || 'fail_' + new Date().getTime();
    var base64Data = body.fileData;
    var mimeType = body.mimeType || 'application/octet-stream';
    var tajukKecilId = body.tajukKecilId || '';

    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var url = file.getUrl();
    var saiz = file.getSize();
    var tarikh = new Date().toISOString();

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.FAIL);
    if (sheet) {
      var rowId = 'fu_' + new Date().getTime();
      sheet.appendRow([rowId, tajukKecilId, fileName, mimeType, saiz, url, fileId, tarikh]);
    }

    return { ok: true, fileId: fileId, url: url, fileName: fileName, msg: 'Fail dimuat naik ke Drive.' };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function handleListFiles() {
  var folder = getDriveFolder();
  var files = folder.getFiles();
  var result = [];
  while (files.hasNext()) {
    var f = files.next();
    result.push({ id: f.getId(), name: f.getName(), url: f.getUrl(), size: f.getSize(), date: f.getDateCreated() });
  }
  return { ok: true, files: result };
}

function handleDeleteFile(body) {
  var folder = getDriveFolder();
  var file = DriveApp.getFileById(body.fileId);
  if (file.getParents().hasNext() && file.getParents().next().getId() === folder.getId()) {
    DriveApp.getFileById(body.fileId).setTrashed(true);
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.FAIL);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var idCol = headers.indexOf('file_id');
      if (idCol !== -1) {
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][idCol]) === String(body.fileId)) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
    }
    return { ok: true, msg: 'Fail dipadam.' };
  }
  return { ok: false, error: 'Fail tidak dijumpai dalam folder.' };
}

/* ============================================================
   ENJIN PROXY AI GROQ — AUTO-ROTASI API KEY
   ============================================================ */
var GROQ_MODEL = 'llama-3.3-70b-versatile';
var GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function handleGetApiKeys() {
  var keys = getApiKeys();
  return { ok: true, count: keys.length };
}

function getApiKeys() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.APIKEY);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var keys = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && String(data[i][0]).trim() !== '') {
      keys.push(String(data[i][0]).trim());
    }
  }
  return keys;
}

function getLastKeyIndex() {
  var props = PropertiesService.getScriptProperties();
  var idx = props.getProperty('groq_last_key_index');
  return idx ? parseInt(idx) : 0;
}

function setLastKeyIndex(idx) {
  PropertiesService.getScriptProperties().setProperty('groq_last_key_index', String(idx));
}

function callGroqProxy(prompt) {
  var keys = getApiKeys();
  if (!keys || keys.length === 0) {
    return { ok: false, error: 'Tiada API Key Groq dijumpai. Sila tambah API Key dalam tab "apikey" di Google Sheets (Lajur A).' };
  }

  var startIndex = getLastKeyIndex();
  var maxAttempts = keys.length * 2;
  var lastError = '';

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    var keyIndex = (startIndex + attempt) % keys.length;
    var apiKey = keys[keyIndex];
    try {
      var response = callGroqOnce(apiKey, prompt);
      if (response.ok) {
        setLastKeyIndex(keyIndex);
        return { ok: true, result: response.content, keyIndex: keyIndex };
      }
      lastError = response.error;
      if (response.status === 429 || response.tokenExhausted) {
        continue;
      }
      return { ok: false, error: response.error };
    } catch (err) {
      lastError = err.toString();
      continue;
    }
  }
  return { ok: false, error: 'Semua API Key gagal. Ralat terakhir: ' + lastError };
}

function callGroqOnce(apiKey, prompt) {
  var payload = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: 'Anda adalah pembantu AI untuk sistem pengurusan pendidikan inklusif SK Selama (K). Jawab dalam Bahasa Malaysia.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1024
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var resp = UrlFetchApp.fetch(GROQ_URL, options);
  var code = resp.getResponseCode();
  var body = resp.getContentText();

  if (code === 200) {
    var json = JSON.parse(body);
    var content = json.choices && json.choices[0] && json.choices[0].message ? json.choices[0].message.content : '';
    return { ok: true, content: content };
  }

  var tokenExhausted = false;
  if (code === 429) tokenExhausted = true;
  try {
    var errJson = JSON.parse(body);
    if (errJson.error && errJson.error.message) {
      if (errJson.error.message.toLowerCase().indexOf('token') !== -1 || errJson.error.message.toLowerCase().indexOf('limit') !== -1 || errJson.error.message.toLowerCase().indexOf('quota') !== -1) {
        tokenExhausted = true;
      }
    }
    return { ok: false, status: code, tokenExhausted: tokenExhausted, error: errJson.error ? errJson.error.message : body };
  } catch (e) {
    return { ok: false, status: code, tokenExhausted: tokenExhausted, error: body };
  }
}

function handleCallGroq(body) {
  var prompt = body.prompt || '';
  if (!prompt) return { ok: false, error: 'Prompt kosong.' };
  return callGroqProxy(prompt);
}

/* ============================================================
   DEPLOY HELPER
   ============================================================ */
function deployWebApp() {
  Logger.log('Untuk deploy: Deploy > New deployment > Web app > Execute as: Me > Access: Anyone > Deploy');
  Logger.log('Salin URL Web App dan tampal dalam Tetapan aplikasi.');
}
