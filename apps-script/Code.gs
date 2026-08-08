/**
 * DynamiX Daily — Calendar & Email bridge
 * =======================================
 *
 * This is the small personal backend for the dashboard at /dashboard/. It runs
 * free on Google's own infrastructure, under your Google account, so it can read
 * your Calendar and Gmail directly. Nothing is sent to any third party and there
 * is no server to pay for or maintain.
 *
 * What it does
 * ------------
 *   1. Reads Google Calendar events tagged `#task` and turns them into routines.
 *   2. Reads Gmail threads labelled `Dashboard/Task` and turns them into routines.
 *   3. Stores your completion history in a JSON file on your Drive, so ticking
 *      something off on your phone shows up on your laptop.
 *   4. Optionally emails you a daily digest of what is still outstanding.
 *
 * Setup (about five minutes)
 * --------------------------
 *   1. Go to script.google.com and create a new project.
 *   2. Paste this whole file in, replacing the default `myFunction`.
 *   3. Change SECRET below to a long random string of your own. Do that here in
 *      the Apps Script editor, not in the copy of this file in the repository —
 *      a committed secret ends up in git history, and the repository is what
 *      gets deployed to the public site. The same goes for the Zoho
 *      credentials further down.
 *   4. Run `setup` once from the editor toolbar and grant the permissions it
 *      asks for. This creates the Gmail labels and the state file.
 *   5. Deploy > New deployment > Web app.
 *        Execute as:      Me
 *        Who has access:  Anyone
 *      Copy the /exec URL.
 *   6. In the dashboard, open Settings > Calendar & Email bridge, paste the URL
 *      and the same SECRET, and press Save & sync.
 *
 * "Who has access: Anyone" is required because the dashboard calls this from
 * your browser without a Google login. The URL is unguessable and every request
 * must carry the SECRET, which is what actually protects it. Treat the URL and
 * secret like a password: anyone holding both can read the tasks this script
 * exposes. Rotate by changing SECRET and redeploying.
 */

// ============================================================================
// CONFIGURATION — edit this block
// ============================================================================

/** Change this. A long random string, the same one you paste into the dashboard. */
const SECRET = 'change-me-to-a-long-random-string';

/**
 * Which calendars to scan for `#task` events.
 * 'default' means your primary calendar. Add more calendar IDs as needed, e.g.
 *   const CALENDAR_IDS = ['default', 'abc123@group.calendar.google.com'];
 */
const CALENDAR_IDS = ['default'];

/** The marker that turns a calendar event into a task. */
const TASK_TAG = '#task';

/** Gmail labels used for email intake. Created for you by `setup`. */
const LABEL_TODO = 'Dashboard/Task';
const LABEL_DONE = 'Dashboard/Done';

/** Subject prefix that also marks an email as a task, so you can just mail yourself. */
const SUBJECT_PREFIX = /^\s*task\s*:\s*/i;

/** How far ahead to look when working out what a recurring calendar event repeats on. */
const LOOKAHEAD_DAYS = 21;

/** Where completion history is kept on your Drive. */
const STATE_FILE = 'dynamix-daily-state.json';

/** Keep this many days of completion history. Older entries are pruned. */
const HISTORY_DAYS = 400;

// ---------------------------------------------------------------- Zoho Mail --

/**
 * Zoho Mail intake. Off until you fill this in.
 *
 * Zoho has no MCP connector and no Apps Script service, so the bridge talks to
 * its REST API directly with an OAuth refresh token. Setup:
 *
 *   1. api-console.zoho.com > Add Client > Self Client.
 *   2. Generate a code for scope `ZohoMail.messages.ALL,ZohoMail.folders.READ`
 *      with your own account as the target.
 *   3. Exchange the code for a refresh token (once, from any terminal):
 *        curl -X POST 'https://accounts.zoho.com/oauth/v2/token' \
 *          -d 'grant_type=authorization_code' -d 'client_id=...' \
 *          -d 'client_secret=...' -d 'code=...'
 *   4. Paste the client id, secret, and refresh_token below — again, in the Apps
 *      Script editor rather than the repository copy. A Zoho refresh token does
 *      not expire on its own, so a committed one stays valid until revoked.
 *   5. In Zoho Mail, create a folder called Tasks and a folder called Done,
 *      then add a filter that moves flagged or tagged mail into Tasks.
 *
 * If your account is on a regional data centre, change ZOHO_DC: `com` (US),
 * `eu`, `in`, `com.au`, `jp`. Getting this wrong returns 401 on every call.
 */
