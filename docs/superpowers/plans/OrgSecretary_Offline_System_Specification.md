# Organization Secretary Automation System

## Product Requirements, UX/UI Direction, and Technical Architecture

**Working name:** OrgSecretary Offline\
**Product type:** Offline-first desktop application for organization
secretaries\
**Primary stack:** Angular + Tailwind CSS + SQLite\
**Primary goal:** Help a secretary prepare, run, document, and report an
organization meeting or event from one organized workspace---even
without an internet connection.

---

## 1. Product Vision

Build a professional, dependable, easy-to-use system that automates
repetitive secretarial work before, during, and after meetings. The
system should guide the secretary through a preparation checklist, run
event media in the correct order, organize the agenda, capture minutes
and attendance, record decisions and action items, and generate polished
documents using the organization's own letterhead and report formats.

The application must be **offline-first**. Core functions, saved
records, media playback, and document generation should work locally
without requiring an account, cloud server, or internet connection.

### Core design principles

- **Preparedness first:** show what is missing before an event starts.
- **Fast during meetings:** large controls, keyboard shortcuts,
  autosave, and minimal navigation.
- **Organization-specific output:** editable headers, logos,
  signatories, document numbers, and report templates.
- **Reliable records:** preserve drafts, track changes where
  practical, and avoid losing minutes if the app closes unexpectedly.
- **Simple and professional:** clean information hierarchy, restrained
  color, readable typography, and no cluttered dashboards.
- **Local privacy:** meeting records and participant information
  remain on the device unless the user explicitly exports or backs
  them up.

---

## 2. Users and Permissions

### Primary user: Secretary

Can create events, configure templates, manage attendance, operate the
event sequence, take minutes, record resolutions, and generate reports.

### Optional roles

For a single-computer deployment, roles can be disabled and the app can
use one local profile. If multiple people use the same device, support
local profiles:

- **Administrator:** organization settings, templates, users,
  backup/restore.
- **Secretary:** full meeting and reporting workflow.
- **Assistant Secretary:** meeting preparation, attendance, and draft
  minutes.
- **Viewer:** read-only access to approved records.

Do not build complex enterprise permissions in the first version unless
required.

---

## 3. Main Modules

### 3.1 Dashboard

Show a concise overview, not a wall of cards.

**Display:** - Next scheduled meeting or event - Preparation status (for
example, 8 of 10 tasks complete) - Draft minutes awaiting completion -
Recent meetings and reports - Outstanding action items and due dates -
Quick actions: `New Meeting`, `Continue Draft`, `Start Event`,
`Generate Report`, `Backup Data`

**Behavior:** - Highlight only urgent or incomplete work. - Allow the
secretary to resume the most recent draft in one click. - Show a useful
empty state for a new installation with a clear `Set Up Organization`
action.

### 3.2 Organization Profile and Document Branding

Allow the organization to define its identity once and reuse it in every
generated document.

**Fields:** - Organization name - Organization type and optional
acronym - Logo or seal - Address and contact details - Document header
lines - Footer text - Default document title and numbering format -
Default font family and sizes - Page size: A4 or Letter - Margins and
line spacing - Signatory names, titles, and signature placeholders -
Optional government/office-specific wording - Default report language

**Template editor:** - Preview the document while editing - Add, remove,
reorder, and align header elements - Upload a logo from the device -
Configure a line, divider, or accent color - Save multiple templates
(e.g., Minutes, Attendance, Resolution, Event Report, Notice) - Restore
a built-in default template

The editor should use structured settings rather than requiring users to
edit HTML. Offer an optional advanced mode only if it can be kept safe
and maintainable.

### 3.3 Meeting and Event Management

Create a meeting with:

- Meeting title and type
- Date, start time, expected end time
- Venue or online meeting details
- Presiding officer / chairperson
- Secretary and assistant secretary
- Meeting number or session number
- Expected participants
- Quorum requirement (optional)
- Meeting purpose and notes
- Related previous meeting
- Attachments and reference files
- Status: Planned, In Preparation, In Progress, For Review, Approved,
  Archived

Provide reusable meeting types and the ability to duplicate a previous
meeting as a starting point.

### 3.4 Preparation Checklist

Generate a checklist from the meeting type and allow custom tasks.

**Suggested checklist groups:**

