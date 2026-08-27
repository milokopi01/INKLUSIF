/* ============================================================
   SPIB PPKI - Google Apps Script Backend
   Pangkalan Data: Google Sheet
   ============================================================ */

// ID Google Sheet & Folder (Pengkalan Data)
var SHEET_ID = '1wR4WejdKEWAPYSMOJNDX3a7W2H-zq4lY4yWKguJBI0U';
var FOLDER_ID = '1X4j3KueUHiN-0x3OawDz_0CzewT7dWcz';

// Nama-nama sheet dalam Google Sheet
var SHEETS = {
  MURID: 'Murid',
  GURU: 'Guru',
  SARINGAN: 'Saringan',
  PRASARANA: 'Prasarana',
  LOG_IBU_BAPA: 'LogIbuBapa',
  CARTA: 'Carta',
  MARKAH: 'Markah'
};

// Header (lajur) bagi setiap sheet - auto create jika tiada
var SHEET_HEADERS = {
  Murid: ['id', 'nama', 'mykid', 'diagnosis', 'kelas', 'skor', 'tindakan'],
  Guru: ['id', 'nama', 'opsyen', 'kelasBimbingan', 'subjek', 'jadualWaktu'],
  Saringan: ['id', 'muridId', 'tarikh', 'domain', 'skor', 'kategori', 'butiran', 'logIbuBapa'],
  Prasarana: ['id', 'jenis', 'lokasi', 'status', 'catatan'],
  LogIbuBapa: ['muridId', 'tarikh', 'perkara'],
  Carta: ['id', 'pemegang', 'nama', 'peranan', 'ikon', 'tier', 'warna'],
  Markah: ['muridId', 'bm', 'bi', 'mt', 'sj', 'ulasan']
};

/* ============================================================
   WEB APP ENTRY POINTS (doGet / doPost)
   ============================================================ */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';
  var result;

  try {
    switch (action) {
      case 'getAll':
        result = { success: true, data: getAllData() };
        break;
      case 'getMurid':
        result = { success: true, data: getSheetData(SHEETS.MURID) };
        break;
      case 'getGuru':
        result = { success: true, data: getSheetData(SHEETS.GURU) };
        break;
      case 'getSaringan':
        result = { success: true, data: getSheetData(SHEETS.SARINGAN) };
        break;
      case 'getPrasarana':
        result = { success: true, data: getSheetData(SHEETS.PRASARANA) };
        break;
      case 'getLogIbuBapa':
        result = { success: true, data: getSheetData(SHEETS.LOG_IBU_BAPA) };
        break;
      case 'getCarta':
        result = { success: true, data: getSheetData(SHEETS.CARTA) };
        break;
      case 'getMarkah':
        result = { success: true, data: getSheetData(SHEETS.MARKAH) };
        break;
      case 'init':
        result = { success: true, data: 'Pangkalan data SPIB PPKI sedia digunakan.' };
        break;
      default:
        result = { success: false, error: 'Tindakan tidak diketahui: ' + action };
    }
  } catch (err) {
    result = { success: false, error: String(err) };
  }

  return jsonOut(result);
}

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ success: false, error: 'JSON tidak sah' });
  }

  var action = payload.action;
  var result;

  try {
    switch (action) {
      case 'saveMurid':
        upsertRow(SHEETS.MURID, 'id', payload.murid);
        result = { success: true, data: payload.murid };
        break;
      case 'deleteMurid':
        deleteRow(SHEETS.MURID, 'id', payload.id);
        result = { success: true, data: 'Murid dipadam' };
        break;
      case 'saveGuru':
        upsertRow(SHEETS.GURU, 'id', payload.guru);
        result = { success: true, data: payload.guru };
        break;
      case 'saveSaringan':
        upsertRow(SHEETS.SARINGAN, 'id', payload.saringan);
        result = { success: true, data: payload.saringan };
        break;
      case 'savePrasarana':
        upsertRow(SHEETS.PRASARANA, 'id', payload.prasarana);
        result = { success: true, data: payload.prasarana };
        break;
      case 'deletePrasarana':
        deleteRow(SHEETS.PRASARANA, 'id', payload.id);
        result = { success: true, data: 'Prasarana dipadam' };
        break;
      case 'saveLogIbuBapa':
        appendRow(SHEETS.LOG_IBU_BAPA, payload.log);
        result = { success: true, data: payload.log };
        break;
      case 'deleteLogIbuBapa':
        deleteRowByIndex(SHEETS.LOG_IBU_BAPA, payload.index);
        result = { success: true, data: 'Log dipadam' };
        break;
      case 'saveCarta':
        upsertRow(SHEETS.CARTA, 'id', payload.carta);
        result = { success: true, data: payload.carta };
        break;
      case 'deleteCarta':
        deleteRow(SHEETS.CARTA, 'id', payload.id);
        result = { success: true, data: 'Carta dipadam' };
        break;
      case 'saveMarkah':
        upsertRow(SHEETS.MARKAH, 'muridId', payload.markah);
        result = { success: true, data: payload.markah };
        break;
      case 'saveAll':
        saveAllData(payload.data);
        result = { success: true, data: 'Semua data disimpan' };
        break;
      default:
        result = { success: false, error: 'Tindakan tidak diketahui: ' + action };
    }
  } catch (err) {
    result = { success: false, error: String(err) };
  }

  return jsonOut(result);
}

