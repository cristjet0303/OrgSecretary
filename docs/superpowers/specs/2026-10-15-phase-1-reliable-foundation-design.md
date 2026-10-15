# OrgSecretary Offline: Phase 1 — Reliable Foundation Design Spec

- **Date**: 2026-10-15
- **Status**: Approved
- **Reference Spec**: `docs/superpowers/plans/OrgSecretary_Offline_System_Specification.md` (Phases 1 & Section 13)
- **Scope**: Desktop shell (Electron), SQLite database and migrations, typed dual-target `LocalApi` IPC bridge, Organization Profile management, Meeting CRUD with filtering/search, enhanced shared UI primitives, and dynamic Dashboard integration.

---

## 1. Context & Objectives

The goal of Phase 1 is to establish the reliable offline foundation for **OrgSecretary Offline**. This turns the base Angular 21 + Tailwind v4 project into a genuine offline-first desktop application with SQLite local persistence, secure Electron IPC bridging, dual-mode browser fallback for development and testing, organization profile management, meeting management CRUD, and an interactive dashboard.

---

## 2. Desktop Shell & Local Database Architecture

### 2.1 Electron Shell (`desktop/`)
- **`desktop/main.ts`**:
  - Main Electron application process.
  - Enforces `contextIsolation: true`, `nodeIntegration: false`, and `webSecurity: true`.
  - Sets up single-instance lock and window lifecycle.
  - Dispatches IPC handler registrations.
- **`desktop/preload.ts`**:
  - Context bridge exposing `window.localApi` to renderer.
  - Strict, narrow API surface preventing arbitrary shell or SQL execution.
- **`desktop/database/connection.ts`**:
  - SQLite database stored at `app.getPath('userData')/orgsecretary.db`.
  - Configures `PRAGMA foreign_keys = ON;`, WAL journal mode for performance and write safety.
- **`desktop/database/migrations.ts`**:
  - Executes initial schema migrations (`001_initial_schema.sql`).
- **`desktop/database/repositories/`**:
  - `organization.repository.ts`: CRUD for organization identity and settings.
  - `meeting.repository.ts`: CRUD, filtering, and status updates for meetings.
- **`desktop/ipc/`**:
  - IPC handler registrations connecting renderer IPC calls to repository methods with input validation.

### 2.2 Dual-Target `LocalApi` Bridge (`src/app/core/local-api/`)
To enable rapid testing in Vitest and standard browser development (`ng serve`) alongside native Electron desktop execution:
- **`LocalApi` Abstract Interface**:
  - Organization operations: `getOrganization()`, `saveOrganization(org)`.
  - Meeting operations: `getMeetings(filter?)`, `getMeetingById(id)`, `createMeeting(meeting)`, `updateMeeting(id, meeting)`, `deleteMeeting(id)`.
  - Database status: `getDatabaseStatus()`.
- **`ElectronLocalApi`**:
  - Invokes `window.localApi.*` over Electron IPC.
- **`WebLocalApi`**:
  - In-memory and local storage backed implementation for browser preview and Vitest tests.
- **`provideLocalApi()` Provider**:
  - Dynamically injects `ElectronLocalApi` if running within Electron (`window.localApi` present), otherwise injects `WebLocalApi`.

---

## 3. Database Schema (Migration 001)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT,
  address TEXT,
  contact_details TEXT,
  logo_path TEXT,
  header_lines_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL,
  meeting_number TEXT,
  meeting_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  chairperson TEXT,
  secretary TEXT,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'Planned',
  related_meeting_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (related_meeting_id) REFERENCES meetings (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
```

---

## 4. Angular Domain Modules & Feature Specifications

### 4.1 Organization Profile (`src/app/features/organization/`)
- **Route**: `/organization`
- **Component**: `OrganizationComponent`
- **Fields**: Name, acronym, address, contact details, document header lines.
- **Behavior**:
  - Validates required organization name.
  - Displays instant visual confirmation on save.
  - Updates global organization state signal in `OrganizationService`.

### 4.2 Meeting Management CRUD (`src/app/features/meetings/`)
- **Routes**:
  - `/meetings`: Meeting list with search, status filters (`All`, `Planned`, `In Preparation`, `In Progress`, `For Review`, `Approved`, `Archived`), and responsive card grid.
  - `/meetings/new`: Create meeting form.
  - `/meetings/:id`: Meeting detail view with metadata, status changer, and module links (Checklist, Agenda, Attendance, Minutes).
  - `/meetings/:id/edit`: Edit meeting form.
- **Meeting Model**:
  - `id`: string (UUID)
  - `title`: string (required)
  - `meetingType`: string (Regular, Special, Committee, Board)
  - `meetingNumber`: string (optional)
  - `meetingDate`: string (ISO YYYY-MM-DD, required)
  - `startTime`: string (optional)
  - `endTime`: string (optional)
  - `venue`: string (optional)
  - `chairperson`: string (optional)
  - `secretary`: string (optional)
  - `purpose`: string (optional)
  - `status`: MeetingStatus (`Planned` | `In Preparation` | `In Progress` | `For Review` | `Approved` | `Archived`)

### 4.3 Dynamic Dashboard (`src/app/features/dashboard/`)
- **Route**: `/dashboard`
- **Content**:
  - **Organization Banner**: If not configured, prompts setup; if configured, displays organization identity.
  - **Next Event Card**: Displays the closest upcoming meeting with date, venue, time, and single-click access.
  - **Metrics**: Total Meetings, In Preparation, Planned, Approved.
  - **Recent Meetings Table**: Quick status list with links to detail view.
  - **Quick Action Bar**: `New Meeting`, `Organization Profile`, `View Meetings`.

### 4.4 Shared UI Primitives (`src/app/shared/components/`)
- `ButtonComponent`: Existing signal-driven button with primary/secondary/outline variants.
- `BadgeComponent`: Colored pill component displaying status (`Planned` (indigo), `In Preparation` (amber), `In Progress` (blue), `For Review` (purple), `Approved` (emerald), `Archived` (slate)).
- `CardComponent`: Styled container with header, body, and footer slots.
- `ModalComponent`: Accessible dialog backdrop with cancel and action buttons.

---

## 5. Verification & Testing

1. **Unit Tests (Vitest)**:
   - `OrganizationService` tests for get and save operations.
   - `MeetingService` tests for CRUD and status filtering.
   - Component tests for `OrganizationComponent`, `MeetingListComponent`, `MeetingFormComponent`, `MeetingDetailComponent`, and `DashboardComponent`.
   - Shared UI component tests (`BadgeComponent`, `CardComponent`, `ModalComponent`).
2. **Build Verification**:
   - `npm run build` compiles with zero errors, producing optimized lazy-loaded feature chunks.
   - Electron compilation check for main/preload scripts.
3. **End-to-End Workflow Verification**:
   - Save organization profile -> verify persistence.
   - Create new meeting -> verify presence on meeting list and dashboard.
   - Update meeting status -> verify filter reflecting updated status.