**Documents** - Agenda prepared and reviewed - Previous minutes
available - Attendance sheet ready - Reports and supporting documents
collected - Resolutions or proposals prepared - Required signatories
confirmed

**Venue and equipment** - Venue confirmed - Projector/display tested -
Speakers and microphone tested - Laptop and power supply ready - Offline
media tested - Printed copies prepared, if needed

**Program** - Opening prayer/video selected - Philippine National Anthem
media selected - Opening remarks assigned - Agenda order confirmed -
Presenter or report owner confirmed - Closing prayer/program item
assigned

**Follow-up** - Invitations or notices sent - Attendance list prepared -
Previous action items reviewed - Report deadline noted

Each task should support status, owner, due date, notes, and optional
attachment. Allow custom checklists per meeting type. The dashboard
should show blockers, not just a percentage.

### 3.5 Event Program and Media Player

Provide a dedicated **Event Mode** with a clear, full-screen
presentation interface.

**Program sequence examples:** 1. Standby / welcome slide 2. Opening
prayer video 3. Philippine National Anthem video or audio 4. Opening
remarks 5. Roll call / attendance 6. Reading and approval of previous
minutes 7. Matters arising 8. Agenda items 9. Reports and discussions 10. Resolutions / motions 11. Announcements 12. Closing remarks or
prayer

**Media management:** - Import locally stored video and audio files. -
Store file paths and media metadata in SQLite; do not duplicate large
files unless the user chooses to copy them into the app's media
folder. - Preview each item before the event. - Set title, sequence,
duration, presenter, and notes. - Reorder program items using
drag-and-drop, with accessible up/down controls as a fallback. - Support
manual start, pause, resume, restart, next, previous, and stop. - Offer
optional auto-advance only when explicitly enabled. - Show the current
item, next item, and elapsed time. - Warn if a media file is missing or
unsupported. - Provide a fallback slide/message if media cannot play. -
Keep the main operator controls separate from the projected content. -
Offer a keyboard-friendly mode for use during a live event.

**Important:** Do not download national anthem or prayer videos
automatically. Let the organization choose authorized files stored on
the computer. Provide a reminder to verify that the chosen media is
appropriate and has been tested offline.

**Event Mode layout:** - Large current-program title - Current step
number and total steps - Progress indicator - Prominent play/pause and
next controls - Small "Up Next" preview - Timer and status - Quick
access to attendance and minutes without ending the event

### 3.6 Agenda Builder

Support a structured agenda with:

- Agenda number
- Topic/title
- Description or desired outcome
- Presenter or responsible person
- Allocated time
- Reference documents
- Priority
- Status: Not Started, In Discussion, Completed, Deferred
- Notes and decisions

Allow agenda items to be reordered and moved to a future meeting if
deferred. The agenda should connect directly to minute-taking so the
secretary does not have to retype item titles.

### 3.7 Attendance and Quorum

Support:

- Expected participant list
- Present, Absent, Late, Excused, Online (optional)
- Arrival and departure time (optional)
- Guest/observer status
- Attendance notes
- Manual participant addition
- Search and quick status changes
- Printable attendance sheet
- Optional quorum calculation based on configured rules

Do not assume a quorum rule. Let the organization configure the rule and
display the calculation with its inputs.

### 3.8 Live Minute-Taking Workspace

This is one of the most important screens. Optimize it for speed and low
distraction.

**Layout recommendation:** - Left: agenda list and item status - Center:
notes editor for the selected agenda item - Right: quick capture panel
for motions, decisions, action items, and attendees (collapsible)

**For each agenda item, capture:** - Discussion summary - Report or
presentation summary - Motion text - Moved by / seconded by (optional,
configurable) - Vote method and result (optional) - Resolution or
decision - Action item - Assigned person - Due date - Supporting
document reference - Follow-up notes

**Usability requirements:** - Autosave frequently and show a visible
`Saved` / `Saving…` / `Save failed` state. - Save a draft locally as the
user types. - Provide undo/redo. - Use keyboard shortcuts for common
actions. - Allow quick insertion of the current time. - Support plain
text and basic formatting. - Keep notes linked to the correct agenda
item. - Allow an item to be marked `Deferred` or `No action taken`. -
Recover unsaved work after an unexpected close. - Warn before leaving if
a save is pending or has failed.

Do not use speech recognition as a core dependency. It may be added
later as an optional feature, but manual editing must remain reliable
and fully offline.

### 3.9 Action Items and Resolutions Register

