/**
 * Wesele Upload – backend (Google Apps Script web app)
 *
 * Jedyna funkcja API: initUpload – otwiera sesję resumable upload w Drive API v3
 * i zwraca frontowi sam URL sesji. Token OAuth nigdy nie opuszcza tego skryptu.
 *
 * DECYZJA O SCOPE (CLAUDE.md "Znane ryzyka"):
 * Używamy wąskiego scope'u `drive.file` zamiast pełnego `drive`. Scope `drive.file`
 * daje dostęp wyłącznie do plików/folderów utworzonych przez TĘ aplikację – nie
 * obejmuje folderu utworzonego ręcznie przez właściciela. Dlatego folder główny
 * tworzy sam skrypt przy pierwszym uruchomieniu (funkcja setup()), zapisuje jego
 * ID w PropertiesService i loguje link dla właściciela. Zysk: skrypt fizycznie
 * nie ma dostępu do reszty prywatnego Drive – minimalne ryzyko przy "Access: Anyone".
 */

var CONFIG = {
  ROOT_FOLDER_NAME: '(nie) Wesele Hani i Piotrka – zdjęcia od gości',
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2 GB na plik
  MAX_NAME_LENGTH: 50,
  FALLBACK_GUEST_NAME: 'Gość'
};

var PROP_ROOT_ID = 'ROOT_FOLDER_ID';

/**
 * Uruchom RĘCZNIE raz po wdrożeniu (Edytor → wybierz "setup" → Uruchom):
 * autoryzuje skrypt, tworzy folder główny i wypisuje link do niego w logu.
 */
function setup() {
  var id = getRootFolderId_();
  Logger.log('Folder główny gotowy: https://drive.google.com/drive/folders/' + id);
}

function doGet() {
  return jsonResponse_({ ok: true, service: 'wesele-upload', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents); // front wysyła text/plain z JSON-em (bez preflight CORS)
    if (payload.action === 'initUpload') return jsonResponse_(initUpload_(payload));
    if (payload.action === 'checkSession') return jsonResponse_(checkSession_(payload));
    return jsonResponse_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'server_error', detail: String(err) });
  }
}

function initUpload_(p) {
  var fileName = String(p.fileName || '').trim();
  var mimeType = String(p.mimeType || 'application/octet-stream');
  var size = Number(p.size);

  if (!fileName) return { ok: false, error: 'missing_file_name' };
  if (!isFinite(size) || size <= 0) return { ok: false, error: 'bad_size' };
  if (size > CONFIG.MAX_FILE_SIZE) return { ok: false, error: 'file_too_large', maxSize: CONFIG.MAX_FILE_SIZE };

  var guestName = sanitizeGuestName_(p.name);

  // Lock: dwóch gości o tym samym imieniu naraz nie może utworzyć dwóch folderów
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var folderId;
  try {
    folderId = findOrCreateSubfolder_(getRootFolderId_(), guestName);
  } finally {
    lock.releaseLock();
  }

  var sessionUrl = openResumableSession_(folderId, fileName, mimeType, size);
  if (!sessionUrl) return { ok: false, error: 'session_failed' };

  return { ok: true, uploadUrl: sessionUrl };
}

/**
 * Sprawdza status sesji resumable po stronie serwera.
 * Potrzebne, bo przeglądarka NIE jest w stanie odczytać finalnej odpowiedzi
 * sesji uploadu Drive (brak nagłówków CORS na ostatnim żądaniu – znany feler
 * Google). Serwer nie podlega CORS, więc widzi prawdziwy stan.
 */
function checkSession_(p) {
  var url = String(p.sessionUrl || '');
  var size = Number(p.size);
  var hostMatch = /^https:\/\/([^\/]+)\//.exec(url);
  var host = hostMatch ? hostMatch[1] : '';
  if (!/(^|\.)googleapis\.com$|(^|\.)googleusercontent\.com$/.test(host)) {
    return { ok: false, error: 'bad_session_url' };
  }
  if (!isFinite(size) || size <= 0) return { ok: false, error: 'bad_size' };

  var resp = UrlFetchApp.fetch(url, {
    method: 'put',
    headers: { 'Content-Range': 'bytes */' + size },
    muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  if (code === 200 || code === 201) return { ok: true, done: true };
  if (code === 308) {
    var headers = resp.getAllHeaders();
    var range = headers['Range'] || headers['range'] || '';
    var m = /bytes=\d+-(\d+)/.exec(range);
    return { ok: true, done: false, nextOffset: m ? parseInt(m[1], 10) + 1 : 0 };
  }
  if (code === 404 || code === 410) return { ok: true, dead: true };
  return { ok: false, error: 'status_' + code };
}

/** Otwiera sesję resumable upload; zwraca URL sesji (tylko on idzie do przeglądarki). */
function openResumableSession_(parentId, fileName, mimeType, size) {
  var resp = UrlFetchApp.fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(size)
      },
      // Oryginalna nazwa pliku zostaje; Drive dopuszcza duplikaty nazw – nie nadpisujemy
      payload: JSON.stringify({ name: fileName, parents: [parentId] }),
      muteHttpExceptions: true
    }
  );
  if (resp.getResponseCode() !== 200) {
    Logger.log('Sesja nieudana: HTTP ' + resp.getResponseCode() + ' ' + resp.getContentText());
    return null;
  }
  var headers = resp.getAllHeaders();
  return headers['Location'] || headers['location'] || null;
}

/** Folder główny: czytaj ID z properties; gdy brak lub skasowany – utwórz na nowo. */
function getRootFolderId_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_ROOT_ID);
  if (id && folderAlive_(id)) return id;

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    id = props.getProperty(PROP_ROOT_ID); // re-check po zdobyciu locka
    if (id && folderAlive_(id)) return id;
    id = createFolder_(CONFIG.ROOT_FOLDER_NAME, null);
    props.setProperty(PROP_ROOT_ID, id);
    return id;
  } finally {
    lock.releaseLock();
  }
}

function folderAlive_(id) {
  var resp = UrlFetchApp.fetch(
    'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?fields=id,trashed',
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) return false;
  return JSON.parse(resp.getContentText()).trashed === false;
}

/** Szuka podfolderu po nazwie (case-insensitive – "kasia" i "Kasia" to jeden folder). */
function findOrCreateSubfolder_(rootId, name) {
  var resp = UrlFetchApp.fetch(
    'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(
      "'" + rootId + "' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
    ) + '&fields=files(id,name)&pageSize=1000',
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true }
  );
  if (resp.getResponseCode() === 200) {
    var files = JSON.parse(resp.getContentText()).files || [];
    var lower = name.toLowerCase();
    for (var i = 0; i < files.length; i++) {
      if (files[i].name.toLowerCase() === lower) return files[i].id;
    }
  }
  return createFolder_(name, rootId);
}

function createFolder_(name, parentId) {
  var meta = { name: name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) meta.parents = [parentId];
  var resp = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(meta),
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error('Nie udało się utworzyć folderu "' + name + '": ' + resp.getContentText());
  }
  return JSON.parse(resp.getContentText()).id;
}

/** Imię gościa → bezpieczna nazwa folderu (trim, max 50 znaków, bez znaków sterujących i / \ ). */
function sanitizeGuestName_(raw) {
  var name = String(raw || '')
    .replace(/[\/\\<>:"|?*\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONFIG.MAX_NAME_LENGTH)
    .trim();
  // Usuń kropki na końcu (problematyczne w nazwach) i samotne kropki
  name = name.replace(/\.+$/, '').trim();
  return name || CONFIG.FALLBACK_GUEST_NAME;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
