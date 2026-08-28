/** ============================================================
 *  SISTEM PENGURUSAN MURID SARINGAN — code.gs
 *  Backend penuh: Google Sheets + Google Drive + Groq AI Proxy
 *  Fail: code.gs (1 daripada 4 fail utama)
 * ============================================================ */

// ===== KONFIGURASI UTAMA =====
var CONFIG = {
  SHEET_ID:     '1JRKh71JpYnZoSAQJ6iZ7B2TcwefETXoCWELPHMzAJPo',
  DRIVE_FOLDER: '1X4j3KueUHiN-0x3OawDz_0CzewT7dWcz',
  WEB_APP_URL:  'https://script.google.com/macros/s/AKfycbyPLMeW9ZuGfqeGgCsKwH5WiuyjpM1-c9f9CI7Rw_hX9sR9-kVzHJINlfw5EQlI3s7nQA/exec',
  GROQ_MODEL:   'llama-3.3-70b-versatile',
  GROQ_URL:     'https://api.groq.com/openai/v1/chat/completions'
};

// Nama tab dalam Google Sheet
var TAB = {
  MURID:           'Murid',
  SARINGAN:        'Saringan',
  GURU:            'Guru',
  PRASARANA:       'Prasarana',
  CARTA_ORG:       'Carta_Organisasi',
  FAIL_UPLOAD:     'Fail_Upload',
  APIKEY:          'apikey'
};

// ===== DATA CONTOH FASA 1 =====
var DATA_MURID = [
  ['No', 'Nama', 'Kelas', 'Jantina', 'Tarikh Saringan', 'Status Saringan', 'Catatan'],
  [1, 'Ahmad Bin Ali', '3 Bestari', 'Lelaki', '2024-01-15', 'Lulus', 'Penglihatan normal'],
  [2, 'Siti Aishah Bt Hassan', '3 Bestari', 'Perempuan', '2024-01-15', 'Lulus', 'Pendengaran normal'],
  [3, 'Mohd Faizal Bin Rahman', '3 Cemerlang', 'Lelaki', '2024-01-16', 'Rujuk', 'Memerlukan pemeriksaan lanjut']
];

var DATA_GURU = [
  ['No', 'Nama', 'No. KP', 'Jawatan', 'Kelas', 'No. Telefon', 'E-mel'],
  [1, 'Pn. Nurul Huda Bt Abdullah', '800101-01-1234', 'Guru Besar', '-', '0123456789', 'nurul@sk.edu.my'],
  [2, 'En. Kamal Bin Ismail', '810205-08-5678', 'PK 1 (Akademik)', '-', '0129876543', 'kamal@sk.edu.my'],
  [3, 'Pn. Faridah Bt Yusof', '820310-02-9101', 'PK Pentadbiran', '-', '0134567890', 'faridah@sk.edu.my'],
  [4, 'En. Rashid Bin Omar', '830415-08-2345', 'Guru Kelas 3 Bestari', '3 Bestari', '0145678901', 'rashid@sk.edu.my'],
  [5, 'Pn. Kavitha A/P Maniam', '840520-04-6789', 'Guru Kelas 3 Cemerlang', '3 Cemerlang', '0156789012', 'kavitha@sk.edu.my']
];

var DATA_SARINGAN = [
  ['No', 'Nama Murid', 'Kelas', 'Tarikh Saringan', 'Jenis Saringan', 'Hasil', 'Saring Oleh', 'Catatan'],
  [1, 'Ahmad Bin Ali', '3 Bestari', '2024-01-15', 'Penglihatan', 'Lulus', 'Pn. Nurul Huda', '20/20 kedua-dua mata'],
  [2, 'Siti Aishah Bt Hassan', '3 Bestari', '2024-01-15', 'Pendengaran', 'Lulus', 'Pn. Nurul Huda', 'Frekuensi normal'],
  [3, 'Mohd Faizal Bin Rahman', '3 Cemerlang', '2024-01-16', 'Penglihatan', 'Rujuk', 'En. Rashid', 'Kabur pada mata kiri']
];