Track follow-through after the meeting.

**Action item fields:** - Description - Source meeting and agenda item -
Assigned person - Due date - Priority - Status: Open, In Progress,
Completed, Deferred, Cancelled - Completion notes and date

**Resolution fields:** - Resolution number - Title and full text - Date
approved - Related agenda item - Mover/seconder and vote result, if
applicable - Signatories - Status: Draft, Approved, Signed, Archived

Show overdue actions on the dashboard and allow them to be carried into
the next meeting's agenda.

### 3.10 Report and Document Generator

Generate professional documents from stored meeting data. Provide
preview before export.

**Built-in document types:** - Meeting agenda - Attendance sheet -
Minutes of the meeting - Meeting highlights / executive summary -
Resolutions register - Action items list - Post-event report - Notice or
invitation - Secretary's accomplishment report - Monthly/quarterly
meeting summary

**Minutes template sections:** 1. Organization header and logo 2.
Document title 3. Meeting details 4. Call to order 5. Attendance and
quorum (if configured) 6. Approval of previous minutes 7. Matters
arising 8. Agenda discussions and summaries 9. Motions, decisions, and
resolutions 10. Announcements 11. Adjournment 12. Prepared by / reviewed
by / approved by 13. Signature blocks 14. Optional footer, page number,
and document code

**Export formats:** - PDF for distribution and printing - DOCX for
further editing - Print-ready view - CSV for attendance or action-item
data where useful

Use a reliable local document-generation approach compatible with the
chosen desktop runtime. If DOCX generation cannot be supported cleanly
in the initial implementation, prioritize PDF and print-ready output
first and clearly disclose that limitation in the UI.

**Template behavior:** - Preview page breaks and header/footer
placement. - Support configurable page size, margins, fonts, spacing,
logo position, and signatory blocks. - Allow the user to choose which
sections appear in each report. - Do not overwrite approved reports
silently; create a new version or ask for confirmation. - Include a
generated-on date and optional document control number. - Keep the
original meeting record separate from the exported file.

### 3.11 Search, Archive, and Records

Provide a fast local search across: - Meeting title and date - Agenda
topics - Minutes text - Decisions and resolutions - Participants -
Action items - Document number

Filters: - Date range - Meeting type - Status - Chairperson -
Action-item status

Archived meetings should remain searchable and exportable. Include a
clear archive/restore process and confirmation before permanent
deletion.

### 3.12 Backup, Restore, and Data Portability

Offline data needs a dependable backup process.

**Requirements:** - Manual backup to a user-selected folder or external
drive - Optional reminder to back up after a configurable number of
days - Backup includes SQLite database, organization logo, templates,
and any media files copied into the app-managed media directory -
Restore from a verified backup with a clear preview of what will be
replaced - Validate backup contents before restoring - Warn if the
destination is not writable or has insufficient space - Export a
portable archive for migration to another computer - Keep backups
separate from the live database - Do not claim that a backup succeeded
until the operation is confirmed

Use SQLite's supported backup mechanisms or a safe close/copy procedure.
Do not copy a live database file casually while writes may be occurring.

### 3.13 Settings and Help

Include: - Organization profile and branding - Default meeting types and
templates - Default program sequence - Media folder settings - Date/time
and document-number formats - Keyboard shortcut reference - Database
location and storage status - Backup/restore - App version and local
diagnostic information - Guided first-run setup

---

## 4. Recommended Navigation

Use a left sidebar on desktop and a collapsible drawer on smaller
windows.

1.  Dashboard
2.  Meetings & Events
3.  Preparation Checklist
4.  Event Mode
5.  Agenda
6.  Attendance
7.  Minutes
8.  Actions & Resolutions
9.  Reports & Documents
10. Archive & Search
11. Organization Settings
12. Backup & Restore

Contextual links should take the user directly from a meeting to its
agenda, attendance, minutes, and reports. Avoid making users navigate
through unrelated global pages while a meeting is in progress.

---

## 5. Visual Design System

### Design direction

**Professional civic/organizational software:** calm, credible,
organized, and efficient. Avoid flashy gradients, excessive cards,
oversized headings, and decorative animations.

### Suggested palette

- Primary navy: `#17324D`
- Secondary blue: `#285B7A`
- Accent teal: `#168C8C`
- App background: `#F5F7FA`
- Surface: `#FFFFFF`
- Main text: `#17212B`
- Muted text: `#657384`
- Border: `#DCE3EA`
- Success: `#247A52`
- Warning: `#A76512`
- Error: `#B42318`

