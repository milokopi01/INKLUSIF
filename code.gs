/**
 * JPKS SK Selama (K) — Google Apps Script Backend (Fasa Akhir)
 * Pangkalan data hibrid: Google Sheets + Google Drive
 * Termasuk Proxy AI Groq (llama-3.3-70b-versatile) dengan auto-rotasi API Key.
 *
 * LANGKAH:
 * 1. script.google.com -> New Project -> tampal kod ini ke Code.gs
 * 2. Jalankan setup() sekali (auto-cipta semua tab + data contoh)
 * 3. Deploy > New deployment > Web app
 *      Execute as: Me   |   Who has access: Anyone
 * 4. Salin URL /exec dan masukkan dalam Tetapan aplikasi (jika berbeza)
 * 5. Buka tab 'apikey' dalam Sheet, tampal API Key Groq percuma di A2, A3, A4, ...
 */

var SPREADSHEET_ID = '1JRKh71JpYnZoSAQJ6iZ7B2TcwefETXoCWELPHMzAJPo';
var DRIVE_FOLDER_ID = '1X4j3KueUHiN-0x3OawDz_0CzewT7dWcz';
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyPLMeW9ZuGfqeGgCsKwH5WiuyjpM1-c9f9CI7Rw_hX9sR9-kVzHJINlfw5EQlI3s7nQA/exec';

var GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
var GROQ_MODEL = 'llama-3.3-70b-versatile';

var HEADERS = {
  'Murid': ['id', 'nama', 'mykid', 'oku', 'diagnosis', 'kelas', 'jenis', 'guru_mentor', 'markah_saringan', 'status'],
  'Saringan': ['id', 'murid_id', 'nama', 'tarikh', 'instrumen', 'markah', 'keputusan', 'catatan'],
  'Guru': ['id', 'nama', 'gred', 'opsyen', 'subjek'],
  'Prasarana': ['id', 'item', 'lokasi', 'status', 'catatan'],
  'Carta_Organisasi': ['jawatan', 'nama', 'jawatan_full'],
  'Fail_Upload': ['id', 'tajukKecilId', 'fileName', 'mimeType', 'saiz', 'url', 'fileId', 'tarikh'],
  'apikey': ['API_KEY']
};

var SEED = {
  'Murid': [
    ['s1', 'Muhammad Amirul bin Roslan', '150112085341', 'LD120415000084', 'Slow Learner', '1 Bestari', 'Inklusif Separa', 'Pn. Siti Aminah', 64, 'Layak Inklusif Separa (Bukan Akademik)'],
    ['s2', 'Chong Wei Han', '120520085113', 'DE120520000122', 'Masalah Pendengaran', '4 Amanah', 'Inklusif Separa', 'Cik Norashikin', 76, 'Layak Inklusif Separa (Akademik)'],
    ['s3', 'Farah Shahidah binti Ahmad', '100714085442', 'LD120710000213', 'Autisme Ringan', '6 Dedikasi', 'Inklusif Separa', 'En. Mohd Zaki', 84, 'Layak Inklusif Separa (Akademik)']
  ],
  'Saringan': [
    ['sr1', 's1', 'Muhammad Amirul bin Roslan', '2026-01-12', 'Instrumen Saringan Inklusif KPM', 64, 'Layak Inklusif Separa (Bukan Akademik)', 'Perlu sokongan bacaan & pengiraan asas'],
    ['sr2', 's2', 'Chong Wei Han', '2026-01-12', 'Instrumen Saringan Inklusif KPM', 76, 'Layak Inklusif Separa (Akademik)', 'Guna alat bantu pendengaran, duduk barisan hadapan'],
    ['sr3', 's3', 'Farah Shahidah binti Ahmad', '2026-01-13', 'Instrumen Saringan Inklusif KPM', 84, 'Layak Inklusif Separa (Akademik)', 'Perlu jadual visual & ruang tenang']
  ],
  'Guru': [
    ['t1', 'En. Ahmad bin Isa', 'DG44', 'Pendidikan Khas', 'Matematik'],
    ['t2', 'Pn. Siti Aminah binti Ramli', 'DG44', 'Pendidikan Khas', 'Bahasa Melayu'],
    ['t3', 'Cik Norashikin binti Mohd Yusof', 'DG41', 'Pendidikan Khas', 'Bahasa Inggeris'],
    ['t4', 'En. Mohd Zaki bin Ridzuan', 'DG41', 'Pendidikan Khas', 'Sains'],
    ['t5', 'Pn. Faridah binti Kassim', 'DG44', 'Terapi Cara Kerja', 'Pend. Seni Visual']
  ],
  'Prasarana': [
    ['pr1', 'Tempat Letak Kerusi Roda', 'Hadapan Blok A', 'Ada', '2 petak disediakan'],
    ['pr2', 'Ramp Tangga Lereng', 'Pintu Utama', 'Ada', 'Mengikut spesifikasi KPM'],
    ['pr3', 'Tandas Mesra OKU', 'Bawah & Tingkat 1', 'Ada', 'Grab bar & alarm kecemasan'],
    ['pr4', 'Laluan Taktil', 'Koridor Utama', 'Tiada', 'Perlu penambahbaikan'],
    ['pr5', 'Papan Tanda Braille', 'Bilik PPKI', 'Tiada', 'Dalam perancangan'],
    ['pr6', 'Ruang Selamat / Sensory Room', 'Bilik PPKI', 'Ada', 'Lengkap dengan alat terapi']
  ],
  'Carta_Organisasi': [
    ['Pengerusi', 'Tn. Hj. Abdul Rahman bin Hassan', 'Guru Besar'],
    ['Naib Pengerusi', 'Pn. Hajjah Norliza binti Othman', 'Penolong Kanan Pentadbiran'],
    ['Penyelaras', 'En. Ahmad bin Isa', 'Penyelaras PPKI'],
    ['Guru Pendamping', 'Pn. Siti Aminah binti Ramli', 'Guru PPKI'],
    ['PPM', 'Pn. Rosnah binti Abdullah', 'Pembantu Pendidikan Murid']
  ],
  'Fail_Upload': [],
  'apikey': []
};

