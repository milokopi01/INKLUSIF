/**
 * Sistem Pengurusan Inklusif Bersepadu (SPIB) PPKI
 * Google Apps Script Backend API
 *
 * Sheet tabs: Murid, Saringan, Guru, Prasarana
 * Gantikan SHEET_ID di bawah dengan ID Google Sheet anda.
 */

var SHEET_ID = 'GANTIKAN_DENGAN_ID_GOOGLE_SHEET_ANDA';
var SHEETS = {
  MURID: 'Murid',
  SARINGAN: 'Saringan',
  GURU: 'Guru',
  PRASARANA: 'Prasarana'
};

var CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};

/* ===================== ENTRY POINTS ===================== */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action === 'getMurid') return jsonOut(getMurid());
  if (action === 'getGuru') return jsonOut(getGuru());
  if (action === 'getSaringan') return jsonOut(getSaringan());
  if (action === 'getPrasarana') return jsonOut(getPrasarana());
  if (action === 'getAll') return jsonOut({ murid: getMurid(), guru: getGuru(), saringan: getSaringan(), prasarana: getPrasarana() });

  // Tiada parameter API - layari index.html sebagai halaman utama
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('SPIB PPKI')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var data = (e && e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    if (e && e.parameter && e.parameter.action) data.action = e.parameter.action;
    var action = data.action || '';
    var result = {};

    if (action === 'saveMurid') result = saveMurid(data);
    else if (action === 'saveSaringan') result = saveSaringan(data);
    else if (action === 'saveGuru') result = saveGuru(data);
    else if (action === 'updatePrasarana') result = updatePrasarana(data);
    else if (action === 'deleteMurid') result = deleteMurid(data);
    else if (action === 'deleteGuru') result = deleteGuru(data);
    else if (action === 'deleteSaringan') result = deleteSaringan(data);
    else return jsonOut({ success: false, error: 'Action tidak dikenali: ' + action });

    return jsonOut({ success: true, data: result });
  } catch (err) {
    return jsonOut({ success: false, error: String(err.message || err) });
  }
}

function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===================== SHEET HELPERS ===================== */

function getSheet(name) {
  var ss = (SHEET_ID && SHEET_ID !== 'GANTIKAN_DENGAN_ID_GOOGLE_SHEET_ANDA')
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEETS.MURID) sheet.getRange(1, 1, 1, 7).setValues([['id', 'nama', 'mykid', 'diagnosis', 'kelas', 'skor', 'tindakan']]);
    if (name === SHEETS.SARINGAN) sheet.getRange(1, 1, 1, 8).setValues([['id', 'muridId', 'tarikh', 'domain', 'skor', 'kategori', 'butiran', 'logIbuBapa']]);
    if (name === SHEETS.GURU) sheet.getRange(1, 1, 1, 6).setValues([['id', 'nama', 'opsyen', 'kelasBimbingan', 'subjek', 'jadualWaktu']]);
    if (name === SHEETS.PRASARANA) sheet.getRange(1, 1, 1, 5).setValues([['id', 'jenis', 'lokasi', 'status', 'catatan']]);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = values[i][j];
    rows.push(obj);
  }
  return rows;
}

function upsertRow(sheet, obj, idField) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIdx = headers.indexOf(idField);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIdx]) === String(obj[idField])) {
      var row = [];
      for (var j = 0; j < headers.length; j++) {
        row.push(obj[headers[j]] !== undefined ? obj[headers[j]] : values[i][j]);
      }
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return obj;
    }
  }
  // Tambah baris baru
  var newRow = [];
  for (var k = 0; k < headers.length; k++) newRow.push(obj[headers[k]] !== undefined ? obj[headers[k]] : '');
  sheet.appendRow(newRow);
  return obj;
}

function deleteRowById(sheet, id, idField) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIdx = headers.indexOf(idField);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/* ===================== CRUD: MURID ===================== */

function getMurid() {
  var sheet = getSheet(SHEETS.MURID);
  var rows = sheetToObjects(sheet);
  if (rows.length === 0) {
    var seed = getSeedMurid();
    for (var i = 0; i < seed.length; i++) upsertRow(sheet, seed[i], 'id');
    rows = seed;
  }
  return rows;
}

