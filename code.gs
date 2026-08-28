/**
 * SPIB-Pintar PPKI SK Selama (K) - Google Apps Script Backend
 * Sistem Pengurusan Inklusif Bersepadu Pintar
 *
 * Tab Google Sheets: 'Murid', 'Saringan', 'Guru', 'Prasarana'
 * Folder Google Drive: untuk muat naik borang persetujuan
 */

var SHEET_ID = ''; // Masukkan Google Sheet ID di sini jika ada
var DRIVE_FOLDER_ID = ''; // Masukkan Google Drive Folder ID di sini jika ada
var SHEET_TABS = ['Murid', 'Saringan', 'Guru', 'Prasarana'];

// ============================================================
// DATA AWAL SANDARAN (FALLBACK) - 10 Murid Inklusif & 5 Guru PPKI
// ============================================================
var FALLBACK_MURID = [
  { id: 'M01', nama: 'Ahmad Zikri bin Hassan', mykid: '180101-14-0123', diagnosis: 'Disleksia', kelas: 'Pemulihan Khas 1', skorSaringan: 68, failDrive: '', jantina: 'Lelaki', tarikhLahir: '2018-01-01', ibubapa: 'Hassan bin Ali', telefon: '012-3456789' },
  { id: 'M02', nama: 'Nur Aishah binti Roslan', mykid: '170305-08-0456', diagnosis: 'Autisme Ringan', kelas: 'Pemulihan Khas 1', skorSaringan: 56, failDrive: '', jantina: 'Perempuan', tarikhLahir: '2017-03-05', ibubapa: 'Roslan bin Karim', telefon: '012-9876543' },
  { id: 'M03', nama: 'Muhammad Faiz bin Abdullah', mykid: '180612-14-0789', diagnosis: 'ADHD', kelas: 'Pemulihan Khas 2', skorSaringan: 72, failDrive: '', jantina: 'Lelaki', tarikhLahir: '2018-06-12', ibubapa: 'Abdullah bin Samad', telefon: '013-1112222' },
  { id: 'M04', nama: 'Siti Khadijah binti Yusof', mykid: '170820-08-0234', diagnosis: 'Disgrafia', kelas: 'Pemulihan Khas 2', skorSaringan: 60, failDrive: '', jantina: 'Perempuan', tarikhLahir: '2017-08-20', ibubapa: 'Yusof bin Hassan', telefon: '014-3334444' },
  { id: 'M05', nama: 'Arif Hakimi bin Razali', mykid: '190105-14-0567', diagnosis: 'Disleksia', kelas: 'Pemulihan Khas 1', skorSaringan: 44, failDrive: '', jantina: 'Lelaki', tarikhLahir: '2019-01-05', ibubapa: 'Razali bin Othman', telefon: '015-5556666' },
  { id: 'M06', nama: 'Nurul Husna binti Zahari', mykid: '170210-08-0890', diagnosis: 'Lambat Belajar', kelas: 'Pemulihan Khas 2', skorSaringan: 80, failDrive: '', jantina: 'Perempuan', tarikhLahir: '2017-02-10', ibubapa: 'Zahari bin Idris', telefon: '016-7778888' },
  { id: 'M07', nama: 'Danish Iman bin Fauzi', mykid: '180915-14-0123', diagnosis: 'Autisme Ringan', kelas: 'Pemulihan Khas 1', skorSaringan: 52, failDrive: '', jantina: 'Lelaki', tarikhLahir: '2018-09-15', ibubapa: 'Fauzi bin Man', telefon: '017-9990000' },
  { id: 'M08', nama: 'Aisyah Damia binti Kamal', mykid: '170401-08-0456', diagnosis: 'Disleksia', kelas: 'Pemulihan Khas 2', skorSaringan: 76, failDrive: '', jantina: 'Perempuan', tarikhLahir: '2017-04-01', ibubapa: 'Kamal bin Isa', telefon: '018-1212121' },
  { id: 'M09', nama: 'Luqman Hakim bin Suhaimi', mykid: '180722-14-0789', diagnosis: 'ADHD', kelas: 'Pemulihan Khas 1', skorSaringan: 48, failDrive: '', jantina: 'Lelaki', tarikhLahir: '2018-07-22', ibubapa: 'Suhaimi bin Lazim', telefon: '019-3434343' },
  { id: 'M10', nama: 'Hawa Zulaikha binti Anuar', mykid: '170610-08-0234', diagnosis: 'Lambat Belajar', kelas: 'Pemulihan Khas 2', skorSaringan: 64, failDrive: '', jantina: 'Perempuan', tarikhLahir: '2017-06-10', ibubapa: 'Anuar bin Salleh', telefon: '011-5656565' }
];

