# Daily Dashboard

A private, mobile-first dashboard for the things that need doing every day. It lives at
[`/dashboard/`](../dashboard/index.html), is installable on a phone, works offline, and can
pull tasks in from Google Calendar, Gmail, and Zoho Mail.

It is deliberately built in layers:

| Layer | What it needs | What you get |
|---|---|---|
| **The dashboard** | Nothing. Open the page. | Routines, tick-offs, streaks, carry-over nagging, calendar export, on-device reminders. |
| **The bridge** | A one-off Apps Script setup, ~5 minutes | Tasks created from Calendar events, Gmail, and Zoho Mail, plus completions synced across devices. |
| **The assistant** | An Anthropic API key in Vercel | A chat panel that answers questions about your routines and activity, and can tick things off, add routines, or log what happened. |
| **Voice** | Nothing. Chrome or Safari. | Speak a note instead of typing it; dictate questions and hear the answer back. |

The dashboard is fully useful on its own. The bridge is what satisfies "let me instruct work
through the calendar or email app." The assistant is optional on top of both.

---

## 1. The dashboard

Open `/dashboard/` and add it to your home screen (iPhone: Share → Add to Home Screen;
Android: ⋮ → Install app). It then behaves like a normal app and opens without a browser bar.

### Routines

A routine is something with a schedule: every day, weekdays, certain days of the week,
monthly, or a one-off. Optionally it carries a time, which is what drives reminders.

The dashboard ships with five weekday routines seeded as a starting point. Edit or archive
them freely — they are only there so the first screen is not empty.

### How the nagging works

This is the part that answers "if not done, keep reminding me."

- A routine due today that has never been missed sits in **Due today**.
- Miss it, and from the next due day it moves up into **Carried over**, above everything else,
  with an amber left edge and a `Missed yesterday` chip.
- Miss it three or more times running and the edge turns red and the chip counts the run:
  `Missed 4 in a row`.
- Carrying over is not the same as being due. A Monday-only routine that was missed keeps
  showing in Carried over every day until it is done, rather than going quiet until next Monday.

Ticking something off clears the run and starts a streak. Streaks of two days or more show as
a gold chip. A streak is counted over *due* days, so skipping a weekday routine on Sunday
does not break it.

### Reminders

Two mechanisms, and you want both:

1. **Calendar alerts (reliable).** Connect → *Download .ics for all routines*. Open the file
   on your phone and add it to Google Calendar. Every routine becomes a recurring event with
   an alarm at its scheduled time. These fire whether or not the dashboard is open, which is
   what makes them the real backstop.
2. **On-device notifications (convenient).** Settings → *Enable notifications*. These fire while
   the installed app is running or backgrounded. Browsers are free to suspend a background page,
   so treat these as a bonus rather than the guarantee.

Times are written as floating local time, so a 9am routine is 9am wherever you are rather than
shifting when you travel.

### The activity log and the day browser

Routines are what you *intended* to do. The activity log is what actually happened — meetings,
calls, outcomes. Each entry is timestamped and filed under a day.

The date in the header is a browser. Use `‹` and `›` to step back through previous days;
**Today** returns. Everything on the screen follows the day you are looking at: the ring, the
routine lists, and the activity. You can still tick a routine off on a past day, which is how
you back-fill something you forgot to mark at the time.

Carry-over is deliberately *not* shown on past days. "Missed three in a row" is a statement
about now; on a day in the past a routine was simply done or it wasn't.

Three ways to log activity:

- **Speak it.** The microphone button beside `+`, or *Speak a note*. Talk, then **Stop & save**.
- **Type it.** *Add a note*.
- **Tell the assistant.** Say "I met Mr Tan about his SRS top-up" in the Ask tab and it files
  the entry itself — that is what `log_activity` is for.

### Voice

Voice uses the browser's own `SpeechRecognition`, so there is nothing to install and no audio
service to pay for.

- **The microphone on the Today view** captures an activity note.
- **The microphone in the Ask composer** dictates a question. Because the question was spoken,
  the answer is read back aloud; a typed question stays silent.
- The mic stays open across natural pauses, so you can think mid-sentence. You decide when to
  stop.

> **Where your voice goes.** This app records nothing and uploads nothing itself. But Chrome
> performs speech recognition **on Google's servers**, so dictated text leaves the device via
> the browser. Recent Safari does it on-device. Treat the microphone the way you would a search
> box, and type anything you would not want transcribed off-device.

Unsupported browsers (notably Firefox, which does not ship `SpeechRecognition`) simply say so
and leave typing available.

**This is push-to-talk, not an always-on agent.** Gemini Spark keeps working in the cloud with
your laptop shut; a web page cannot. Browsers suspend background pages, and no page may hold
the microphone open indefinitely. If you want ambient always-listening capture, that needs a
native app or a device assistant, not this.

### Your data

Everything is in this browser's local storage. Nothing leaves the device unless you connect
the bridge. Settings has **Export backup** / **Import backup** for moving between devices or
keeping a copy, and a **Reset everything** button.