/* ============================================================
   SETUP / AUTO-CREATE
   ============================================================ */
function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getFolder() {
  return DriveApp.getFolderById(DRIVE_FOLDER_ID);
}

function setup() {
  ensureAllSheets();
  Logger.log('Setup selesai. Web App URL: ' + WEB_APP_URL);
}

function ensureAllSheets() {
  var ss = getSS();
  for (var name in HEADERS) {
    ensureSheet(ss, name);
  }
  return ss;
}

function ensureSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet(name);
    created = true;
  }
  var headers = HEADERS[name];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#dbeafe');
    sheet.setFrozenRows(1);
    created = true;
  }
  // Auto-populate data contoh hanya jika kosong
  if (sheet.getLastRow() <= 1 && SEED[name] && SEED[name].length) {
    sheet.getRange(2, 1, SEED[name].length, SEED[name][0].length).setValues(SEED[name]);
  }
  return sheet;
}

/* ============================================================
   HELPER BACA / TULIS
   ============================================================ */
function readSheet(name) {
  var ss = ensureAllSheets();
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    var empty = true;
    for (var j = 0; j < headers.length; j++) {
      var v = values[i][j];
      obj[headers[j]] = v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : v;
      if (v !== '' && v !== null) empty = false;
    }
    obj._row = i + 1;
    if (!empty) rows.push(obj);
  }
  return rows;
}

function appendRow(name, obj) {
  var ss = ensureAllSheets();
  var sheet = ss.getSheetByName(name);
  var headers = HEADERS[name] || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!obj.id && headers.indexOf('id') !== -1) obj.id = Utilities.getUuid().slice(0, 8);
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
  return obj;
}

function updateRow(name, obj) {
  var ss = ensureAllSheets();
  var sheet = ss.getSheetByName(name);
  var headers = HEADERS[name];
  var values = sheet.getDataRange().getValues();
  var keyIdx = headers.indexOf('id') !== -1 ? headers.indexOf('id') : 0;
  var key = headers.indexOf('id') !== -1 ? obj.id : obj[headers[0]];
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][keyIdx]) === String(key)) {
      var row = headers.map(function (h, j) { return obj[h] !== undefined ? obj[h] : values[i][j]; });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return obj;
    }
  }
  return appendRow(name, obj);
}