var FALLBACK_GURU = [
  { id: 'G01', nama: 'Pn. Noraini binti Mahmud', opsyen: 'Pendidikan Khas', subjekTeras: 'Bahasa Melayu', peranan: 'Ketua PPKI / Penyelaras', telefon: '012-1111111', email: 'noraini@skpm.gov.my' },
  { id: 'G02', nama: 'En. Khairul Anuar bin Zakaria', opsyen: 'Pendidikan Khas', subjekTeras: 'Matematik', peranan: 'Guru PPKI', telefon: '012-2222222', email: 'khairul@skpm.gov.my' },
  { id: 'G03', nama: 'Pn. Salmah binti Othman', opsyen: 'Pendidikan Khas Integrasi', subjekTeras: 'Bahasa Inggeris', peranan: 'Guru PPKI', telefon: '012-3333333', email: 'salmah@skpm.gov.my' },
  { id: 'G04', nama: 'En. Mohd Faizal bin Ismail', opsyen: 'Pendidikan Khas', subjekTeras: 'Sains', peranan: 'Guru PPKI', telefon: '012-4444444', email: 'faizal@skpm.gov.my' },
  { id: 'G05', nama: 'Pn. Rozita binti Abd Rahman', opsyen: 'Pendidikan Khas Integrasi', subjekTeras: 'Pendidikan Jasmani', peranan: 'Guru PPKI / Kaunselor', telefon: '012-5555555', email: 'rozita@skpm.gov.my' }
];

var FALLBACK_PRASARANA = [
  { id: 'P01', item: 'Tandas OKU (Lelaki)', lokasi: 'Blok A', status: 'Memuaskan', catatan: 'Skrin pintu rosak', tarikhPemantauan: '2026-01-15' },
  { id: 'P02', item: 'Tandas OKU (Perempuan)', lokasi: 'Blok A', status: 'Baik', catatan: 'Lengkap dengan bar pegang', tarikhPemantauan: '2026-01-15' },
  { id: 'P03', item: 'Ramp Kerusi Roda', lokasi: 'Pintu Utama', status: 'Baik', catatan: 'Kecerunan mematuhi piawai', tarikhPemantauan: '2026-01-15' },
  { id: 'P04', item: 'Susur Tuan Taktik', lokasi: 'Tingkat 1 Blok A', status: 'Memuaskan', catatan: 'Perlu tambah braille', tarikhPemantauan: '2026-01-15' },
  { id: 'P05', item: 'Laluan OKU', lokasi: 'Koridor Utama', status: 'Baik', catatan: 'Tiada halangan', tarikhPemantauan: '2026-01-15' }
];

// ============================================================
// FUNGSI UTAMA HTTP
// ============================================================