Use semantic colors sparingly. Never communicate status through color
alone; pair it with text or an icon.

### Typography and spacing

- Use a clear sans-serif font such as Inter or a system font stack.
- Use a consistent 4px/8px spacing rhythm.
- Use readable body text (typically 14--16px).
- Keep headings compact and hierarchical.
- Use generous whitespace without wasting the available screen.
- Prefer tables and concise lists for dense administrative records.
- Use consistent button sizes and visible focus states.

### Interaction and accessibility

- Keyboard navigable controls
- Clear focus indicators
- Labels for every form field
- Accessible contrast
- Confirmation for destructive actions
- Empty states that explain the next step
- Loading, success, and error states
- Avoid hover-only functionality
- Support window resizing and high-DPI displays

### Screen-specific priorities

- **Dashboard:** next event and blockers first.
- **Preparation:** checklist and unresolved issues first.
- **Event Mode:** maximum clarity and minimum distractions.
- **Minute-taking:** maximum editing space and persistent autosave
  status.
- **Report editor:** live preview and easy template controls.

---

## 6. Technical Architecture

### Recommended implementation

Angular is a browser application framework; it does not directly provide
a local SQLite database by itself. For a genuinely offline desktop
application, use a desktop shell such as **Electron** or **Tauri** to
package the Angular UI and expose a controlled local database API.

**Recommended practical baseline for a TypeScript-heavy team:** -
Frontend: Angular with standalone components and TypeScript - Styling:
Tailwind CSS - Desktop shell: Electron - Local database: SQLite -
Database access: main-process service or a narrowly scoped local API -
Validation: shared TypeScript schemas or equivalent validation layer -
Document generation: local PDF/print pipeline; DOCX support can be added
after validating library compatibility - Testing: Angular unit tests,
service tests, database integration tests, and end-to-end desktop
workflow tests

Tauri is a viable alternative for a smaller packaged app, but it
introduces a Rust layer. Choose one desktop shell; do not implement both
in the first version.

### Architecture layers

```text
Angular UI
  ├── Dashboard / Meetings / Agenda / Minutes / Reports
  ├── Shared components and design system
  ├── Feature services and state
  └── Typed LocalApi interface
          │
          ▼
Desktop bridge (secure, narrowly scoped IPC)
          │
          ▼
Application services
  ├── MeetingService
  ├── AgendaService
  ├── AttendanceService
  ├── MinutesService
  ├── ActionItemService
  ├── TemplateService
  ├── ExportService
  └── BackupService
          │
          ▼
SQLite repository layer
          │
          ▼
Local SQLite database + managed assets folder
```

### Important security requirements for Electron

- Keep `contextIsolation: true`.
- Keep `nodeIntegration: false` in the renderer.
- Use a preload script to expose only specific, typed operations.
- Validate every IPC input in the main process.
- Never expose arbitrary filesystem access or unrestricted SQL
  execution to Angular.
- Restrict file dialogs and media imports to explicit user actions.
- Keep the database and app-managed files in the operating system's
  application-data directory.
- Handle database errors and failed writes visibly.
- Package and test for the target operating systems.

### Offline requirements

- No required cloud login
- No required remote API calls for core workflows
- Local media playback
- Local database storage
- Local report generation
- Local search
- Manual portable backup and restore
- App should clearly explain which optional features, if any, require
  internet access

---

## 7. Suggested Project Structure

```text
org-secretary/
├── desktop/
│   ├── main.ts
│   ├── preload.ts
│   ├── ipc/
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrations/
│   │   └── repositories/
│   ├── services/
│   └── packaging/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── guards/
│   │   │   └── local-api/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   └── utilities/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── meetings/
│   │   │   ├── preparation/
│   │   │   ├── event-mode/
│   │   │   ├── agenda/
│   │   │   ├── attendance/
│   │   │   ├── minutes/
│   │   │   ├── action-items/
│   │   │   ├── resolutions/
│   │   │   ├── reports/
│   │   │   ├── archive/
│   │   │   └── settings/
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   └── styles.css
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
└── README.md
```

Adjust the structure to the selected Angular version and desktop-shell
tooling. Keep database code outside Angular components and do not put
SQL statements directly in UI files.

---