function saveMurid(data) {
  var sheet = getSheet(SHEETS.MURID);
  if (!data.murid) return { error: 'data.murid diperlukan' };
  return upsertRow(sheet, data.murid, 'id');
}

function deleteMurid(data) {
  var sheet = getSheet(SHEETS.MURID);
  return deleteRowById(sheet, data.id, 'id');
}

/* ===================== CRUD: GURU ===================== */

function getGuru() {
  var sheet = getSheet(SHEETS.GURU);
  var rows = sheetToObjects(sheet);
  if (rows.length === 0) {
    var seed = getSeedGuru();
    for (var i = 0; i < seed.length; i++) upsertRow(sheet, seed[i], 'id');
    rows = seed;
  }
  return rows;
}

function saveGuru(data) {
  var sheet = getSheet(SHEETS.GURU);
  if (!data.guru) return { error: 'data.guru diperlukan' };
  return upsertRow(sheet, data.guru, 'id');
}

function deleteGuru(data) {
  var sheet = getSheet(SHEETS.GURU);
  return deleteRowById(sheet, data.id, 'id');
}

/* ===================== CRUD: SARINGAN ===================== */

function getSaringan() {
  var sheet = getSheet(SHEETS.SARINGAN);
  return sheetToObjects(sheet);
}

function saveSaringan(data) {
  var sheet = getSheet(SHEETS.SARINGAN);
  if (!data.saringan) return { error: 'data.saringan diperlukan' };
  return upsertRow(sheet, data.saringan, 'id');
}

function deleteSaringan(data) {
  var sheet = getSheet(SHEETS.SARINGAN);
  return deleteRowById(sheet, data.id, 'id');
}

/* ===================== CRUD: PRASARANA ===================== */

function getPrasarana() {
  var sheet = getSheet(SHEETS.PRASARANA);
  var rows = sheetToObjects(sheet);
  if (rows.length === 0) {
    var seed = getSeedPrasarana();
    for (var i = 0; i < seed.length; i++) upsertRow(sheet, seed[i], 'id');
    rows = seed;
  }
  return rows;
}

function updatePrasarana(data) {
  var sheet = getSheet(SHEETS.PRASARANA);
  if (!data.prasarana) return { error: 'data.prasarana diperlukan' };
  return upsertRow(sheet, data.prasarana, 'id');
}

/* ===================== SEED DATA ===================== */

function getSeedGuru() {
  return [
    { id: 'G001', nama: 'En. Ahmad bin Hassan', opsyen: 'Pendidikan Khas Integrasi (Masalah Pembelajaran)', kelasBimbingan: '3 Bimbingan', subjek: 'Bahasa Melayu, Matematik', jadualWaktu: JSON.stringify(getSeedJadual()) },
    { id: 'G002', nama: 'Pn. Siti Aminah binti Yusof', opsyen: 'Pendidikan Khas Integrasi (Autisme)', kelasBimbingan: '4 Bimbingan', subjek: 'Bahasa Inggeris, Sains', jadualWaktu: JSON.stringify(getSeedJadual()) },
    { id: 'G003', nama: 'Cik Norashikin binti Ramli', opsyen: 'Pendidikan Khas Integrasi (Masalah Pendengaran)', kelasBimbingan: '2 Bimbingan', subjek: 'Bahasa Melayu, Pendidikan Seni', jadualWaktu: JSON.stringify(getSeedJadual()) },
    { id: 'G004', nama: 'En. Mohd Zaki bin Idris', opsyen: 'Pendidikan Khas Integrasi (Masalah Penglihatan)', kelasBimbingan: '5 Bimbingan', subjek: 'Matematik, Pendidikan Jasmani', jadualWaktu: JSON.stringify(getSeedJadual()) },
    { id: 'G005', nama: 'Pn. Faridah binti Othman', opsyen: 'Pendidikan Khas Integrasi (Masalah Pembelajaran)', kelasBimbingan: '1 Bimbingan', subjek: 'Bahasa Melayu, Pendidikan Islam', jadualWaktu: JSON.stringify(getSeedJadual()) }
  ];
}