var DATA_PRASARANA = [
  ['Jenis', 'Nama / Lokasi', 'Bilangan', 'Keadaan', 'Catatan'],
  ['Bilik Darjah', 'Bilik Darjah 3 Bestari', 1, 'Baik', 'Papan putih berfungsi'],
  ['Bilik Darjah', 'Bilik Darjah 3 Cemerlang', 1, 'Baik', 'Pendingin hawa berfungsi'],
  ['Makmal', 'Makmal Sains', 1, 'Sederhana', 'Memerlukan penghawa dingin baharu'],
  ['Pusat Sumber', 'Bilik Pusat Sumber', 1, 'Baik', '1200 buah buku'],
  ['Kantin', 'Kantin Sekolah', 1, 'Baik', 'Kapasiti 60 orang']
];

var DATA_CARTA_ORG = [
  ['Jawatan', 'Nama', 'Gred', 'Skop Tanggungjawab'],
  ['Guru Besar', 'Pn. Nurul Huda Bt Abdullah', 'Jusa C', 'Pimpinan keseluruhan sekolah'],
  ['PK 1 (Akademik)', 'En. Kamal Bin Ismail', 'DG52', 'Kurikulum & Akademik'],
  ['PK Pentadbiran', 'Pn. Faridah Bt Yusof', 'DG52', 'Pentadbiran & Kewangan'],
  ['Guru Kelas 3 Bestari', 'En. Rashid Bin Omar', 'DG44', 'Pengurusan kelas 3 Bestari'],
  ['Guru Kelas 3 Cemerlang', 'Pn. Kavitha A/P Maniam', 'DG44', 'Pengurusan kelas 3 Cemerlang']
];

var DATA_APIKEY = [
  ['API_KEY']
  // Guru menampal API Key Groq di bawah: A2, A3, A4, ...
];

// ===== UTILITI SHEET =====

function getSS() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

function getSheet(tabName) {
  var ss = getSS();
  return ss.getSheetByName(tabName);
}

function ensureSheet(tabName, dataRows) {
  var ss = getSS();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    if (dataRows && dataRows.length > 0) {
      var rows = dataRows.length;
      var cols = dataRows[0].length;
      sheet.getRange(1, 1, rows, cols).setValues(dataRows);
    }
  }
  return sheet;
}

function ensureAllSheets() {
  ensureSheet(TAB.MURID,       DATA_MURID);
  ensureSheet(TAB.SARINGAN,    DATA_SARINGAN);
  ensureSheet(TAB.GURU,        DATA_GURU);
  ensureSheet(TAB.PRASARANA,   DATA_PRASARANA);
  ensureSheet(TAB.CARTA_ORG,   DATA_CARTA_ORG);
  ensureSheet(TAB.FAIL_UPLOAD, [['No', 'TajukKecilId', 'Nama Fail', 'URL Pautan', 'Fail ID', 'Mime Type', 'Saiz (KB)', 'Tarikh Upload']]);
  ensureSheet(TAB.APIKEY,      DATA_APIKEY);
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    obj._rowIndex = i + 1; // 1-based row in sheet
    results.push(obj);
  }
  return results;
}

// ===== doGet / doPost =====

function doGet(e) {
  ensureAllSheets();

  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'all';
  var result = {};

  switch (action) {
    case 'murid':
      result = { status: 'ok', data: sheetToObjects(getSheet(TAB.MURID)) };
      break;
    case 'saringan':
      result = { status: 'ok', data: sheetToObjects(getSheet(TAB.SARINGAN)) };
      break;
    case 'guru':
      result = { status: 'ok', data: sheetToObjects(getSheet(TAB.GURU)) };
      break;
    case 'prasarana':
      result = { status: 'ok', data: sheetToObjects(getSheet(TAB.PRASARANA)) };
      break;
    case 'carta':
      result = { status: 'ok', data: sheetToObjects(getSheet(TAB.CARTA_ORG)) };
      break;
    case 'fail_upload':
      result = { status: 'ok', data: sheetToObjects(getSheet(TAB.FAIL_UPLOAD)) };
      break;
    case 'apikey_count':
      result = { status: 'ok', count: getApiKeys().length };
      break;
    case 'all':
    default:
      result = {
        status: 'ok',
        murid:     sheetToObjects(getSheet(TAB.MURID)),
        saringan:  sheetToObjects(getSheet(TAB.SARINGAN)),
        guru:      sheetToObjects(getSheet(TAB.GURU)),
        prasarana: sheetToObjects(getSheet(TAB.PRASARANA)),
        carta:     sheetToObjects(getSheet(TAB.CARTA_ORG)),
        failUpload: sheetToObjects(getSheet(TAB.FAIL_UPLOAD))
      };
      break;
  }

  return jsonOut(result);
}