## 8. Initial SQLite Data Model

Use migrations from the beginning. Use primary keys, foreign keys,
indexes, and timestamps consistently. UUID/text IDs are useful when
records must be portable across databases, while integer IDs are also
valid for a single local database.

### Core tables

**organizations** - `id` - `name` - `acronym` - `address` -
`contact_details` - `logo_path` - `created_at` - `updated_at`

**document_templates** - `id` - `organization_id` - `name` -
`document_type` - `settings_json` - `is_default` - `created_at` -
`updated_at`

**meetings** - `id` - `title` - `meeting_type` - `meeting_number` -
`meeting_date` - `start_time` - `end_time` - `venue` - `chairperson` -
`secretary` - `purpose` - `status` - `related_meeting_id` -
`created_at` - `updated_at`

**participants** - `id` - `full_name` - `position_or_role` -
`contact_details` (optional) - `is_active` - `created_at` - `updated_at`

**meeting_attendance** - `id` - `meeting_id` - `participant_id`
(nullable for one-time guests) - `guest_name` (nullable) -
`attendance_status` - `arrival_time` - `departure_time` - `notes`

**agenda_items** - `id` - `meeting_id` - `parent_agenda_item_id`
(optional) - `item_number` - `title` - `description` - `presenter` -
`allocated_minutes` - `sort_order` - `status` - `created_at` -
`updated_at`

**minute_entries** - `id` - `meeting_id` - `agenda_item_id` (nullable
for opening/closing notes) - `entry_type` - `content` - `sort_order` -
`created_at` - `updated_at`

**motions_and_decisions** - `id` - `meeting_id` - `agenda_item_id` -
`record_type` - `title` - `content` - `moved_by` - `seconded_by` -
`vote_method` - `vote_result` - `status` - `created_at` - `updated_at`

**action_items** - `id` - `meeting_id` - `agenda_item_id` -
`description` - `assigned_to_participant_id` - `due_date` - `priority` -
`status` - `completion_notes` - `completed_at` - `created_at` -
`updated_at`

**program_items** - `id` - `meeting_id` - `title` - `item_type` -
`media_path` - `presenter` - `duration_seconds` - `sort_order` -
`auto_advance` - `notes` - `created_at` - `updated_at`

**preparation_tasks** - `id` - `meeting_id` - `title` - `category` -
`assigned_to` - `due_date` - `status` - `notes` - `sort_order` -
`created_at` - `updated_at`

**resolutions** - `id` - `meeting_id` - `agenda_item_id` -
`resolution_number` - `title` - `content` - `approval_date` - `status` -
`created_at` - `updated_at`

**attachments** - `id` - `meeting_id` - `related_entity_type` -
`related_entity_id` - `file_name` - `file_path` - `mime_type` -
`file_size` - `created_at`

**app_settings** - `key` - `value_json` - `updated_at`

**document_exports** - `id` - `meeting_id` - `document_type` -
`file_path` - `template_id` - `generated_at` - `version_number`

### Database rules

- Enable SQLite foreign-key enforcement on each connection.
- Store dates in a consistent ISO format and document the local
  timezone convention.
- Use transactions for multi-table operations.
- Add indexes for meeting dates, meeting status, agenda order,
  action-item status/due date, participant names, and searchable text.
- Use parameterized queries only.
- Use SQLite FTS5 for full-text search if supported by the packaged
  SQLite build; otherwise provide a simple indexed search fallback.
- Store large media outside the database; store paths and metadata in
  SQLite.
- Handle missing media paths gracefully.
- Use migrations for schema updates and test migration/rollback
  strategies.
- Decide whether soft deletion is needed for records that must remain
  auditable.

---

## 9. Key Workflows

### Workflow A: Prepare a meeting

1.  Create a meeting or duplicate a previous meeting.
2.  Confirm date, venue, chairperson, and secretary.
3.  Select a meeting type and load its default checklist.
4.  Build or adjust the agenda.
5.  Add participants and expected attendees.
6.  Add prayer and anthem media to the program.
7.  Import supporting reports and previous minutes.
8.  Review the preparation checklist.
9.  Preview the agenda and attendance sheet.
10. Mark the meeting `Ready` only when required tasks are complete,
    while allowing an authorized override with a reason.

### Workflow B: Run the event