const ZOHO = {
  enabled: false,
  clientId: '',
  clientSecret: '',
  refreshToken: '',
  dc: 'com',
  todoFolder: 'Tasks',
  doneFolder: 'Done'
};

// ============================================================================
// WEB APP ENTRY POINTS
// ============================================================================

/**
 * The dashboard posts here. Apps Script does not answer CORS preflight
 * requests, so the dashboard sends text/plain with no custom headers, which
 * the browser treats as a "simple" request and sends directly.
 */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return json(handle(body));
  } catch (err) {
    return json({ error: String(err && err.message || err) });
  }
}

/** Same thing over GET, so you can paste the URL in a browser to check it works. */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    return json(handle({ token: p.token, action: p.action || 'sync' }));
  } catch (err) {
    return json({ error: String(err && err.message || err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function handle(req) {
  if (SECRET === 'change-me-to-a-long-random-string') {
    return { error: 'Set a real SECRET in Code.gs before using the bridge.' };
  }
  if (!req || req.token !== SECRET) {
    return { error: 'Unauthorised. The secret does not match.' };
  }

  if (req.action === 'ping') {
    return { ok: true, at: new Date().toISOString() };
  }

  const state = readState();

  // Fold in whatever the client has done since it last synced. Completions are
  // union-merged and never deleted remotely, so two devices cannot clobber
  // each other by syncing in the wrong order.
  if (req.log && typeof req.log === 'object') {
    mergeLog(state.log, req.log);
  }
  if (req.activity && typeof req.activity === 'object') {
    mergeActivity(state.activity, req.activity);
  }

  const tasks = collectTasks();

  // An email task that is a one-off gets filed away once it has been ticked off.
  archiveCompletedEmailTasks(tasks, state.log);
  if (ZOHO.enabled) {
    try {
      archiveCompletedZohoTasks(tasks, state.log);
    } catch (err) {
      console.error('Zoho archive failed: ' + err);
    }
  }

  state.log = pruneLog(state.log, HISTORY_DAYS);
  state.activity = pruneActivity(state.activity, HISTORY_DAYS);
  state.lastSync = new Date().toISOString();
  writeState(state);

  return { tasks: tasks, log: state.log, activity: state.activity, at: state.lastSync };
}

// ============================================================================
// TASK COLLECTION
// ============================================================================

function collectTasks() {
  let tasks = [];
  try {
    tasks = tasks.concat(calendarTasks());
  } catch (err) {
    console.error('Calendar read failed: ' + err);
  }
  try {
    tasks = tasks.concat(emailTasks());
  } catch (err) {
    console.error('Gmail read failed: ' + err);
  }
  if (ZOHO.enabled) {
    try {
      tasks = tasks.concat(zohoTasks());
    } catch (err) {
      console.error('Zoho Mail read failed: ' + err);
    }
  }

  // Two sources can describe the same routine; first one wins.
  const seen = {};
  return tasks.filter(function (t) {
    if (!t || !t.id || seen[t.id]) return false;
    seen[t.id] = true;
    return true;
  });
}

// ---------------------------------------------------------------- Calendar --

/**
 * Scans the configured calendars for events tagged `#task`.
 *
 * Google's recurrence rules are not readable through CalendarApp without the
 * advanced service, so the schedule is worked out two ways: an explicit `@`
 * directive in the title always wins, and failing that the pattern is inferred
 * from which weekdays the event actually lands on over the lookahead window.
 */
function calendarTasks() {
  const start = startOfDay(new Date());
  const end = addDays(start, LOOKAHEAD_DAYS);

  // Group every instance of the same title together so a recurring event
  // becomes one routine rather than twenty.
  const groups = {};

  CALENDAR_IDS.forEach(function (calId) {
    const cal = (calId === 'default')
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calId);
    if (!cal) {
      console.warn('Calendar not found, skipping: ' + calId);
      return;
    }

    cal.getEvents(start, end).forEach(function (ev) {
      const rawTitle = ev.getTitle() || '';
      if (rawTitle.toLowerCase().indexOf(TASK_TAG) === -1) return;

      const parsed = parseDirectives(stripTag(rawTitle));
      const key = 'cal_' + slug(parsed.title);

      if (!groups[key]) {
        groups[key] = {
          id: key,
          title: parsed.title,
          notes: truncate(cleanText(ev.getDescription() || ''), 400),
          directives: parsed,
          allDay: ev.isAllDayEvent(),
          dates: [],
          weekdays: {},
          firstStart: ev.getStartTime()
        };
      }
      const g = groups[key];
      const d = ev.getStartTime();
      g.dates.push(d);
      g.weekdays[d.getDay()] = true;
      if (d < g.firstStart) g.firstStart = d;
    });
  });

  return Object.keys(groups).map(function (key) {
    const g = groups[key];
    return {
      id: g.id,
      title: g.title,
      notes: g.notes,
      schedule: inferSchedule(g),
      source: 'calendar',
      sourceRef: null,
      startDate: dateKey(g.firstStart),
      createdAt: g.firstStart.toISOString()
    };
  });
}

function inferSchedule(g) {
  const d = g.directives;

  // An explicit directive in the title always wins.
  if (d.freq) {
    const s = { freq: d.freq, time: d.time || defaultTime(g) };
    if (d.freq === 'weekly') s.days = d.days && d.days.length ? d.days : Object.keys(g.weekdays).map(Number);
    if (d.freq === 'monthly') s.dom = d.dom || g.firstStart.getDate();
    if (d.freq === 'once') s.date = d.date || dateKey(g.firstStart);
    return s;
  }

  const days = Object.keys(g.weekdays).map(Number).sort();
  const time = d.time || defaultTime(g);

  // A single instance in three weeks is a one-off, not a routine.
  if (g.dates.length <= 1) {
    return { freq: 'once', time: time, date: dateKey(g.firstStart) };
  }
  if (days.length >= 7) {
    return { freq: 'daily', time: time };
  }
  if (days.length === 5 && days.join() === '1,2,3,4,5') {
    return { freq: 'weekdays', time: time };
  }
  return { freq: 'weekly', time: time, days: days };
}

function defaultTime(g) {
  if (g.allDay) return '';
  return pad(g.firstStart.getHours()) + ':' + pad(g.firstStart.getMinutes());
}

function stripTag(title) {
  return title.replace(new RegExp(escapeRe(TASK_TAG), 'ig'), ' ');
}

// ------------------------------------------------------------------- Gmail --

/**
 * Turns labelled email threads into tasks. Label an email `Dashboard/Task`, or
 * simply mail yourself with a subject starting `Task:`.
 */
function emailTasks() {
  const query = 'label:"' + LABEL_TODO + '" -label:"' + LABEL_DONE + '"';
  const threads = GmailApp.search(query, 0, 50);

  return threads.map(function (thread) {
    const subject = thread.getFirstMessageSubject() || '(no subject)';
    const parsed = parseDirectives(subject.replace(SUBJECT_PREFIX, ''));

    let notes = '';
    try {
      const msgs = thread.getMessages();
      notes = truncate(cleanText(msgs[msgs.length - 1].getPlainBody() || ''), 300);
    } catch (err) {
      // A thread we cannot read the body of is still a perfectly good task.
    }

    const created = thread.getLastMessageDate();
    const schedule = { freq: parsed.freq || 'once', time: parsed.time || '' };
    if (schedule.freq === 'weekly') schedule.days = parsed.days && parsed.days.length ? parsed.days : [created.getDay()];
    if (schedule.freq === 'monthly') schedule.dom = parsed.dom || created.getDate();
    if (schedule.freq === 'once') schedule.date = parsed.date || dateKey(new Date());

    return {
      id: 'em_' + thread.getId(),
      title: parsed.title || subject,
      notes: notes,
      schedule: schedule,
      source: 'email',
      sourceRef: thread.getId(),
      startDate: dateKey(created),
      createdAt: created.toISOString()
    };
  });
}

/**
 * A one-off email task that has been ticked off gets its label swapped, which
 * both files the thread tidily and stops it coming back on the next sync.
 * Recurring email tasks keep their label — they are routines, not errands.
 */
function archiveCompletedEmailTasks(tasks, log) {
  const done = getOrCreateLabel(LABEL_DONE);
  const todo = getOrCreateLabel(LABEL_TODO);

  tasks.forEach(function (t) {
    if (t.source !== 'email' || !t.sourceRef) return;
    if (t.schedule.freq !== 'once') return;
    const entries = log[t.id];
    if (!entries || Object.keys(entries).length === 0) return;

    try {
      const thread = GmailApp.getThreadById(t.sourceRef);
      if (!thread) return;
      thread.addLabel(done);
      thread.removeLabel(todo);
    } catch (err) {
      console.error('Could not re-label thread ' + t.sourceRef + ': ' + err);
    }
  });
}

// -------------------------------------------------------------- Zoho Mail --

/**
 * Zoho Mail has no Apps Script service and no MCP connector, so this is a thin
 * REST client. Access tokens last an hour, so one is cached in script
 * properties and refreshed only when it is close to expiring.
 */
function zohoToken() {
  const props = PropertiesService.getScriptProperties();
  const cached = props.getProperty('zoho_access_token');
  const expiry = Number(props.getProperty('zoho_token_expiry') || 0);

  // Refresh a minute early so a token cannot expire mid-request.
  if (cached && Date.now() < expiry - 60000) return cached;

  const res = UrlFetchApp.fetch('https://accounts.zoho.' + ZOHO.dc + '/oauth/v2/token', {
    method: 'post',
    payload: {
      grant_type: 'refresh_token',
      refresh_token: ZOHO.refreshToken,
      client_id: ZOHO.clientId,
      client_secret: ZOHO.clientSecret
    },
    muteHttpExceptions: true
  });

  const body = JSON.parse(res.getContentText() || '{}');
  if (!body.access_token) {
    throw new Error('Zoho token refresh failed: ' + res.getContentText().slice(0, 200));
  }

  props.setProperty('zoho_access_token', body.access_token);
  props.setProperty('zoho_token_expiry', String(Date.now() + (body.expires_in || 3600) * 1000));
  return body.access_token;
}

function zohoFetch(path, options) {
  options = options || {};
  const res = UrlFetchApp.fetch('https://mail.zoho.' + ZOHO.dc + '/api' + path, {
    method: options.method || 'get',
    contentType: 'application/json',
    headers: { Authorization: 'Zoho-oauthtoken ' + zohoToken() },
    payload: options.payload ? JSON.stringify(options.payload) : undefined,
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    // A 401 here is nearly always the wrong data centre in ZOHO.dc.
    throw new Error('Zoho ' + path + ' returned ' + code + ': ' + res.getContentText().slice(0, 200));
  }
  return JSON.parse(res.getContentText() || '{}');
}

/** Zoho keys everything off numeric account and folder IDs, so resolve them once. */
function zohoAccountId() {
  const props = PropertiesService.getScriptProperties();
  const cached = props.getProperty('zoho_account_id');
  if (cached) return cached;

  const data = zohoFetch('/accounts');
  const account = (data.data || [])[0];
  if (!account) throw new Error('No Zoho Mail account visible to this token.');
  props.setProperty('zoho_account_id', account.accountId);
  return account.accountId;
}

function zohoFolderId(accountId, name) {
  const data = zohoFetch('/accounts/' + accountId + '/folders');
  const match = (data.data || []).filter(function (f) {
    return String(f.folderName).toLowerCase() === String(name).toLowerCase();
  })[0];
  if (!match) throw new Error('Zoho folder not found: ' + name);
  return match.folderId;
}

/** Turns messages sitting in the Zoho "Tasks" folder into routines. */
function zohoTasks() {
  const accountId = zohoAccountId();
  const folderId = zohoFolderId(accountId, ZOHO.todoFolder);

  const data = zohoFetch('/accounts/' + accountId + '/messages/view?folderId=' +
                         encodeURIComponent(folderId) + '&limit=50');

  return (data.data || []).map(function (msg) {
    const subject = msg.subject || '(no subject)';
    const parsed = parseDirectives(subject.replace(SUBJECT_PREFIX, ''));
    const received = new Date(Number(msg.receivedTime) || Date.now());

    const schedule = { freq: parsed.freq || 'once', time: parsed.time || '' };
    if (schedule.freq === 'weekly') schedule.days = parsed.days && parsed.days.length ? parsed.days : [received.getDay()];
    if (schedule.freq === 'monthly') schedule.dom = parsed.dom || received.getDate();
    if (schedule.freq === 'once') schedule.date = parsed.date || dateKey(new Date());

    return {
      id: 'zo_' + msg.messageId,
      title: parsed.title || subject,
      notes: truncate(cleanText(msg.summary || msg.sender || ''), 300),
      schedule: schedule,
      source: 'email',
      sourceRef: msg.messageId,
      startDate: dateKey(received),
      createdAt: received.toISOString()
    };
  });
}

/** A completed one-off Zoho task is moved to the Done folder so it stops coming back. */
function archiveCompletedZohoTasks(tasks, log) {
  const pending = tasks.filter(function (t) {
    if (t.source !== 'email' || !t.sourceRef) return false;
    if (String(t.id).indexOf('zo_') !== 0) return false;
    if (t.schedule.freq !== 'once') return false;
    const entries = log[t.id];
    return !!(entries && Object.keys(entries).length);
  });
  if (!pending.length) return;

  const accountId = zohoAccountId();
  const destfolderId = zohoFolderId(accountId, ZOHO.doneFolder);

  zohoFetch('/accounts/' + accountId + '/updatemessage', {
    method: 'put',
    payload: {
      mode: 'moveMessage',
      destfolderId: destfolderId,
      messageId: pending.map(function (t) { return t.sourceRef; })
    }
  });
}

/** Run this from the editor to check the Zoho credentials and folders resolve. */
function zohoCheck() {
  if (!ZOHO.enabled) { console.log('ZOHO.enabled is false — nothing to check.'); return; }
  const accountId = zohoAccountId();
  console.log('Account: ' + accountId);
  console.log('Todo folder: ' + zohoFolderId(accountId, ZOHO.todoFolder));
  console.log('Done folder: ' + zohoFolderId(accountId, ZOHO.doneFolder));
  const tasks = zohoTasks();
  console.log('Found ' + tasks.length + ' Zoho task(s).');
  tasks.forEach(function (t) { console.log('  ' + t.title + '  ' + JSON.stringify(t.schedule)); });
}

// ============================================================================
// DIRECTIVE PARSING
// ============================================================================

const DAY_TOKENS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/**
 * Pulls `@directives` out of a title and returns the remaining clean text.
 *
 *   "Call Mr Tan @weekdays @9am"  -> weekdays at 09:00
 *   "Team sync @mon @thu"         -> weekly on Monday and Thursday
 *   "Pay rent @monthly @1st"      -> monthly on the 1st
 *   "Review deck @2026-08-20"     -> one-off on that date
 */
function parseDirectives(text) {
  const out = { title: '', freq: null, time: null, days: [], dom: null, date: null };
  const tokens = String(text).match(/@[\w:.-]+/g) || [];

  tokens.forEach(function (raw) {
    const t = raw.slice(1).toLowerCase();

    if (t === 'daily' || t === 'everyday') { out.freq = 'daily'; return; }
    if (t === 'weekdays' || t === 'weekday') { out.freq = 'weekdays'; return; }
    if (t === 'weekly') { out.freq = out.freq || 'weekly'; return; }
    if (t === 'monthly') { out.freq = 'monthly'; return; }
    if (t === 'once' || t === 'today') { out.freq = 'once'; return; }

    if (DAY_TOKENS.hasOwnProperty(t.slice(0, 3)) && t.length <= 9) {
      out.freq = 'weekly';
      const d = DAY_TOKENS[t.slice(0, 3)];
      if (out.days.indexOf(d) === -1) out.days.push(d);
      return;
    }

    // @2026-08-20
    let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) { out.freq = 'once'; out.date = t; return; }

    // @9am @9pm @0930 @09:30 @17:30
    m = t.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)$/);
    if (m) {
      let h = parseInt(m[1], 10) % 12;
      if (m[3] === 'pm') h += 12;
      out.time = pad(h) + ':' + (m[2] || '00');
      return;
    }
    m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      out.time = pad(parseInt(m[1], 10)) + ':' + m[2];
      return;
    }

    // @730 @0730 @1730 — bare 24-hour times. Three or four digits only: a bare
    // @15 is too easily meant as the fifteenth, so day-of-month keeps its
    // ordinal suffix and anything shorter than three digits is left alone.
    m = t.match(/^(\d{1,2})(\d{2})$/);
    if (m) {
      const h = parseInt(m[1], 10);
      const mins = parseInt(m[2], 10);
      if (h <= 23 && mins <= 59) { out.time = pad(h) + ':' + m[2]; return; }
    }

    // @1st @15th — day of the month
    m = t.match(/^(\d{1,2})(st|nd|rd|th)$/);
    if (m) { out.dom = parseInt(m[1], 10); out.freq = out.freq || 'monthly'; return; }
  });

  if (out.days.length) out.days.sort(function (a, b) { return a - b; });

  out.title = String(text).replace(/@[\w:.-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
}

// ============================================================================
// STATE ON DRIVE
// ============================================================================

function readState() {
  const file = findStateFile();
  if (!file) return { log: {}, activity: {}, lastSync: null };
  try {
    const parsed = JSON.parse(file.getBlob().getDataAsString());
    return { log: parsed.log || {}, activity: parsed.activity || {}, lastSync: parsed.lastSync || null };
  } catch (err) {
    console.error('State file unreadable, starting fresh: ' + err);
    return { log: {}, activity: {}, lastSync: null };
  }
}

function writeState(state) {
  const content = JSON.stringify(state);
  const file = findStateFile();
  if (file) file.setContent(content);
  else DriveApp.createFile(STATE_FILE, content, MimeType.PLAIN_TEXT);
}

function findStateFile() {
  const it = DriveApp.getFilesByName(STATE_FILE);
  return it.hasNext() ? it.next() : null;
}

function mergeLog(target, incoming) {
  Object.keys(incoming).forEach(function (id) {
    const entries = incoming[id];
    if (!entries || typeof entries !== 'object') return;
    if (!target[id]) target[id] = {};
    Object.keys(entries).forEach(function (day) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
      if (!target[id][day]) target[id][day] = entries[day] || Date.now();
    });
  });
  return target;
}

/** Activity merges by entry id, so the same note is never stored twice. */
function mergeActivity(target, incoming) {
  Object.keys(incoming).forEach(function (day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    const entries = incoming[day];
    if (!Array.isArray(entries)) return;
    if (!target[day]) target[day] = [];

    const seen = {};
    target[day].forEach(function (e) { if (e && e.id) seen[e.id] = true; });

    entries.forEach(function (e) {
      if (!e || !e.id || seen[e.id]) return;
      target[day].push({
        id: String(e.id).slice(0, 40),
        at: String(e.at || new Date().toISOString()).slice(0, 40),
        text: String(e.text || '').slice(0, 1000),
        source: ['voice', 'typed', 'assistant'].indexOf(e.source) === -1 ? 'typed' : e.source
      });
      seen[e.id] = true;
    });
  });
  return target;
}

function pruneActivity(activity, days) {
  const cutoff = dateKey(addDays(new Date(), -days));
  const out = {};
  Object.keys(activity || {}).forEach(function (day) {
    if (day >= cutoff && activity[day] && activity[day].length) out[day] = activity[day];
  });
  return out;
}

function pruneLog(log, days) {
  const cutoff = dateKey(addDays(new Date(), -days));
  const out = {};
  Object.keys(log).forEach(function (id) {
    const kept = {};
    Object.keys(log[id]).forEach(function (day) {
      if (day >= cutoff) kept[day] = log[id][day];
    });
    if (Object.keys(kept).length) out[id] = kept;
  });
  return out;
}

// ============================================================================
// OPTIONAL: DAILY EMAIL DIGEST
// ============================================================================

/**
 * Emails you what is still outstanding. Run `installDigestTrigger` once to have
 * this fire every morning, so the nagging reaches you even if you never open
 * the dashboard.
 */
function sendDailyDigest() {
  const state = readState();
  const tasks = collectTasks();
  const today = dateKey(new Date());

  const outstanding = tasks.filter(function (t) {
    if (!isDueOn(t, new Date())) return false;
    return !(state.log[t.id] && state.log[t.id][today]);
  });

  if (!outstanding.length) return;

  const rows = outstanding.map(function (t) {
    const when = t.schedule.time ? ' — ' + t.schedule.time : '';
    return '<li style="margin-bottom:6px"><b>' + escapeHtml(t.title) + '</b>' +
           '<span style="color:#7A7A7A">' + escapeHtml(when) + '</span></li>';
  }).join('');

  const html =
    '<div style="font-family:Raleway,Helvetica,Arial,sans-serif;color:#303030;max-width:520px">' +
    '<p style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8A6B1E;margin:0 0 4px">DynamiX Daily</p>' +
    '<h2 style="margin:0 0 14px;font-size:20px;color:#111111">' + outstanding.length + ' still to do today</h2>' +
    '<ul style="padding-left:18px;margin:0 0 18px">' + rows + '</ul>' +
    '<p style="font-size:13px;color:#4C4C4C;margin:0">Reply to this email with <b>Task: something new</b> and label it ' +
    escapeHtml(LABEL_TODO) + ' to add it to tomorrow\'s list.</p>' +
    '</div>';

  GmailApp.sendEmail(Session.getActiveUser().getEmail(),
    'Daily: ' + outstanding.length + ' outstanding', '', { htmlBody: html });
}

/** Run once from the editor to schedule the digest for 7am each day. */
function installDigestTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDailyDigest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyDigest').timeBased().atHour(7).everyDays(1).create();
  console.log('Daily digest scheduled for around 7am.');
}