/* ============================================================
   UTILITI CORS & JSON
   ============================================================ */

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   FUNGSI PANGKALAN DATA (Google Sheet)
   ============================================================ */

// Buka spreadsheet utama
function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

// Dapatkan sheet, auto-create jika tiada beserta header
function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // Auto-create sheet baharu
    sheet = ss.insertSheet(sheetName);
    var headers = SHEET_HEADERS[sheetName] || [];
    if (headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Boldkan header
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  } else {
    // Pastikan header wujud walaupun sheet sedia ada
    var lastCol = sheet.getLastColumn();
    var headers = SHEET_HEADERS[sheetName] || [];
    if (lastCol < headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

// Tukar data sheet kepada array objek
function getSheetData(sheetName) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  return values.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i];
    });
    return obj;
  }).filter(function(r) {
    // Buang baris kosong
    return Object.keys(r).some(function(k) { return r[k] !== ''; });
  });
}

// Tambah baris baharu
function appendRow(sheetName, data) {
  var sheet = getSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName] || [];
  var row = headers.map(function(h) {
    var val = data[h];
    return (val !== undefined && val !== null) ? val : '';
  });
  sheet.appendRow(row);
}

// Tambah atau kemas kini baris (upsert) berdasarkan key
function upsertRow(sheetName, keyField, data) {
  var sheet = getSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName] || [];
  var lastRow = sheet.getLastRow();

  // Cari index lajur key
  var keyCol = headers.indexOf(keyField) + 1;
  if (keyCol < 1) keyCol = 1;

  // Cari baris dengan key yang sama
  var rowIndex = -1;
  if (lastRow >= 2) {
    var keyValues = sheet.getRange(2, keyCol, lastRow - 1, 1).getValues();
    for (var i = 0; i < keyValues.length; i++) {
      if (String(keyValues[i][0]) === String(data[keyField])) {
        rowIndex = i + 2;
        break;
      }
    }
  }

  var row = headers.map(function(h) {
    var val = data[h];
    return (val !== undefined && val !== null) ? val : '';
  });

  if (rowIndex > 0) {
    // Kemas kini baris sedia ada
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  } else {
    // Tambah baris baharu
    sheet.appendRow(row);
  }
}

// Padam baris berdasarkan nilai key
function deleteRow(sheetName, keyField, keyVal) {
  var sheet = getSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName] || [];
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  var keyCol = headers.indexOf(keyField) + 1;
  if (keyCol < 1) keyCol = 1;

  var keyValues = sheet.getRange(2, keyCol, lastRow - 1, 1).getValues();
  for (var i = keyValues.length - 1; i >= 0; i--) {
    if (String(keyValues[i][0]) === String(keyVal)) {
      sheet.deleteRow(i + 2);
    }
  }
}

