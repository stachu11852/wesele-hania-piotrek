'use strict';

/* ===== Konfiguracja ===== */
// URL deploymentu Apps Script (web app, /exec). Uzupełniany przy wdrożeniu.
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwK6ZotOm4J1l0LXBvXrQAWWCfjcGA-8zu5qv7wXL9j4dlQLqN79696PGBhDU2nVQyu/exec';
var EVENT_TITLE = 'Wesele Hani i Piotrka';

var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;       // 2 GB (walidacja też po stronie serwera)
var CHUNK_SIZE = 8 * 1024 * 1024;                  // 8 MiB – wielokrotność 256 KiB (wymóg Drive API)
var MAX_RETRIES = 6;                               // prób na plik zanim uznamy go za nieudany

/* ===== Elementy UI ===== */
var $ = function (id) { return document.getElementById(id); };
var stateStart = $('state-start'), stateUpload = $('state-upload'), stateDone = $('state-done');
var nameInput = $('guest-name'), pickBtn = $('pick-btn'), fileInput = $('file-input');
var counterEl = $('upload-counter'), barFill = $('bar-fill'), bytesEl = $('upload-bytes'), currentEl = $('upload-current');
var doneSummary = $('done-summary'), doneSkipped = $('done-skipped'), moreBtn = $('more-btn');

var uploading = false;
var wakeLock = null;

/* ===== Start ===== */
nameInput.value = localStorage.getItem('guestName') || '';

pickBtn.addEventListener('click', function () { fileInput.click(); });

fileInput.addEventListener('change', function () {
  var files = Array.prototype.slice.call(fileInput.files);
  fileInput.value = ''; // pozwala wybrać te same pliki ponownie
  if (files.length) startUpload(files);
});

moreBtn.addEventListener('click', function () {
  showState(stateStart); // imię zostaje w polu
});

window.addEventListener('beforeunload', function (e) {
  if (uploading) { e.preventDefault(); e.returnValue = ''; }
});

// Wake lock – Android Chrome utrzyma ekran włączony podczas wysyłki
function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  navigator.wakeLock.request('screen')
    .then(function (lock) { wakeLock = lock; })
    .catch(function () { /* odmowa nie szkodzi */ });
}
document.addEventListener('visibilitychange', function () {
  if (uploading && document.visibilityState === 'visible') requestWakeLock();
});

function showState(el) {
  [stateStart, stateUpload, stateDone].forEach(function (s) { s.classList.add('hidden'); });
  el.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===== Kolejka ===== */

function startUpload(files) {
  if (SCRIPT_URL.indexOf('__') === 0) {
    alert('Strona nie jest jeszcze skonfigurowana (brak adresu serwera).');
    return;
  }
  var guestName = nameInput.value.trim().slice(0, 50);
  localStorage.setItem('guestName', guestName);

  var queue = [], skipped = [];
  files.forEach(function (f) {
    if (f.size === 0) skipped.push({ file: f, reason: 'pusty plik' });
    else if (f.size > MAX_FILE_SIZE) skipped.push({ file: f, reason: 'ponad 2 GB' });
    else if (f.type && f.type.indexOf('image/') !== 0 && f.type.indexOf('video/') !== 0)
      skipped.push({ file: f, reason: 'nieobsługiwany typ' });
    else queue.push(f);
  });

  if (!queue.length) {
    finish(0, skipped, []);
    return;
  }

  uploading = true;
  requestWakeLock();
  showState(stateUpload);
  processQueue(queue, skipped, guestName);
}

function processQueue(queue, skipped, guestName) {
  var totalBytes = queue.reduce(function (s, f) { return s + f.size; }, 0);
  var doneBytes = 0;        // bajty plików ukończonych
  var failed = [];
  var sent = 0;
  var index = 0;

  function refresh(currentFileBytes) {
    var transferred = doneBytes + (currentFileBytes || 0);
    counterEl.textContent = 'Plik ' + Math.min(index + 1, queue.length) + ' z ' + queue.length;
    barFill.style.width = (totalBytes ? Math.min(100, transferred / totalBytes * 100) : 0).toFixed(1) + '%';
    bytesEl.textContent = fmtBytes(transferred) + ' z ' + fmtBytes(totalBytes);
  }

  function next() {
    if (index >= queue.length) {
      uploading = false;
      if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
      finish(sent, skipped, failed);
      return;
    }
    var file = queue[index];
    currentEl.textContent = file.name;
    refresh(0);

    uploadOneFile(file, guestName, function (fileBytes) { refresh(fileBytes); })
      .then(function () { sent++; doneBytes += file.size; })
      .catch(function (err) {
        failed.push({ file: file, reason: errText(err) });
        totalBytes -= file.size; // nie licz nieudanego pliku do paska postępu
      })
      .then(function () { index++; next(); });
  }

  next();
}

function finish(sent, skipped, failed) {
  doneSummary.textContent = sent === 0
    ? 'Nie udało się wysłać plików.'
    : 'Wysłano ' + sent + ' ' + plural(sent, 'plik', 'pliki', 'plików') + '. Hania i Piotrek dziękują! 🤍';

  var problems = skipped.concat(failed);
  if (problems.length) {
    doneSkipped.textContent = 'Pominięto ' + problems.length + ' ' +
      plural(problems.length, 'plik', 'pliki', 'plików') + ' (' +
      problems.map(function (p) { return p.file.name + ' – ' + p.reason; }).join(', ') + ').';
    doneSkipped.classList.remove('hidden');
  } else {
    doneSkipped.classList.add('hidden');
  }
  showState(stateDone);
}

/* ===== Upload pojedynczego pliku ===== */

function uploadOneFile(file, guestName, onProgress) {
  return initSession(file, guestName).then(function (sessionUrl) {
    return uploadChunks(file, guestName, sessionUrl, onProgress);
  });
}

// Apps Script otwiera sesję resumable i zwraca jej URL.
// Content-Type: text/plain = brak preflightu CORS (Apps Script go nie obsługuje).
function initSession(file, guestName) {
  return fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'initUpload',
      name: guestName,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size
    })
  }).then(function (resp) {
    if (!resp.ok) throw { kind: 'init_http', status: resp.status };
    return resp.json();
  }).then(function (data) {
    if (!data.ok || !data.uploadUrl) throw { kind: 'init_api', code: data.error || 'unknown' };
    return data.uploadUrl;
  });
}