function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('SPIB-Pintar PPKI SK Selama (K)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameMode(HtmlService.XFrameMode.ALLOWALL);
  }

  var action = e.parameter.action;
  var result = {};

  try {
    switch (action) {
      case 'readAll':
        result = readAllData();
        break;
      case 'readMurid':
        result = { success: true, data: getSheetData('Murid', FALLBACK_MURID) };
        break;
      case 'readGuru':
        result = { success: true, data: getSheetData('Guru', FALLBACK_GURU) };
        break;
      case 'readPrasarana':
        result = { success: true, data: getSheetData('Prasarana', FALLBACK_PRASARANA) };
        break;
      case 'readSaringan':
        result = { success: true, data: getSheetData('Saringan', []) };
        break;
      default:
        result = { success: false, error: 'Tindakan tidak diketahui: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return jsonOut(result);
}

function doPost(e) {
  var result = {};
  try {
    var data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
    var action = data.action || e.parameter.action;

    switch (action) {
      case 'saveMurid':
        result = saveRecord('Murid', FALLBACK_MURID, data.record, 'M');
        break;
      case 'saveGuru':
        result = saveRecord('Guru', FALLBACK_GURU, data.record, 'G');
        break;
      case 'savePrasarana':
        result = saveRecord('Prasarana', FALLBACK_PRASARANA, data.record, 'P');
        break;
      case 'saveSaringan':
        result = saveRecord('Saringan', [], data.record, 'S');
        break;
      case 'deleteMurid':
        result = deleteRecord('Murid', FALLBACK_MURID, data.id);
        break;
      case 'deleteGuru':
        result = deleteRecord('Guru', FALLBACK_GURU, data.id);
        break;
      case 'deletePrasarana':
        result = deleteRecord('Prasarana', FALLBACK_PRASARANA, data.id);
        break;
      case 'deleteSaringan':
        result = deleteRecord('Saringan', [], data.id);
        break;
      case 'uploadToDrive':
        result = uploadToDrive(data.base64, data.fileName, data.folderId || DRIVE_FOLDER_ID);
        break;
      default:
        result = { success: false, error: 'Tindakan tidak diketahui: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  return jsonOut(result);
}

// ============================================================
// FUNGSI BACA DATA
// ============================================================

function readAllData() {
  return {
    success: true,
    data: {
      murid: getSheetData('Murid', FALLBACK_MURID),
      guru: getSheetData('Guru', FALLBACK_GURU),
      prasarana: getSheetData('Prasarana', FALLBACK_PRASARANA),
      saringan: getSheetData('Saringan', [])
    }
  };
}

function getSheetData(tabName, fallback) {
  try {
    if (!SHEET_ID) return fallback;
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) return fallback;
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return fallback;
    var headers = values[0];
    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = values[i][j];
      }
      rows.push(obj);
    }
    return rows.length > 0 ? rows : fallback;
  } catch (err) {
    return fallback;
  }
}

// ============================================================
// FUNGSI SIMPAN / EDIT
// ============================================================

function saveRecord(tabName, fallback, record, idPrefix) {
  try {
    if (!SHEET_ID) {
      return { success: true, message: 'Data disimpan (mod sandaran - tiada Sheet ID)', record: record };
    }
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }

    var headers = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : null;
    if (!headers || headers.length === 0) {
      headers = Object.keys(record);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    var recordId = record.id || (idPrefix + String(Date.now()).slice(-6));
    record.id = recordId;

    var existingRow = findRowById(sheet, recordId);
    var rowValues = headers.map(function (h) { return record[h] !== undefined ? record[h] : ''; });

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowValues]);
      return { success: true, message: 'Rekod dikemas kini', record: record };
    } else {
      sheet.appendRow(rowValues);
      return { success: true, message: 'Rekod baharu disimpan', record: record };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function deleteRecord(tabName, fallback, recordId) {
  try {
    if (!SHEET_ID) {
      return { success: true, message: 'Rekod dipadam (mod sandaran)' };
    }
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) return { success: false, error: 'Tab tidak dijumpai' };

    var row = findRowById(sheet, recordId);
    if (row > 0) {
      sheet.deleteRow(row);
      return { success: true, message: 'Rekod berjaya dipadam' };
    }
    return { success: false, error: 'Rekod tidak dijumpai' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function findRowById(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

// ============================================================
// FUNGSI MUAT NAIK KE GOOGLE DRIVE
// ============================================================

function uploadToDrive(base64Data, fileName, folderId) {
  try {
    if (!base64Data || !fileName) {
      return { success: false, error: 'Data base64 atau nama fail kosong' };
    }

    var folder = folderId ? DriveApp.getFolderById(folderId) : getOrCreateFolder();
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, getMimeType(fileName), fileName);
    var file = folder.createFile(blob);

    // Set akses "Anyone with link" - Viewer
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var driveUrl = file.getUrl();
    var directUrl = 'https://drive.google.com/file/d/' + fileId + '/view';

    return {
      success: true,
      message: 'Fail berjaya dimuat naik ke Google Drive',
      fileId: fileId,
      fileName: fileName,
      driveUrl: driveUrl,
      directUrl: directUrl,
      webViewLink: directUrl
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function getOrCreateFolder() {
  var folderName = 'SPIB-Pintar PPKI SK Selama - Borang';
  var it = DriveApp.getFoldersByName(folderName);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(folderName);
}

function getMimeType(fileName) {
  var ext = fileName.split('.').pop().toLowerCase();
  var types = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return types[ext] || 'application/octet-stream';
}

// ============================================================
// FUNGSI BANTUAN OUTPUT JSON
// ============================================================

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