// Padam baris berdasarkan index (0-based)
function deleteRowByIndex(sheetName, index) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (index >= 0 && (index + 2) <= lastRow) {
    sheet.deleteRow(index + 2);
  }
}

/* ============================================================
   AMBIL & SIMPAN SEMUA DATA
   ============================================================ */

function getAllData() {
  return {
    murid: getSheetData(SHEETS.MURID),
    guru: getSheetData(SHEETS.GURU),
    saringan: getSheetData(SHEETS.SARINGAN),
    prasarana: getSheetData(SHEETS.PRASARANA),
    logIbuBapa: getSheetData(SHEETS.LOG_IBU_BAPA),
    carta: getSheetData(SHEETS.CARTA),
    markah: getSheetData(SHEETS.MARKAH)
  };
}

function saveAllData(data) {
  if (!data) return;

  if (data.murid) {
    getSheet(SHEETS.MURID);
    data.murid.forEach(function(m) { upsertRow(SHEETS.MURID, 'id', m); });
  }
  if (data.guru) {
    getSheet(SHEETS.GURU);
    data.guru.forEach(function(g) { upsertRow(SHEETS.GURU, 'id', g); });
  }
  if (data.saringan) {
    getSheet(SHEETS.SARINGAN);
    data.saringan.forEach(function(s) { upsertRow(SHEETS.SARINGAN, 'id', s); });
  }
  if (data.prasarana) {
    getSheet(SHEETS.PRASARANA);
    data.prasarana.forEach(function(p) { upsertRow(SHEETS.PRASARANA, 'id', p); });
  }
  if (data.logIbuBapa) {
    getSheet(SHEETS.LOG_IBU_BAPA);
    data.logIbuBapa.forEach(function(l) { appendRow(SHEETS.LOG_IBU_BAPA, l); });
  }
  if (data.carta) {
    getSheet(SHEETS.CARTA);
    data.carta.forEach(function(c) { upsertRow(SHEETS.CARTA, 'id', c); });
  }
  if (data.markah) {
    getSheet(SHEETS.MARKAH);
    Object.keys(data.markah).forEach(function(k) {
      var mk = data.markah[k];
      mk.muridId = k;
      upsertRow(SHEETS.MARKAH, 'muridId', mk);
    });
  }
}

/* ============================================================
   SEED DATA - Isi data awal jika sheet kosong
   Jalankan fungsi ini sekali sahaja dari Apps Script Editor
   ============================================================ */