function uploadChunks(file, guestName, sessionUrl, onProgress) {
  var offset = 0;
  var retries = 0;

  function step() {
    var end = Math.min(offset + CHUNK_SIZE, file.size);
    return putChunk(sessionUrl, file.slice(offset, end), offset, end, file.size, function (loadedInChunk) {
      onProgress(offset + loadedInChunk);
    }).then(function (res) {
      retries = 0;
      if (res.done) { onProgress(file.size); return; }
      offset = res.nextOffset;
      onProgress(offset);
      return step();
    }).catch(function (err) {
      if (err && err.kind === 'session_dead') {
        // sesja wygasła – nowa sesja, plik od zera (reszta kolejki nietknięta)
        return initSession(file, guestName).then(function (freshUrl) {
          sessionUrl = freshUrl; offset = 0; retries = 0;
          return step();
        });
      }
      retries++;
      if (retries > MAX_RETRIES) throw err;
      var delay = Math.min(30000, 1000 * Math.pow(2, retries - 1));
      return sleep(delay).then(function () {
        // po zerwaniu sieci pytamy Drive, ile bajtów faktycznie dotarło
        return queryProgress(sessionUrl, file.size).then(function (st) {
          if (st.done) { onProgress(file.size); return; }
          offset = st.nextOffset;
          return step();
        }, function () {
          return step(); // status nieosiągalny – ponów chunk od ostatniego potwierdzonego offsetu
        });
      });
    });
  }

  return step();
}

// PUT chunka przez XHR (fetch nie daje postępu wysyłania).
function putChunk(sessionUrl, blob, start, end, total, onChunkProgress) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', sessionUrl, true);
    xhr.setRequestHeader('Content-Range', 'bytes ' + start + '-' + (end - 1) + '/' + total);
    xhr.timeout = 180000;

    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) onChunkProgress(e.loaded);
    };
    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve({ done: true });
      } else if (xhr.status === 308) {
        resolve({ done: false, nextOffset: parseRangeEnd(xhr.getResponseHeader('Range'), start) });
      } else if (xhr.status === 404 || xhr.status === 410) {
        reject({ kind: 'session_dead' });
      } else {
        reject({ kind: 'chunk_http', status: xhr.status });
      }
    };
    xhr.onerror = function () { reject({ kind: 'network' }); };
    xhr.ontimeout = function () { reject({ kind: 'timeout' }); };
    xhr.send(blob);
  });
}

// Zapytanie o status sesji: PUT bez body z Content-Range "bytes */total"
function queryProgress(sessionUrl, total) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', sessionUrl, true);
    xhr.setRequestHeader('Content-Range', 'bytes */' + total);
    xhr.timeout = 30000;
    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 201) resolve({ done: true });
      else if (xhr.status === 308) resolve({ done: false, nextOffset: parseRangeEnd(xhr.getResponseHeader('Range'), 0) });
      else if (xhr.status === 404 || xhr.status === 410) reject({ kind: 'session_dead' });
      else reject({ kind: 'status_http', status: xhr.status });
    };
    xhr.onerror = function () { reject({ kind: 'network' }); };
    xhr.ontimeout = function () { reject({ kind: 'timeout' }); };
    xhr.send();
  });
}

// Nagłówek "Range: bytes=0-12345" → następny offset (12346); brak nagłówka = nic nie dotarło
function parseRangeEnd(rangeHeader, fallback) {
  if (!rangeHeader) return fallback;
  var m = /bytes=\d+-(\d+)/.exec(rangeHeader);
  return m ? parseInt(m[1], 10) + 1 : fallback;
}

/* ===== Pomocnicze ===== */

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function fmtBytes(b) {
  if (b >= 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(2).replace('.', ',') + ' GB';
  return Math.round(b / (1024 * 1024)) + ' MB';
}

function plural(n, one, few, many) {
  if (n === 1) return one;
  var d = n % 10, h = n % 100;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
}

function errText(err) {
  if (!err) return 'błąd';
  if (err.kind === 'init_api' && err.code === 'file_too_large') return 'ponad 2 GB';
  if (err.kind === 'network' || err.kind === 'timeout') return 'problem z siecią';
  return 'błąd wysyłki';
}
