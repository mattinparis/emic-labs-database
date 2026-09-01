# EMIC LABS DATABASE — Deployment Handoff Spec

Status: working prototype (single HTML file, no backend, no persistence outside Claude.ai)
Goal: a real, live, multi-user web app that Matt can edit and students can fill in, accessible by URL all year

This document exists so that whoever builds the real version, Matt via Claude Code, or a co-producer, doesn't have to reverse-engineer the prototype. Everything here is a direct, faithful translation of what's already built and tested.

---

## 1. Recommended stack

| Piece | Tool | Why |
|---|---|---|
| Hosting | **Vercel** (free Hobby tier) | Same pattern as the reference "Big Game Database." Serves the app at a `*.vercel.app` URL, or a custom domain later. |
| Database | **Supabase** (free tier) | Postgres database + a JS client that can be called directly from the browser, no custom backend server needed. |
| Framework | **Vite + React** | The prototype is already plain React. Vite keeps the build simple, no server-rendering complexity needed since this app has no SEO or server-only requirements. |
| Auth / edit gate | A single shared PIN (see Section 4) | Matches the "four-digit code" pattern Matt wants, not full user accounts. |

**Cost: €0** at this scale (6 groups, text-only data, no video/image storage). Two honest caveats, not blockers:
- Vercel's free tier is licensed for non-commercial use. A school teaching tool fits this.
- Supabase's free database pauses after 7 days of no activity. Nothing is lost; the first visitor after a gap just waits a few seconds while it wakes up.

---

## 2. Setup order (do these first, before any code work)

1. **Create a Supabase account** at supabase.com (free, GitHub or email login). Create one new project. Note the **Project URL** and **anon public API key** from Settings → API, both are needed by the app.
2. **Create a Vercel account** at vercel.com (free, sign up with GitHub, this makes step 4 much easier).
3. **Create a GitHub repository** for this project (e.g. `emic-labs-database`). Both Vercel and Claude Code work against a real repo, not a loose folder.
4. **Run the database schema** in Supabase's SQL editor (Section 3 below) to create the tables.
5. Hand the repo + these two Supabase credentials to whoever is building it (Claude Code or the co-producer).

Once steps 1 to 4 are done, the actual coding work (Section 5) is a well-scoped, mechanical job, not a design problem, the design is already finished.

---

## 3. Database schema

The prototype already treats each production's tab data as one atomic JSON object (`sections`), always read and written as a whole. The schema below mirrors that exactly rather than over-normalizing it into dozens of tables, which would add complexity without adding real value at this scale.

```sql
-- One row per production slot (currently 6, one per theme)
create table productions (
  id text primary key,              -- e.g. 'moral-dilemma', 'the-wait'
  theme_id text not null,
  budget_emic integer not null default 1000,
  sections jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Shared internal notes (Matt + team only, see Section 4 on access)
create table school_notes (
  id integer primary key default 1,
  content text not null default '',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- The shared edit PIN, checked client-side (see Section 4 for the honest limitation)
create table app_settings (
  id integer primary key default 1,
  edit_pin text not null,
  constraint single_row check (id = 1)
);

-- Seed the 6 production rows (themes are fixed, so this only needs to run once)
insert into productions (id, theme_id) values
  ('moral-dilemma', 'moral-dilemma'),
  ('the-wait', 'the-wait'),
  ('human-connection', 'human-connection'),
  ('the-debt', 'the-debt'),
  ('uncanny-familiar', 'uncanny-familiar'),
  ('second-chances', 'second-chances');

insert into school_notes (id, content) values (1, '');
insert into app_settings (id, edit_pin) values (1, 'CHANGE-ME');
```

**The exact shape of the `sections` JSON** (this is the whole data model, already fully built and tested in the prototype):

```
{
  members: string,              // comma-separated names
  filmTitle: string,
  tagline: string,
  pitch: string,                 // freeform
  script: string,                // freeform
  stage: string,                 // one of the 10 STAGES ids, see below
  length: string,
  cast: string,
  shootDays: string,
  budgetRaised: string,          // parsed leniently, "500", "500€", "€500" all work
  surplus: string,
  budget: [ { label: string, amount: string } ],
  schedule: [ { stageId: string, done: boolean, date: string, note: string } ],  // one row per STAGES entry
  shotlist: [ { number, location, duration, framing, characters, description } ],
  castCrew: [ { name, role, phone, email } ],
  equipment: [ string ],
  props: [ string ],
  callsheets: [ { day, location, scenes, notes, schedule: [ { time, who } ] } ],
  jury: string,
}
```

`THEMES` (6) and `STAGES` (10 months, October to July) are fixed and rarely change, they should stay as constants in the app's code, not database tables. If Matt wants to edit them without a code change later, that's a small follow-up, not a blocker now.

---

## 4. The edit PIN, honestly

This is a **friction gate, not a security boundary**. A single shared PIN, checked in the browser, stops casual/accidental edits, it does not stop someone determined to look at the app's code and find it. For this project's actual stakes (six student groups, no sensitive personal data beyond names), that trade-off is reasonable. If EMIC ever wants real security (individual logins, an audit trail of who changed what), that means Supabase Auth with real accounts, a bigger, separate piece of work, not a quick add-on.

**How it works in v1:**
- One row in `app_settings` holds the current PIN.
- The app has a simple "Enter code to edit" prompt. Once entered correctly, editing unlocks for that browser session.
- Browsing and reading is open to everyone with the link, no code needed, matching how the prototype already works today.

---

## 5. Build task list (for Claude Code)

This is written as a literal task list to hand to Claude Code, working against the GitHub repo from Section 2.

1. Scaffold a Vite + React project. Copy in `App.jsx` from the prototype (attached separately) as the starting point, along with the `logo.js` module.
2. Add the Supabase JS client (`@supabase/supabase-js`). Store the Project URL and anon key as Vercel environment variables, not hardcoded.
3. Replace the `window.storage.get/set` calls (Claude.ai-specific, will not exist in the deployed app) with Supabase calls:
   - `loadSaved(id)` → `supabase.from('productions').select('sections').eq('id', id).single()`
   - `saveJSON(id, sections)` → `supabase.from('productions').update({ sections }).eq('id', id)`
   - Same pattern for `school_notes`.
4. Add the PIN-gate: on app load, check for a stored "unlocked" flag in memory; if absent, show a prompt that checks the entered value against `app_settings.edit_pin`, then shows/hides the existing Edit buttons accordingly. The Edit UI itself needs no changes, only whether it's shown.
5. Remove the two "Export PDF" print-CSS quirks are already fixed in the current prototype, no changes needed there, it should work as-is via the browser's native print.
6. Deploy: connect the GitHub repo to Vercel (a few clicks in Vercel's dashboard), set the two Supabase environment variables there, deploy.
7. Test with the same rigor already applied to the prototype: open the live URL, edit a production, refresh the page, confirm the edit persisted, that's the one behavior that's fundamentally new versus the prototype.

Everything else, every tab, every field, every piece of copy, the whole visual design, carries over unchanged. This is a plumbing change, not a redesign.

---

## 6. What does NOT need to be rebuilt

To be clear about how much of this is already finished: the entire UI, all 9 production tabs, the Project Brief, Schedule, Contacts, School Notes views, the PDF export, the theme system, the 10-month calendar, the two worked examples, all of it is done, tested, and should move over close to unchanged. The work in Section 5 is entirely about *where the data lives*, not what the app looks like or does.