1.  Open Event Mode.
2.  Confirm media paths and test audio/video.
3.  Start the program from the standby screen.
4.  Play prayer and national anthem as configured.
5.  Record attendance and quorum status.
6.  Move through the agenda with clear current/next indicators.
7.  Capture notes, motions, decisions, and assigned tasks.
8.  Pause or resume the program without losing the current state.
9.  Mark the event as concluded and save the session.

### Workflow C: Finalize minutes and reports

1.  Open the meeting's minute-taking workspace.
2.  Review each agenda item and fill missing notes.
3.  Check that motions, decisions, and action items are linked
    correctly.
4.  Review attendance and meeting details.
5.  Generate the minutes using the selected organization template.
6.  Preview page layout and correct any overflow or missing content.
7.  Save a draft or mark it `For Review`.
8.  After approval, export the final PDF and/or editable document.
9.  Create action-item follow-ups for the next meeting.
10. Back up the database and required assets.

### Workflow D: Next meeting follow-up

1.  Show open and overdue action items.
2.  Let the secretary choose which items to carry forward.
3.  Add carried-forward items to the next meeting's agenda.
4.  Preserve the original source meeting and action-item history.

---

## 10. Validation and Error Handling

- Require a meeting title and date.
- Validate date/time ranges and warn about likely mistakes.
- Prevent duplicate agenda sort positions from causing ambiguous
  order.
- Warn if the same media file is referenced but no longer exists.
- Warn before generating a report with missing required details.
- Distinguish warnings from blocking errors.
- Keep the user's draft when a database write fails.
- Provide a retry action and clear error message.
- Never silently discard notes, overwrite approved reports, or replace
  a database during restore without confirmation.
- Confirm permanent deletion and explain what related records will be
  affected.
- Test file names containing spaces, Unicode characters, and long
  paths.

---

## 11. Non-Functional Requirements

- **Offline operation:** core functions work with Wi-Fi disabled.
- **Reliability:** autosave, recovery, transactions, safe migrations,
  and backup/restore testing.
- **Performance:** common screens should feel responsive with
  thousands of meetings and action items.
- **Maintainability:** feature-based Angular modules, typed models,
  repositories, and migration scripts.
- **Portability:** packaged builds for the agreed operating system(s).
- **Accessibility:** keyboard operation, focus indicators, readable
  contrast, and non-color status cues.
- **Privacy:** no analytics or network transmission by default.
- **Data ownership:** user can export records and back up files
  without vendor lock-in.

---

## 12. Testing Strategy

### Unit tests

- Meeting and agenda validation
- Checklist completion calculation
- Quorum calculation
- Report section selection
- Document numbering
- Action-item due-date/status logic

### Integration tests

- SQLite migrations and foreign keys
- Meeting creation with agenda and attendance
- Autosave and draft recovery
- Backup/restore integrity
- Missing media handling
- Export data mapping

### End-to-end tests

- First-run organization setup
- Create and prepare a meeting
- Run an event program and move between steps
- Record attendance and minutes
- Generate a report using a custom header
- Close/reopen the app and confirm records persist
- Restore a backup in a test environment

### Manual acceptance checks

- Disconnect the internet and complete the full meeting workflow.
- Test videos and audio on the actual event laptop and projector.
- Test with the organization's real logo, printer, and document
  format.
- Test long minutes with multiple page breaks.
- Confirm backup can be restored on a different machine running the
  supported build.

---

## 13. Phased Development Plan

### Phase 1 --- Reliable foundation

- Desktop shell and secure local bridge
- Angular + Tailwind design system
- SQLite database and migrations
- Organization profile
- Meeting CRUD
- Dashboard and local persistence
- Backup/restore foundation

### Phase 2 --- Meeting preparation

- Meeting types
- Preparation checklist
- Agenda builder
- Participants and attendance
- Program sequence and local media preview

### Phase 3 --- Live event and minutes

- Event Mode
- Playback controls and missing-media warnings
- Live minute-taking workspace
- Autosave and draft recovery
- Motions, decisions, and action items

### Phase 4 --- Professional reporting

- Custom header/logo/template editor
- Agenda and attendance exports
- Minutes generation
- PDF/print workflow
- Resolution and action-item registers
- Export history/versioning

### Phase 5 --- Polish and release

- Search and archive
- Carry-forward action items
- Accessibility and keyboard shortcuts
- Performance and security review
- Packaging, installer, and upgrade path
- Real-world event simulation and backup/restore verification