function getSeedJadual() {
  var hari = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
  var slot = ['07:50-08:20', '08:20-09:00', '09:00-09:40', '09:40-10:20', 'Rehat', '10:40-11:20', '11:20-12:00', '12:00-12:40'];
  var jadual = {};
  for (var h = 0; h < hari.length; h++) {
    jadual[hari[h]] = {};
    for (var s = 0; s < slot.length; s++) {
      jadual[hari[h]][slot[s]] = (slot[s] === 'Rehat') ? 'Rehat' : '';
    }
  }
  return jadual;
}

function getSeedMurid() {
  return [
    { id: 'M001', nama: 'Aisyah binti Zahari', mykid: '201805101056', diagnosis: 'Autisme', kelas: '1 Inklusif', skor: 72, tindakan: 'Borang Persetujuan Ibu Bapa' },
    { id: 'M002', nama: 'Muhammad Faiz bin Roslan', mykid: '201712140873', diagnosis: 'ADHD', kelas: '2 Inklusif', skor: 64, tindakan: 'Borang Persetujuan Ibu Bapa' },
    { id: 'M003', nama: 'Nurul Husna binti Karim', mykid: '201903220541', diagnosis: 'Masalah Pembelajaran', kelas: '1 Inklusif', skor: 44, tindakan: 'Cadangan Intervensi RPI' },
    { id: 'M004', nama: 'Daniel bin Aiman', mykid: '201811080912', diagnosis: 'Autisme', kelas: '3 Inklusif', skor: 56, tindakan: 'Borang Persetujuan Ibu Bapa' },
    { id: 'M005', nama: 'Sofia binti Hafiz', mykid: '201907150634', diagnosis: 'Masalah Pendengaran', kelas: '2 Inklusif', skor: 48, tindakan: 'Cadangan Intervensi RPI' },
    { id: 'M006', nama: 'Arif bin Shahmi', mykid: '201802190778', diagnosis: 'ADHD', kelas: '3 Inklusif', skor: 80, tindakan: 'Borang Persetujuan Ibu Bapa' },
    { id: 'M007', nama: 'Zara binti Lokman', mykid: '201909110489', diagnosis: 'Masalah Pembelajaran', kelas: '1 Inklusif', skor: 36, tindakan: 'Cadangan Intervensi RPI' },
    { id: 'M008', nama: 'Haziq bin Najib', mykid: '201806250321', diagnosis: 'Autisme', kelas: '4 Inklusif', skor: 60, tindakan: 'Borang Persetujuan Ibu Bapa' },
    { id: 'M009', nama: 'Diana binti Fauzi', mykid: '201710030657', diagnosis: 'Masalah Penglihatan', kelas: '4 Inklusif', skor: 52, tindakan: 'Borang Persetujuan Ibu Bapa' },
    { id: 'M010', nama: 'Irfan bin Muzammil', mykid: '201904180142', diagnosis: 'ADHD', kelas: '2 Inklusif', skor: 40, tindakan: 'Cadangan Intervensi RPI' }
  ];
}

function getSeedPrasarana() {
  return [
    { id: 'P001', jenis: 'Ramp', lokasi: 'Pintu Utama Sekolah', status: 'Sedia', catatan: 'Disahkan 2026-01-15' },
    { id: 'P002', jenis: 'Tandas OKU', lokasi: 'Blok A, Aras Tanah', status: 'Sedia', catatan: 'Disahkan 2026-01-15' },
    { id: 'P003', jenis: 'Grab Rails', lokasi: 'Tandas OKU & Tangga Utama', status: 'Sedia', catatan: 'Disahkan 2026-01-15' },
    { id: 'P004', jenis: 'Ramp', lokasi: 'Pintu Blok B', status: 'Dalam Pembaikan', catatan: 'Jangka siap: 2026-09-30' },
    { id: 'P005', jenis: 'Tempat Duduk Kerusi Roda', lokasi: 'Dewan Besar', status: 'Sedia', catatan: 'Disahkan 2026-01-15' }
  ];
}