function doPost(e) {
  ensureAllSheets();

  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ status: 'error', message: 'JSON tidak sah: ' + err.message });
  }

  var action = body.action || '';
  var result = {};

  switch (action) {
    case 'tambah_murid':      result = tambahMurid(body); break;
    case 'edit_murid':        result = editMurid(body); break;
    case 'padam_murid':       result = padamMurid(body); break;

    case 'tambah_saringan':   result = tambahSaringan(body); break;
    case 'edit_saringan':     result = editSaringan(body); break;
    case 'padam_saringan':    result = padamSaringan(body); break;

    case 'tambah_guru':       result = tambahGuru(body); break;
    case 'edit_guru':         result = editGuru(body); break;
    case 'padam_guru':        result = padamGuru(body); break;

    case 'tambah_prasarana':  result = tambahPrasarana(body); break;
    case 'edit_prasarana':    result = editPrasarana(body); break;
    case 'padam_prasarana':   result = padamPrasarana(body); break;

    case 'tambah_carta':      result = tambahCarta(body); break;
    case 'edit_carta':        result = editCarta(body); break;
    case 'padam_carta':       result = padamCarta(body); break;

    case 'padam_fail':        result = padamFail(body); break;
    case 'upload_file':       result = uploadToDrive(body.base64Data, body.fileName, body.tajukKecilId); break;

    case 'call_ai':           result = callGroqProxy(body.prompt); break;

    default:
      result = { status: 'error', message: 'Action tidak diketahui: ' + action };
  }

  return jsonOut(result);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== CRUD: MURID =====

function tambahMurid(body) {
  var sheet = ensureSheet(TAB.MURID, DATA_MURID);
  var data = sheet.getDataRange().getValues();
  var nextNo = data.length;
  sheet.appendRow([nextNo, body.nama, body.kelas, body.jantina, body.tarikh, body.status, body.catatan || '']);
  return { status: 'ok', message: 'Murid ditambah', no: nextNo };
}

function editMurid(body) {
  var sheet = getSheet(TAB.MURID);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(body.no)) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        body.no, body.nama, body.kelas, body.jantina, body.tarikh, body.status, body.catatan || ''
      ]]);
      return { status: 'ok', message: 'Murid dikemaskini' };
    }
  }
  return { status: 'error', message: 'Murid tidak dijumpai' };
}

function padamMurid(body) {
  var sheet = getSheet(TAB.MURID);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(body.no)) {
      sheet.deleteRow(i + 1);
      return { status: 'ok', message: 'Murid dipadam' };
    }
  }
  return { status: 'error', message: 'Murid tidak dijumpai' };
}

// ===== CRUD: SARINGAN =====

function tambahSaringan(body) {
  var sheet = ensureSheet(TAB.SARINGAN, DATA_SARINGAN);
  var data = sheet.getDataRange().getValues();
  var nextNo = data.length;
  sheet.appendRow([nextNo, body.nama, body.kelas, body.tarikh, body.jenis, body.hasil, body.saringOleh, body.catatan || '']);
  return { status: 'ok', message: 'Saringan ditambah', no: nextNo };
}

function editSaringan(body) {
  var sheet = getSheet(TAB.SARINGAN);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(body.no)) {
      sheet.getRange(i + 1, 1, 1, 8).setValues([[
        body.no, body.nama, body.kelas, body.tarikh, body.jenis, body.hasil, body.saringOleh, body.catatan || ''
      ]]);
      return { status: 'ok', message: 'Saringan dikemaskini' };
    }
  }
  return { status: 'error', message: 'Saringan tidak dijumpai' };
}

function padamSaringan(body) {
  var sheet = getSheet(TAB.SARINGAN);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(body.no)) {
      sheet.deleteRow(i + 1);
      return { status: 'ok', message: 'Saringan dipadam' };
    }
  }
  return { status: 'error', message: 'Saringan tidak dijumpai' };
}

// ===== CRUD: GURU =====