function deleteRow(name, id) {
  var ss = ensureAllSheets();
  var sheet = ss.getSheetByName(name);
  var headers = HEADERS[name];
  var keyIdx = headers.indexOf('id') !== -1 ? headers.indexOf('id') : 0;
  var values = sheet.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][keyIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function replaceAll(name, rows) {
  var ss = ensureAllSheets();
  var sheet = ss.getSheetByName(name);
  var headers = HEADERS[name];
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  if (rows && rows.length) {
    var data = rows.map(function (o) { return headers.map(function (h) { return o[h] !== undefined ? o[h] : ''; }); });
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  return rows || [];
}

/* ============================================================
   UPLOAD KE GOOGLE DRIVE
   ============================================================ */
function uploadToDrive(base64Data, fileName, tajukKecilId) {
  var clean = String(base64Data).indexOf('base64,') !== -1
    ? String(base64Data).split('base64,')[1]
    : String(base64Data);
  var mime = 'application/octet-stream';
  var m = String(base64Data).match(/^data:([^;]+);base64,/);
  if (m) mime = m[1];

  var blob = Utilities.newBlob(Utilities.base64Decode(clean), mime, fileName);
  var file = getFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var rec = {
    id: Utilities.getUuid().slice(0, 8),
    tajukKecilId: tajukKecilId || '',
    fileName: fileName,
    mimeType: mime,
    saiz: file.getSize(),
    url: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
    fileId: file.getId(),
    tarikh: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  };
  appendRow('Fail_Upload', rec);
  return rec;
}

function deleteDriveFile(fileId, id) {
  try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}
  deleteRow('Fail_Upload', id);
  return true;
}

/* ============================================================
   PROXY AI GROQ + AUTO-ROTASI API KEY
   ============================================================ */
function getApiKeys() {
  var ss = ensureAllSheets();
  var sheet = ss.getSheetByName('apikey');
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  var keys = [];
  for (var i = 0; i < values.length; i++) {
    var k = String(values[i][0]).trim();
    if (k) keys.push(k);
  }
  return keys;
}

function callGroqProxy(prompt, systemPrompt) {
  var keys = getApiKeys();
  if (!keys.length) {
    throw new Error("Tiada API Key Groq. Sila tampal kunci di tab 'apikey' Lajur A (A2, A3, ...).");
  }

  var props = PropertiesService.getScriptProperties();
  var start = parseInt(props.getProperty('GROQ_KEY_INDEX') || '0', 10);
  if (isNaN(start) || start < 0 || start >= keys.length) start = 0;

  var payload = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt || 'Anda pakar pendidikan khas Kementerian Pendidikan Malaysia. Jawab dalam Bahasa Melayu rasmi, padat dan profesional.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1600
  };

  var lastError = '';
  // Cuba setiap kunci sekali, bermula dari indeks terakhir yang berjaya (round-robin)
  for (var n = 0; n < keys.length; n++) {
    var idx = (start + n) % keys.length;
    try {
      var res = UrlFetchApp.fetch(GROQ_URL, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + keys[idx] },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      var code = res.getResponseCode();
      var body = res.getContentText();

      if (code === 200) {
        var json = JSON.parse(body);
        var text = json.choices && json.choices[0] && json.choices[0].message
          ? json.choices[0].message.content : '';
        props.setProperty('GROQ_KEY_INDEX', String(idx));
        return text;
      }

      // 429 = limit / token exhausted, 401/403 = kunci tidak sah -> auto rotate senyap
      lastError = 'HTTP ' + code + ': ' + body.slice(0, 200);
      if (code === 429 || code === 401 || code === 403 || code >= 500) {
        Utilities.sleep(400);
        continue;
      }
      // Ralat lain (contoh 400) tidak akan pulih dengan kunci lain
      throw new Error(lastError);
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error('Semua API Key Groq gagal. Ralat terakhir: ' + lastError);
}

/* ============================================================
   ROUTER API
   ============================================================ */
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    ensureAllSheets();
    var p = (e && e.parameter) || {};
    var action = p.action || 'ping';

    if (action === 'ping') {
      return json({ ok: true, message: 'JPKS API aktif', sheets: Object.keys(HEADERS), url: WEB_APP_URL });
    }
    if (action === 'get' || action === 'list') {
      return json({ ok: true, data: readSheet(p.sheet) });
    }
    if (action === 'all') {
      var out = {};
      for (var name in HEADERS) { if (name !== 'apikey') out[name] = readSheet(name); }
      return json({ ok: true, data: out });
    }
    if (action === 'ai') {
      return json({ ok: true, data: callGroqProxy(p.prompt || '', p.system || '') });
    }
    return json({ ok: false, error: 'Action tidak dikenali: ' + action });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    ensureAllSheets();

    var req = {};
    if (e && e.postData && e.postData.contents) req = JSON.parse(e.postData.contents);
    else if (e && e.parameter) req = e.parameter;

    var action = req.action || '';
    var sheet = req.sheet || '';

    switch (action) {
      case 'ping':
        return json({ ok: true, message: 'JPKS API aktif' });

      case 'get':
      case 'list':
        return json({ ok: true, data: readSheet(sheet) });

      case 'all':
        var all = {};
        for (var name in HEADERS) { if (name !== 'apikey') all[name] = readSheet(name); }
        return json({ ok: true, data: all });

      case 'add':
      case 'create':
        return json({ ok: true, data: appendRow(sheet, req.data || {}) });

      case 'update':
      case 'edit':
        return json({ ok: true, data: updateRow(sheet, req.data || {}) });

      case 'delete':
      case 'remove':
        return json({ ok: true, data: deleteRow(sheet, req.id) });

      case 'replaceAll':
      case 'saveAll':
        return json({ ok: true, data: replaceAll(sheet, req.rows || []) });

      case 'upload':
        return json({ ok: true, data: uploadToDrive(req.base64Data || req.base64, req.fileName, req.tajukKecilId) });

      case 'deleteFile':
        return json({ ok: true, data: deleteDriveFile(req.fileId, req.id) });

      case 'ai':
      case 'groq':
        return json({ ok: true, data: callGroqProxy(req.prompt || '', req.system || '') });

      default:
        return json({ ok: false, error: 'Action tidak dikenali: ' + action });
    }
  } catch (err) {
    return json({ ok: false, error: err.message });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

/* ============================================================
   UJIAN PANTAS (jalankan dari editor)
   ============================================================ */
function testAI() {
  Logger.log(callGroqProxy('Tulis satu ayat motivasi untuk guru pendidikan khas.'));
}

function deployWebApp() {
  Logger.log('Deploy manual: Deploy > New deployment > Web app > Execute as Me > Anyone.');
  Logger.log('URL semasa: ' + WEB_APP_URL);
}