function isDueOn(t, d) {
  const s = t.schedule || {};
  if (t.startDate && dateKey(d) < t.startDate) return false;
  switch (s.freq) {
    case 'daily': return true;
    case 'weekdays': return d.getDay() >= 1 && d.getDay() <= 5;
    case 'weekly': return (s.days || []).indexOf(d.getDay()) !== -1;
    case 'monthly': return d.getDate() === (s.dom || 1);
    case 'once': return dateKey(d) === s.date;
    default: return true;
  }
}

// ============================================================================
// SETUP & DIAGNOSTICS
// ============================================================================

/** Run this once from the editor toolbar to create labels and grant permissions. */
function setup() {
  getOrCreateLabel(LABEL_TODO);
  getOrCreateLabel(LABEL_DONE);
  if (!findStateFile()) {
    DriveApp.createFile(STATE_FILE, JSON.stringify({ log: {}, activity: {}, lastSync: null }), MimeType.PLAIN_TEXT);
  }
  console.log('Labels ready: ' + LABEL_TODO + ', ' + LABEL_DONE);
  console.log('State file ready: ' + STATE_FILE);
  console.log('Now deploy as a web app and paste the /exec URL into the dashboard.');
}

/** Run this to see exactly what the dashboard would receive. */
function preview() {
  const tasks = collectTasks();
  console.log('Found ' + tasks.length + ' task(s):');
  tasks.forEach(function (t) {
    console.log('  [' + t.source + '] ' + t.title + '  ' + JSON.stringify(t.schedule));
  });
  if (!tasks.length) {
    console.log('Nothing found. Check that a calendar event title contains "' + TASK_TAG +
                '", or that a Gmail thread carries the "' + LABEL_TODO + '" label.');
  }
}

function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

// ============================================================================
// SMALL HELPERS
// ============================================================================

function pad(n) { return (n < 10 ? '0' : '') + n; }

function dateKey(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function startOfDay(d) {
  const c = new Date(d.getTime());
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d, n) {
  const c = new Date(d.getTime());
  c.setDate(c.getDate() + n);
  return c;
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function cleanText(s) {
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