function tambahGuru(body) {
  var sheet = ensureSheet(TAB.GURU, DATA_GURU);
  var data = sheet.getDataRange().getValues();
  var nextNo = data.length;
  sheet.appendRow([nextNo, body.nama, body.noKp, body.jawatan, body.kelas || '-', body.telefon, body.emel]);
  return { status: 'ok', message: 'Guru ditambah', no: nextNo };
}

function editGuru(body) {
  var sheet = getSheet(TAB.GURU);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(body.no)) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        body.no, body.nama, body.noKp, body.jawatan, body.kelas || '-', body.telefon, body.emel
      ]]);
      return { status: 'ok', message: 'Guru dikemaskini' };
    }
  }
  return { status: 'error', message: 'Guru tidak dijumpai' };
}

function padamGuru(body) {
  var sheet = getSheet(TAB.GURU);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(body.no)) {
      sheet.deleteRow(i + 1);
      return { status: 'ok', message: 'Guru dipadam' };
    }
  }
  return { status: 'error', message: 'Guru tidak dijumpai' };
}

// ===== CRUD: PRASARANA =====

function tambahPrasarana(body) {
  var sheet = ensureSheet(TAB.PRASARANA, DATA_PRASARANA);
  sheet.appendRow([body.jenis, body.nama, body.bilangan, body.keadaan, body.catatan || '']);
  return { status: 'ok', message: 'Prasarana ditambah' };
}

function editPrasarana(body) {
  var sheet = getSheet(TAB.PRASARANA);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.jenisLama && data[i][1] === body.namaLama) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[
        body.jenis, body.nama, body.bilangan, body.keadaan, body.catatan || ''
      ]]);
      return { status: 'ok', message: 'Prasarana dikemaskini' };
    }
  }
  return { status: 'error', message: 'Prasarana tidak dijumpai' };
}

function padamPrasarana(body) {
  var sheet = getSheet(TAB.PRASARANA);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.jenis && data[i][1] === body.nama) {
      sheet.deleteRow(i + 1);
      return { status: 'ok', message: 'Prasarana dipadam' };
    }
  }
  return { status: 'error', message: 'Prasarana tidak dijumpai' };
}

// ===== CRUD: CARTA ORGANISASI =====

function tambahCarta(body) {
  var sheet = ensureSheet(TAB.CARTA_ORG, DATA_CARTA_ORG);
  sheet.appendRow([body.jawatan, body.nama, body.gred, body.skop]);
  return { status: 'ok', message: 'Carta organisasi ditambah' };
}

function editCarta(body) {
  var sheet = getSheet(TAB.CARTA_ORG);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.jawatanLama) {
      sheet.getRange(i + 1, 1, 1, 4).setValues([[
        body.jawatan, body.nama, body.gred, body.skop
      ]]);
      return { status: 'ok', message: 'Carta organisasi dikemaskini' };
    }
  }
  return { status: 'error', message: 'Carta tidak dijumpai' };
}

function padamCarta(body) {
  var sheet = getSheet(TAB.CARTA_ORG);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === body.jawatan) {
      sheet.deleteRow(i + 1);
      return { status: 'ok', message: 'Carta dipadam' };
    }
  }
  return { status: 'error', message: 'Carta tidak dijumpai' };
}

// ===== FAIL UPLOAD =====

function padamFail(body) {
  var sheet = getSheet(TAB.FAIL_UPLOAD);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][5] === body.fileId) {
      try { DriveApp.getFileById(body.fileId).setTrashed(true); } catch (e) {}
      sheet.deleteRow(i + 1);
      return { status: 'ok', message: 'Fail dipadam' };
    }
  }
  return { status: 'error', message: 'Fail tidak dijumpai' };
}

/**
 * uploadToDrive(base64Data, fileName, tajukKecilId)
 * Terima fail Base64 dari index.html, simpan ke Drive folder,
 * setkan hak akses kepada "Anyone dengan pautan boleh tonton",
 * dan tulis URL pautan + metadata ke tab 'Fail_Upload'.
 */