**MVP recommendation:** deliver Phases 1--3 with dependable local
storage before spending significant time on advanced document styling.
Then implement the custom report editor against real examples of the
organization's existing documents.

---

## 14. Definition of Done

The first production-ready version is complete when a secretary can:

- Set up the organization's branding and default document header.
- Create a meeting and prepare a checklist.
- Arrange the agenda and program order.
- Select and test offline prayer and national anthem media.
- Run the event with clear controls.
- Record attendance, agenda notes, motions, decisions, and action
  items.
- Close and reopen the application without losing data.
- Generate a readable minutes report with the organization's own
  header and signatories.
- Export or print the report.
- Back up and restore the database and required assets.
- Complete the workflow without internet access.

---

## 15. Implementation Prompt for a Coding Assistant

Use the following as the main build prompt when implementing the system:

> Act as a senior Angular engineer, desktop application architect,
> SQLite database designer, QA engineer, and professional UI/UX
> designer. Build **OrgSecretary Offline**, an offline-first desktop
> application that automates an organization secretary's work before,
> during, and after meetings.
>
> Use Angular with standalone components, TypeScript, and Tailwind CSS
> for the UI. Package it as a desktop application using Electron with a
> secure preload/IPC bridge and SQLite for local persistence. Keep
> `contextIsolation` enabled and `nodeIntegration` disabled. Do not
> expose arbitrary filesystem access or SQL execution to the renderer.
> All core workflows must work without internet access.
>
> Build the application with a clean, professional civic/organizational
> design: navy and restrained teal accents, light neutral surfaces,
> clear typography, compact headings, consistent spacing, accessible
> contrast, keyboard focus states, and uncluttered screens. Prioritize
> the dashboard, meeting preparation checklist, Event Mode, live
> minute-taking, and document preview.
>
> Implement organization branding and configurable report templates;
> meeting and event management; reusable meeting types; preparation
> checklists; agenda builder; local video/audio program sequence for
> opening prayer and Philippine National Anthem; manual playback
> controls; attendance and configurable quorum; live minutes linked to
> agenda items; motions, decisions, resolutions, action items and due
> dates; report generation; archive/search; backup/restore; and
> first-run setup.
>
> Use SQLite migrations, foreign keys, parameterized queries,
> transactions, typed repository/service layers, and tested
> backup/restore. Keep large media files outside SQLite and store their
> paths and metadata. Implement visible autosave status, draft recovery,
> missing-media warnings, safe deletion confirmations, and clear errors
> that never silently discard a user's work.
>
> Generate minutes, agendas, attendance sheets, resolutions, action
> registers, and post-event reports using the organization's own logo,
> header, footer, page settings, document number, and signatory blocks.
> Include a preview before export. Prioritize PDF/print-ready output and
> add DOCX only with a verified compatible local solution.
>
> Work incrementally. First produce the project setup, architecture,
> database migrations, and shared design system. Then implement one
> complete vertical workflow at a time, including tests. Do not create a
> visually impressive but nonfunctional prototype. Do not leave fake
> buttons, mock-only persistence, placeholder reports, or unimplemented
> actions presented as complete. Use typed interfaces,
> loading/empty/error states, responsive layouts, and realistic sample
> data clearly separated from production data.
>
> Before finishing each phase, run the available checks and report what
> is implemented, what was tested, any limitations, and the exact
> commands to run the application. Do not claim offline support,
> successful export, or successful backup unless verified.

---

## 16. Decisions to Confirm Before Development

1.  **Target operating system:** Windows only, or Windows/macOS/Linux?
2.  **Distribution:** installed desktop app, or must it also run in a
    browser?
3.  **Document formats:** is PDF sufficient for the first release, or is
    editable DOCX required immediately?
4.  **Existing report samples:** can the organization provide a sample
    minutes document, header/logo, attendance sheet, and event report to
    reproduce?
5.  **Multiple computers:** is this for one secretary on one laptop, or
    will multiple users need to share records?
6.  **Media policy:** should the app reference files in their current
    folders or copy selected files into a managed app folder for easier
    backup?
7.  **Approval workflow:** does the organization need
    draft/review/approved/signed states and formal document numbering?

**Recommended starting assumptions:** Windows desktop app, one primary
computer, fully offline core workflows, managed local media folder, PDF
export first, and an editable organization template system. These
assumptions can be adjusted before implementation.