function seedData() {
  // Murid
  var murid = [
    { id:'M001', nama:'Aisyah binti Zahari', mykid:'201805101056', diagnosis:'Autisme', kelas:'1 Inklusif', skor:72, tindakan:'Borang Persetujuan Ibu Bapa' },
    { id:'M002', nama:'Muhammad Faiz bin Roslan', mykid:'201712140873', diagnosis:'ADHD', kelas:'2 Inklusif', skor:64, tindakan:'Borang Persetujuan Ibu Bapa' },
    { id:'M003', nama:'Nurul Husna binti Karim', mykid:'201903220541', diagnosis:'Masalah Pembelajaran', kelas:'1 Inklusif', skor:44, tindakan:'Cadangan Intervensi RPI' },
    { id:'M004', nama:'Daniel bin Aiman', mykid:'201811080912', diagnosis:'Autisme', kelas:'3 Inklusif', skor:56, tindakan:'Borang Persetujuan Ibu Bapa' },
    { id:'M005', nama:'Sofia binti Hafiz', mykid:'201907150634', diagnosis:'Masalah Pendengaran', kelas:'2 Inklusif', skor:48, tindakan:'Cadangan Intervensi RPI' },
    { id:'M006', nama:'Arif bin Shahmi', mykid:'201802190778', diagnosis:'ADHD', kelas:'3 Inklusif', skor:80, tindakan:'Borang Persetujuan Ibu Bapa' },
    { id:'M007', nama:'Zara binti Lokman', mykid:'201909110489', diagnosis:'Masalah Pembelajaran', kelas:'1 Inklusif', skor:36, tindakan:'Cadangan Intervensi RPI' },
    { id:'M008', nama:'Haziq bin Najib', mykid:'201806250321', diagnosis:'Autisme', kelas:'4 Inklusif', skor:60, tindakan:'Borang Persetujuan Ibu Bapa' },
    { id:'M009', nama:'Diana binti Fauzi', mykid:'201710030657', diagnosis:'Masalah Penglihatan', kelas:'4 Inklusif', skor:52, tindakan:'Borang Persetujuan Ibu Bapa' },
    { id:'M010', nama:'Irfan bin Muzammil', mykid:'201904180142', diagnosis:'ADHD', kelas:'2 Inklusif', skor:40, tindakan:'Cadangan Intervensi RPI' }
  ];

  var guru = [
    { id:'G001', nama:'En. Ahmad bin Hassan', opsyen:'Pendidikan Khas Integrasi (Masalah Pembelajaran)', kelasBimbingan:'3 Bimbingan', subjek:'Bahasa Melayu, Matematik', jadualWaktu:'{}' },
    { id:'G002', nama:'Pn. Siti Aminah binti Yusof', opsyen:'Pendidikan Khas Integrasi (Autisme)', kelasBimbingan:'4 Bimbingan', subjek:'Bahasa Inggeris, Sains', jadualWaktu:'{}' },
    { id:'G003', nama:'Cik Norashikin binti Ramli', opsyen:'Pendidikan Khas Integrasi (Masalah Pendengaran)', kelasBimbingan:'2 Bimbingan', subjek:'Bahasa Melayu, Pendidikan Seni', jadualWaktu:'{}' },
    { id:'G004', nama:'En. Mohd Zaki bin Idris', opsyen:'Pendidikan Khas Integrasi (Masalah Penglihatan)', kelasBimbingan:'5 Bimbingan', subjek:'Matematik, Pendidikan Jasmani', jadualWaktu:'{}' },
    { id:'G005', nama:'Pn. Faridah binti Othman', opsyen:'Pendidikan Khas Integrasi (Masalah Pembelajaran)', kelasBimbingan:'1 Bimbingan', subjek:'Bahasa Melayu, Pendidikan Islam', jadualWaktu:'{}' }
  ];

  var prasarana = [
    { id:'P001', jenis:'Ramp', lokasi:'Pintu Utama Sekolah', status:'Sedia', catatan:'Disahkan 2026-01-15' },
    { id:'P002', jenis:'Tandas OKU', lokasi:'Blok A, Aras Tanah', status:'Sedia', catatan:'Disahkan 2026-01-15' },
    { id:'P003', jenis:'Grab Rails', lokasi:'Tandas OKU & Tangga Utama', status:'Sedia', catatan:'Disahkan 2026-01-15' },
    { id:'P004', jenis:'Ramp', lokasi:'Pintu Blok B', status:'Dalam Pembaikan', catatan:'Jangka siap: 2026-09-30' },
    { id:'P005', jenis:'Tempat Duduk Kerusi Roda', lokasi:'Dewan Besar', status:'Sedia', catatan:'Disahkan 2026-01-15' }
  ];

  var carta = [
    { id:'C01', pemegang:'', nama:'Guru Besar', peranan:'Pengerusi JPKS', ikon:'award', tier:'atas', warna:'emerald-600' },
    { id:'C02', pemegang:'', nama:'Penolong Kanan', peranan:'Timbalan Pengerusi', ikon:'user-cog', tier:'atas', warna:'emerald-500' },
    { id:'C03', pemegang:'', nama:'Koordinator PPKI', peranan:'Setiausaha', ikon:'briefcase', tier:'atas', warna:'emerald-400' },
    { id:'C04', pemegang:'', nama:'5 Guru PPKI', peranan:'Guru Pendamping', ikon:'user', tier:'bawah', warna:'putih' },
    { id:'C05', pemegang:'', nama:'Ibu Bapa / Penjaga', peranan:'Ahli JPKS', ikon:'heart', tier:'bawah', warna:'putih' },
    { id:'C06', pemegang:'', nama:'Pegawai PPKI', peranan:'Penasihat Teknikal', ikon:'stethoscope', tier:'bawah', warna:'putih' }
  ];

  var logIbuBapa = [
    { muridId:'M001', tarikh:'2026-01-22', perkara:'Perbincangan penyesuaian rutin kelas dan alat komunikasi.' },
    { muridId:'M003', tarikh:'2026-01-24', perkara:'Persetujuan pelaksanaan RPI intensif di rumah dan sekolah.' },
    { muridId:'M006', tarikh:'2026-01-25', perkara:'Maklum balas positif perkembangan akademik dan sosial.' }
  ];

  var markah = [
    { muridId:'M001', bm:65, bi:58, mt:70, sj:62, ulasan:'Aktif dalam perbualan kumpulan, perlu bimbingan fokus tugas.' },
    { muridId:'M002', bm:55, bi:50, mt:48, sj:52, ulasan:'Sering bertindak impulsif, memerlukan strategi pengurusan tingkah laku.' },
    { muridId:'M003', bm:40, bi:35, mt:38, sj:42, ulasan:'Memerlukan sokongan tambahan dalam literasi dan numerasi.' },
    { muridId:'M004', bm:72, bi:68, mt:75, sj:70, ulasan:'Kerap menunjukkan minat dalam sains, interaksi sosial baik.' },
    { muridId:'M005', bm:48, bi:45, mt:52, sj:50, ulasan:'Memerlukan alat bantu pendengaran, penyertaan kelas baik.' },
    { muridId:'M006', bm:80, bi:75, mt:85, sj:78, ulasan:'Pencapaian cemerlang, mampu menjadi role model rakan.' },
    { muridId:'M007', bm:35, bi:30, mt:32, sj:38, ulasan:'Memerlukan RPI intensif, sokongan satu-ke-satu diperlukan.' },
    { muridId:'M008', bm:60, bi:55, mt:58, sj:56, ulasan:'Kemajuan baik dalam komunikasi, perlu galakan sosial.' },
    { muridId:'M009', bm:52, bi:48, mt:50, sj:54, ulasan:'Menggunakan braille dengan baik, keyakinan diri meningkat.' },
    { muridId:'M010', bm:42, bi:38, mt:40, sj:44, ulasan:'Tumpuan mudah terganggu, perlu rutin dan jadual visual.' }
  ];

  // Isi setiap sheet jika kosong
  if (getSheetData(SHEETS.MURID).length === 0) {
    murid.forEach(function(m) { upsertRow(SHEETS.MURID, 'id', m); });
  }
  if (getSheetData(SHEETS.GURU).length === 0) {
    guru.forEach(function(g) { upsertRow(SHEETS.GURU, 'id', g); });
  }
  if (getSheetData(SHEETS.PRASARANA).length === 0) {
    prasarana.forEach(function(p) { upsertRow(SHEETS.PRASARANA, 'id', p); });
  }
  if (getSheetData(SHEETS.CARTA).length === 0) {
    carta.forEach(function(c) { upsertRow(SHEETS.CARTA, 'id', c); });
  }
  if (getSheetData(SHEETS.LOG_IBU_BAPA).length === 0) {
    logIbuBapa.forEach(function(l) { appendRow(SHEETS.LOG_IBU_BAPA, l); });
  }
  if (getSheetData(SHEETS.MARKAH).length === 0) {
    markah.forEach(function(m) { upsertRow(SHEETS.MARKAH, 'muridId', m); });
  }

  Logger.log('Seed data selesai. Semua sheet telah diisi.');
}

/* ============================================================
   SETUP AWAL - Jalankan fungsi ini sekali dari Apps Script Editor
   untuk pastikan semua sheet wujud dengan header yang betul.
   ============================================================ */

function setup() {
  Object.keys(SHEETS).forEach(function(key) {
    getSheet(SHEETS[key]);
  });
  Logger.log('Setup selesai. Sheet dicipta: ' + Object.values(SHEETS).join(', '));
}