function uploadToDrive(base64Data, fileName, tajukKecilId) {
  try {
    var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER);
    var bytes  = Utilities.base64Decode(base64Data);
    var blob   = Utilities.newBlob(bytes, 'application/octet-stream', fileName);
    var file   = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId   = file.getId();
    var fileUrl  = file.getUrl();
    var mimeType = file.getMimeType();
    var sizeKB   = Math.round(file.getSize() / 1024);
    var tarikh   = new Date().toISOString();

    var sheet = ensureSheet(TAB.FAIL_UPLOAD, [['No', 'TajukKecilId', 'Nama Fail', 'URL Pautan', 'Fail ID', 'Mime Type', 'Saiz (KB)', 'Tarikh Upload']]);
    var data  = sheet.getDataRange().getValues();
    var nextNo = data.length;

    sheet.appendRow([nextNo, tajukKecilId || '', fileName, fileUrl, fileId, mimeType, sizeKB, tarikh]);

    return {
      status: 'ok',
      message: 'Fail berjaya dimuat naik',
      fileUrl: fileUrl,
      fileId: fileId,
      fileName: fileName,
      mimeType: mimeType,
      sizeKB: sizeKB
    };
  } catch (err) {
    return { status: 'error', message: 'Gagal memuat naik fail: ' + err.message };
  }
}

// ===== GROQ AI PROXY DENGAN AUTO-ROTASI API KEY =====

function getApiKeys() {
  var sheet = ensureSheet(TAB.APIKEY, DATA_APIKEY);
  var data  = sheet.getDataRange().getValues();
  var keys  = [];
  for (var i = 1; i < data.length; i++) {
    var val = data[i][0];
    if (val && String(val).trim().length > 0) {
      keys.push(String(val).trim());
    }
  }
  return keys;
}

function getLastKeyIndex() {
  var props = PropertiesService.getScriptProperties();
  var idx   = props.getProperty('groq_last_key_index');
  return idx ? Number(idx) : 0;
}

function setLastKeyIndex(idx) {
  PropertiesService.getScriptProperties().setProperty('groq_last_key_index', String(idx));
}

/**
 * callGroqProxy(prompt)
 * Frontend hanya hantar prompt → proxy ini uruskan panggilan Groq.
 * Baca API key dari tab 'apikey', panggil Groq API.
 * Jika 429 / token exhausted, tangkap senyap, auto-rotate ke kunci seterusnya.
 * Ulang sehingga berjaya. Kunci terakhir → ulang dari awal.
 */
function callGroqProxy(prompt) {
  if (!prompt || prompt.trim().length === 0) {
    return { status: 'error', message: 'Prompt kosong' };
  }

  var keys = getApiKeys();
  if (keys.length === 0) {
    return { status: 'error', message: 'Tiada API Key Groq didapati. Sila tampal API Key di tab "apikey" dalam Google Sheet.' };
  }

  var startIdx   = getLastKeyIndex() % keys.length;
  var currentIdx = startIdx;
  var maxAttempts = keys.length * 2; // 2 pusingan penuh sebagai langkah keselamatan

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    var apiKey = keys[currentIdx];

    try {
      var payload = {
        model: CONFIG.GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Anda ialah pembantu AI untuk sistem pengurusan murid saringan sekolah rendah di Malaysia. Jawab dalam Bahasa Malaysia yang sopan dan ringkas. Bantu guru dalam analisis data murid, saringan kesihatan, dan pengurusan sekolah.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      };

      var options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      var response = UrlFetchApp.fetch(CONFIG.GROQ_URL, options);
      var respCode = response.getResponseCode();
      var respText = response.getContentText();

      // Berjaya
      if (respCode === 200) {
        var json = JSON.parse(respText);
        var aiText = json.choices[0].message.content;
        setLastKeyIndex(currentIdx);
        return {
          status: 'ok',
          response: aiText,
          keyIndex: currentIdx
        };
      }

      // 429 — rate limit / token exhausted, atau 401/403 — kunci tidak sah
      if (respCode === 429 || respCode === 401 || respCode === 403) {
        // Tangkap ralat senyap, rotate ke kunci seterusnya
        currentIdx = (currentIdx + 1) % keys.length;
        continue;
      }

      // Ralat lain — cuba kunci seterusnya juga
      currentIdx = (currentIdx + 1) % keys.length;
      continue;

    } catch (err) {
      // Ralat rangkaian — rotate ke kunci seterusnya
      currentIdx = (currentIdx + 1) % keys.length;
      continue;
    }
  }

  return {
    status: 'error',
    message: 'Semua API Key telah dicuba dan gagal. Sila tambah API Key Groq baharu di tab "apikey".'
  };
}