Because the page is served from the public site, treat it as a public URL with private
*contents*: the page itself is `noindex` and holds no data, and your routines only exist in
your own browser.

---

## 2. The bridge (Calendar + Email)

The bridge is a Google Apps Script that runs under your own Google account. It reads your
calendar and inbox directly, so there is no third-party service in the middle, no OAuth app to
register, and nothing to pay for.

The code is [`apps-script/Code.gs`](../apps-script/Code.gs).

### Setup

1. Go to [script.google.com](https://script.google.com) and create a new project.
2. Paste in the whole of `apps-script/Code.gs`, replacing the default `myFunction`.
3. Change `SECRET` at the top to a long random string.
4. Run `setup` once from the toolbar and grant the Gmail, Calendar, and Drive permissions.
   This creates the labels and the state file.
5. **Deploy → New deployment → Web app**, with *Execute as* **Me** and *Who has access*
   **Anyone**. Copy the `/exec` URL.
6. In the dashboard: Settings → Calendar & Email bridge → paste the URL and the same secret →
   **Save & sync**.

Run `preview` from the editor at any point to see exactly what the dashboard would receive.

> **On "Who has access: Anyone."** This is required because the dashboard calls the script from
> your browser without a Google sign-in. The URL is unguessable and every request must carry
> your secret, which is what actually protects it. Anyone holding both the URL and the secret
> can read the tasks the script exposes, so treat the pair like a password. To rotate, change
> `SECRET` and redeploy.

### Creating tasks from Calendar

Put `#task` anywhere in a Google Calendar event title.

| Event title | Becomes |
|---|---|
| `Review pipeline #task @daily` | Every day |
| `Morning calls #task @weekdays @9am` | Weekdays at 09:00 |
| `Team sync #task @mon @thu` | Weekly on Monday and Thursday |
| `File GST #task` (single event) | One-off on that date |

If you give no `@` directive, the schedule is inferred from which weekdays the event actually
falls on over the next three weeks, and the time comes from the event's own start time. An
all-day event gets no time. Explicit directives always win over inference.

### Creating tasks from Email

Either apply the Gmail label **`Dashboard/Task`** to any thread, or mail yourself with a
subject starting `Task:`. The subject becomes the title and the last message's body becomes
the notes.

```
Subject: Task: Call Mr Tan about his CPF top-up @weekdays @9am
```

Directives work the same as on calendar events. When a one-off email task is ticked off, the
script swaps its label to **`Dashboard/Done`** so the thread is filed and does not come back.
Recurring email tasks keep their label, because they are routines rather than errands.

### Creating tasks from Zoho Mail

Zoho Mail has no MCP connector and no Apps Script service, so the bridge talks to Zoho's REST
API directly. There are two ways in, and they are not exclusive.

**The quick way — forward into Gmail.** In Zoho Mail, add a filter that forwards anything you
tag or flag to your Gmail address, and a Gmail filter that applies `Dashboard/Task` to it.
Nothing to configure in `Code.gs`; the existing Gmail intake picks it up. Five minutes of
clicking, and mail makes one extra hop.

**The native way — the Zoho API.** Fill in the `ZOHO` block at the top of `Code.gs`:

1. At [api-console.zoho.com](https://api-console.zoho.com), add a **Self Client**.
2. Generate a code for scope `ZohoMail.messages.ALL,ZohoMail.folders.READ`.
3. Exchange it once for a refresh token:
   ```sh
   curl -X POST 'https://accounts.zoho.com/oauth/v2/token' \
     -d 'grant_type=authorization_code' -d 'client_id=...' \
     -d 'client_secret=...' -d 'code=...'
   ```
4. Paste the client id, secret, and `refresh_token` into `ZOHO`, and set `enabled: true`.
5. In Zoho Mail, create folders named **Tasks** and **Done**, and add a filter routing tagged
   mail into Tasks.
6. Run `zohoCheck` from the Apps Script editor to confirm the credentials and folders resolve.

Subjects parse exactly like Gmail ones, directives and all. A completed one-off is moved to
the Done folder so it stops coming back.

> **Data centre matters.** `ZOHO.dc` must match your account: `com` (US), `eu`, `in`, `com.au`,
> or `jp`. The wrong value returns 401 on every call, which reads like a bad token.

### Directive reference

| Directive | Meaning |
|---|---|
| `@daily`, `@everyday` | Every day |
| `@weekdays` | Monday to Friday |
| `@mon` `@tue` `@wed` `@thu` `@fri` `@sat` `@sun` | Weekly on those days (combine freely) |
| `@monthly`, `@1st`, `@15th` | Monthly on that day |
| `@once`, `@today` | One-off |
| `@2026-08-20` | One-off on that date |
| `@9am`, `@2pm`, `@0730`, `@17:30` | Time of day |

### Sync behaviour

- Calendar and email tasks are **owned by Google**. Each sync replaces them wholesale, so
  deleting the calendar event deletes the task.
- Routines you create in the dashboard are **never touched** by sync.
- Completions are **union-merged in both directions** and never deleted remotely, so two
  devices syncing in any order cannot clobber each other.
- Activity notes merge **by entry id**, so a note written on your phone reaches your laptop and
  re-syncing never duplicates it.
- Syncing happens on load, when the app regains focus, and a couple of seconds after you tick
  something off.
- History older than 400 days is pruned.

### Daily email digest (optional)

Run `installDigestTrigger` once from the Apps Script editor and it emails you every morning
with whatever is still outstanding. This is the one reminder path that reaches you even if you
never open the dashboard and ignore your calendar.

---

## 3. The assistant

The chat panel lives behind the **Ask** tab. It answers questions about your routines —
what's outstanding, what you keep missing, how your streaks look — and can act: tick something
off, add a routine, archive one you're done with. Every action it takes shows as a green chip
in the conversation, so nothing happens silently.

### How it is wired

An API key cannot live in a static page, so the chat panel calls a small serverless function
on this same site: [`api/chat.ts`](../api/chat.ts). The function is stateless — it holds the
key and nothing else. Your routines and the conversation live in your browser and are sent
with each request; nothing is stored server-side.

Writes work the same way round. When the assistant wants to change something, the function
hands the request back to the browser, the browser applies it to local storage, and the result
goes back for the next turn. The server never touches your data.

### Setup

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).
2. In your Vercel project settings, add environment variables:
   - `ANTHROPIC_API_KEY` — required.
   - `DASHBOARD_SHARED_KEY` — optional but recommended. Any long random string.
3. Redeploy.
4. If you set a shared key, put the same value in Settings → Assistant.

> **Set the shared key.** Without it the endpoint answers anyone who finds the URL, and every
> answer bills your Anthropic account. It is one environment variable and one field.

### What it can and cannot see

It sees your routines and their status — nothing else. It has no access to your inbox, your
calendar beyond what has already synced into routines, your clients, or any firm data. It is
also instructed not to give financial, regulatory, or compliance advice: that is your
profession and MAS rules govern it, so the assistant stays out of it.

### Cost

It runs on `claude-opus-5` at low effort, which suits routine lookups and keeps replies quick.
A typical question costs a fraction of a cent. To change the model or effort, edit `MODEL` and
`output_config.effort` in `api/chat.ts`.

## 4. Troubleshooting

| Symptom | Cause |
|---|---|
| `Unauthorised. The secret does not match.` | The secret in Settings differs from `SECRET` in `Code.gs`. |
| `Set a real SECRET in Code.gs` | Step 3 of setup was skipped. |
| Sync fails with a network error | The deployment is not set to *Anyone*, or you copied the `/dev` URL rather than `/exec`. |
| A calendar event does not appear | The title is missing `#task`, or the calendar is not listed in `CALENDAR_IDS`. |
| An email does not appear | The thread is missing the `Dashboard/Task` label, or already carries `Dashboard/Done`. |
| Changes to `Code.gs` have no effect | Apps Script serves the last *deployed* version. Deploy → Manage deployments → edit → **New version**. |
| Zoho returns 401 on everything | `ZOHO.dc` does not match your account's data centre. |
| Zoho folder not found | The folder names in `ZOHO` must match Zoho Mail exactly, including case. |
| Assistant says the key is not configured | `ANTHROPIC_API_KEY` is missing from the Vercel project, or the project has not been redeployed since it was added. |
| Assistant returns Unauthorised | `DASHBOARD_SHARED_KEY` is set in Vercel but the matching value is missing from Settings → Assistant. |

---

## 5. Design notes

The dashboard follows [`branding.md`](branding.md), the AWFA kit — Raleway throughout, gold
`#D5AB45` as the single accent, Lucide-style 1.5px outline icons, calm 150/250ms motion — with
one deliberate deviation: **the dark anchor is black `#111111`, not the kit's forest `#27392E`.**
David asked for gold and black. Black is also the better ground for the DynamiX logo, whose
chrome lettering washes out on light surfaces, and it lifts the accent contrast from 5.69:1 to
8.76:1.

Two contrast rules are load-bearing rather than decorative, because gold is a light colour:

- **Nothing white ever sits on gold.** White on `#D5AB45` is 2.16:1, well under AA. Every gold
  fill — buttons, the FAB, your own chat bubbles — takes black text instead, at 8.76:1.
- **Gold is never body copy on white**, for the same reason. Where a gold-toned label is wanted
  on a light surface the token is `--accent-text` (`#8A6B1E`, 5.00:1), not `--accent`.

The amber, green, red, and blue semantic colours have the same problem to a lesser degree, so
each has a `-text` variant tuned to clear 4.5:1. On dark surfaces the constraint disappears —
the brightened `#E0BA5C` on the dark background is 10.5:1 — so `--accent-text` and `--accent`
converge there.

The DynamiX Group name and voice are unchanged; only the visual system moved.
