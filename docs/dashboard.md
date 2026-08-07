# Daily Dashboard

A private, mobile-first dashboard for the things that need doing every day. It lives at
[`/dashboard/`](../dashboard/index.html), is installable on a phone, works offline, and can
pull tasks in from Google Calendar and Gmail.

It is deliberately built in two layers:

| Layer | What it needs | What you get |
|---|---|---|
| **The dashboard** | Nothing. Open the page. | Routines, tick-offs, streaks, carry-over nagging, calendar export, on-device reminders. |
| **The bridge** | A one-off Apps Script setup, ~5 minutes | Tasks created from Calendar events and emails, plus completions synced across devices. |

The dashboard is fully useful on its own. The bridge is what satisfies "let me instruct work
through the calendar or email app."

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
- Syncing happens on load, when the app regains focus, and a couple of seconds after you tick
  something off.
- History older than 400 days is pruned.

### Daily email digest (optional)

Run `installDigestTrigger` once from the Apps Script editor and it emails you every morning
with whatever is still outstanding. This is the one reminder path that reaches you even if you
never open the dashboard and ignore your calendar.

---

## 3. Troubleshooting

| Symptom | Cause |
|---|---|
| `Unauthorised. The secret does not match.` | The secret in Settings differs from `SECRET` in `Code.gs`. |
| `Set a real SECRET in Code.gs` | Step 3 of setup was skipped. |
| Sync fails with a network error | The deployment is not set to *Anyone*, or you copied the `/dev` URL rather than `/exec`. |
| A calendar event does not appear | The title is missing `#task`, or the calendar is not listed in `CALENDAR_IDS`. |
| An email does not appear | The thread is missing the `Dashboard/Task` label, or already carries `Dashboard/Done`. |
| Changes to `Code.gs` have no effect | Apps Script serves the last *deployed* version. Deploy → Manage deployments → edit → **New version**. |

---

## 4. Design notes

The dashboard follows [`branding-dynamix.md`](branding-dynamix.md): Source Serif 4 for display,
IBM Plex Sans for UI, red as the single accent with gold rationed to the carried-over label and
streak chips, `--dark` surfaces for the header, Lucide-style 1.5px outline icons, and calm
150/250ms motion. It is not styled as AWFA, since it is served from the DynamiX Group domain
and the two brands are meant to stay visually distinct.
