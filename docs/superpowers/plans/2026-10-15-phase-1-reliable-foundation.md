# Phase 1: Reliable Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 1 of OrgSecretary Offline: Electron desktop shell, SQLite database & migrations, dual-target LocalApi bridge, Organization Profile management, Meeting CRUD with filtering/search, shared UI components, and dynamic Dashboard.

**Architecture:** Electron main process with SQLite persistence via secure typed IPC; Angular 21 frontend with standalone components, Signals reactivity, dual-target LocalApi (Electron + Web fallback), and Tailwind CSS v4 styling.

**Tech Stack:** Angular 21, Tailwind CSS v4, Electron, SQLite (better-sqlite3), TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-15-phase-1-reliable-foundation-design.md`

## Global Constraints

- Angular 21 standalone components throughout
- State management and component inputs/outputs must prioritize Signals (`signal()`, `computed()`, `input()`, `output()`)
- Dependency injection must use `inject(...)`
- Dual-target `LocalApi`: Electron IPC when running in Electron, Web/in-memory fallback when running in browser dev or Vitest
- Electron security: `contextIsolation: true`, `nodeIntegration: false`, parameterized SQL queries
- All tests must pass via `npm test`

## Review Focus

- Electron preload script leaking Node APIs to renderer: verified via strict `contextBridge` mappings
- Meeting filtering or status transitions producing stale state: verified in `MeetingService` and component specs
- Form validation allowing empty meeting title or organization name: verified in form specs
- Organization first-run onboarding banner not hiding once organization is configured: verified in dashboard spec
- TypeScript path aliases resolving properly across all new feature files and specs: verified in test and build runs

---

### Task 1: Setup Models & Electron Dependencies

**Files:**
- Create: `src/app/core/models/organization.model.ts`
- Create: `src/app/core/models/meeting.model.ts`
- Create: `src/app/core/models/database.model.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `Organization` interface
  - `Meeting`, `MeetingType`, `MeetingStatus` interfaces
  - `DatabaseStatus` interface
  - Installed `electron` and `better-sqlite3` packages with scripts

- [ ] **Step 1: Create domain models**

Create `src/app/core/models/organization.model.ts`:
```typescript
export interface Organization {
  id: string;
  name: string;
  acronym?: string;
  address?: string;
  contactDetails?: string;
  logoPath?: string;
  headerLines?: string[];
  createdAt: string;
  updatedAt: string;
}
```

Create `src/app/core/models/meeting.model.ts`:
```typescript
export type MeetingStatus =
  | 'Planned'
  | 'In Preparation'
  | 'In Progress'
  | 'For Review'
  | 'Approved'
  | 'Archived';

export type MeetingType =
  | 'Regular'
  | 'Special'
  | 'Committee'
  | 'Board'
  | 'General Assembly';

export interface Meeting {
  id: string;
  title: string;
  meetingType: MeetingType;
  meetingNumber?: string;
  meetingDate: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  venue?: string;
  chairperson?: string;
  secretary?: string;
  purpose?: string;
  status: MeetingStatus;
  relatedMeetingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingFilter {
  status?: MeetingStatus | 'All';
  searchQuery?: string;
}
```

Create `src/app/core/models/database.model.ts`:
```typescript
export interface DatabaseStatus {
  connected: boolean;
  type: 'electron-sqlite' | 'web-storage';
  filePath?: string;
  tablesCount: number;
}
```

- [ ] **Step 2: Install Electron and SQLite development packages**

Run:
```bash
npm install -D electron @types/better-sqlite3 better-sqlite3 --legacy-peer-deps
```

- [ ] **Step 3: Add desktop scripts to package.json**

In `package.json`, add:
```json
"electron": "electron ./dist-desktop/main.js",
"build:desktop": "tsc -p tsconfig.desktop.json"
```

- [ ] **Step 4: Verify TypeScript compiles models**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/models package.json
git commit -m "feat(core): add domain models for organization, meetings, and database status"
```

---

### Task 2: Dual-Target LocalApi Bridge & Core Services

**Files:**
- Create: `src/app/core/local-api/local-api.interface.ts`
- Create: `src/app/core/local-api/web-local-api.service.ts`
- Create: `src/app/core/local-api/electron-local-api.service.ts`
- Create: `src/app/core/local-api/local-api.token.ts`
- Create: `src/app/core/services/organization.service.ts`
- Create: `src/app/core/services/organization.service.spec.ts`
- Create: `src/app/core/services/meeting.service.ts`
- Create: `src/app/core/services/meeting.service.spec.ts`
- Modify: `src/app/app.config.ts`

**Interfaces:**
- Consumes: Models from Task 1
- Produces: `LocalApi` contract, `OrganizationService` (reactive Signals for organization), `MeetingService` (reactive Signals for meetings list and CRUD).

- [ ] **Step 1: Define `LocalApi` interface and token**

Create `src/app/core/local-api/local-api.interface.ts`:
```typescript
import { Organization } from '../models/organization.model';
import { Meeting, MeetingFilter } from '../models/meeting.model';
import { DatabaseStatus } from '../models/database.model';

export interface LocalApi {
  getOrganization(): Promise<Organization | null>;
  saveOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Organization>;
  getMeetings(filter?: MeetingFilter): Promise<Meeting[]>;
  getMeetingById(id: string): Promise<Meeting | null>;
  createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Meeting>;
  deleteMeeting(id: string): Promise<boolean>;
  getDatabaseStatus(): Promise<DatabaseStatus>;
}
```

Create `src/app/core/local-api/local-api.token.ts`:
```typescript
import { InjectionToken } from '@angular/core';
import { LocalApi } from './local-api.interface';

export const LOCAL_API = new InjectionToken<LocalApi>('LOCAL_API');
```

- [ ] **Step 2: Implement `WebLocalApi` and `ElectronLocalApi`**

Create `src/app/core/local-api/web-local-api.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { LocalApi } from './local-api.interface';
import { Organization } from '../models/organization.model';
import { Meeting, MeetingFilter } from '../models/meeting.model';
import { DatabaseStatus } from '../models/database.model';

@Injectable({ providedIn: 'root' })
export class WebLocalApi implements LocalApi {
  private orgKey = 'orgsecretary_organization';
  private meetingsKey = 'orgsecretary_meetings';

  async getOrganization(): Promise<Organization | null> {
    const data = localStorage.getItem(this.orgKey);
    return data ? JSON.parse(data) : null;
  }

  async saveOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Organization> {
    const existing = await this.getOrganization();
    const now = new Date().toISOString();
    const saved: Organization = {
      id: org.id || existing?.id || 'org-' + Date.now(),
      name: org.name,
      acronym: org.acronym,
      address: org.address,
      contactDetails: org.contactDetails,
      logoPath: org.logoPath,
      headerLines: org.headerLines || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    localStorage.setItem(this.orgKey, JSON.stringify(saved));
    return saved;
  }

  async getMeetings(filter?: MeetingFilter): Promise<Meeting[]> {
    const data = localStorage.getItem(this.meetingsKey);
    let list: Meeting[] = data ? JSON.parse(data) : [];
    if (filter?.status && filter.status !== 'All') {
      list = list.filter(m => m.status === filter.status);
    }
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(q) || (m.chairperson && m.chairperson.toLowerCase().includes(q)));
    }
    return list;
  }

  async getMeetingById(id: string): Promise<Meeting | null> {
    const list = await this.getMeetings();
    return list.find(m => m.id === id) || null;
  }

  async createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    const list = await this.getMeetings();
    const now = new Date().toISOString();
    const created: Meeting = {
      ...meeting,
      id: 'meeting-' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    list.push(created);
    localStorage.setItem(this.meetingsKey, JSON.stringify(list));
    return created;
  }

  async updateMeeting(id: string, updates: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Meeting> {
    const list = await this.getMeetings();
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) throw new Error(`Meeting with id ${id} not found`);
    const updated: Meeting = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    localStorage.setItem(this.meetingsKey, JSON.stringify(list));
    return updated;
  }

  async deleteMeeting(id: string): Promise<boolean> {
    const list = await this.getMeetings();
    const filtered = list.filter(m => m.id !== id);
    localStorage.setItem(this.meetingsKey, JSON.stringify(filtered));
    return filtered.length < list.length;
  }

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    const meetings = await this.getMeetings();
    return {
      connected: true,
      type: 'web-storage',
      tablesCount: 2,
    };
  }
}
```

Create `src/app/core/local-api/electron-local-api.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { LocalApi } from './local-api.interface';
import { Organization } from '../models/organization.model';
import { Meeting, MeetingFilter } from '../models/meeting.model';
import { DatabaseStatus } from '../models/database.model';

declare global {
  interface Window {
    localApi?: LocalApi;
  }
}

@Injectable({ providedIn: 'root' })
export class ElectronLocalApi implements LocalApi {
  private get api(): LocalApi {
    if (typeof window !== 'undefined' && window.localApi) {
      return window.localApi;
    }
    throw new Error('Electron localApi bridge not available in this window');
  }

  getOrganization(): Promise<Organization | null> {
    return this.api.getOrganization();
  }
  saveOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Organization> {
    return this.api.saveOrganization(org);
  }
  getMeetings(filter?: MeetingFilter): Promise<Meeting[]> {
    return this.api.getMeetings(filter);
  }
  getMeetingById(id: string): Promise<Meeting | null> {
    return this.api.getMeetingById(id);
  }
  createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    return this.api.createMeeting(meeting);
  }
  updateMeeting(id: string, meeting: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Meeting> {
    return this.api.updateMeeting(id, meeting);
  }
  deleteMeeting(id: string): Promise<boolean> {
    return this.api.deleteMeeting(id);
  }
  getDatabaseStatus(): Promise<DatabaseStatus> {
    return this.api.getDatabaseStatus();
  }
}
```

- [ ] **Step 3: Write failing tests for `OrganizationService` and `MeetingService` (RED)**

Create `src/app/core/services/organization.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { OrganizationService } from './organization.service';
import { LOCAL_API } from '../local-api/local-api.token';
import { WebLocalApi } from '../local-api/web-local-api.service';

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        OrganizationService,
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    });
    service = TestBed.inject(OrganizationService);
  });

  it('should initialize with null organization and load successfully', async () => {
    expect(service.organization()).toBeNull();
    await service.loadOrganization();
    expect(service.isConfigured()).toBe(false);
  });

  it('should save organization and update reactive signals', async () => {
    const saved = await service.saveOrganization({
      name: 'United Civic Council',
      acronym: 'UCC',
      address: 'City Hall',
      contactDetails: 'info@ucc.org',
    });
    expect(saved.name).toBe('United Civic Council');
    expect(service.organization()?.name).toBe('United Civic Council');
    expect(service.isConfigured()).toBe(true);
  });
});
```

Create `src/app/core/services/meeting.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { MeetingService } from './meeting.service';
import { LOCAL_API } from '../local-api/local-api.token';
import { WebLocalApi } from '../local-api/web-local-api.service';

describe('MeetingService', () => {
  let service: MeetingService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        MeetingService,
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    });
    service = TestBed.inject(MeetingService);
  });

  it('should create and retrieve meetings', async () => {
    const created = await service.createMeeting({
      title: 'Q4 General Assembly',
      meetingType: 'General Assembly',
      meetingDate: '2026-11-01',
      status: 'Planned',
    });
    expect(created.id).toBeTruthy();
    expect(service.meetings().length).toBe(1);
    expect(service.meetings()[0].title).toBe('Q4 General Assembly');
  });

  it('should filter meetings by status', async () => {
    await service.createMeeting({ title: 'M1', meetingType: 'Regular', meetingDate: '2026-11-01', status: 'Planned' });
    await service.createMeeting({ title: 'M2', meetingType: 'Special', meetingDate: '2026-11-02', status: 'Approved' });
    
    await service.loadMeetings({ status: 'Planned' });
    expect(service.meetings().length).toBe(1);
    expect(service.meetings()[0].title).toBe('M1');
  });
});
```

- [ ] **Step 4: Run test to verify it fails (RED)**

Run: `npm test`
Expected: FAIL (Services not implemented yet).

- [ ] **Step 5: Implement `OrganizationService` and `MeetingService` (GREEN)**

Create `src/app/core/services/organization.service.ts`:
```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { LOCAL_API } from '../local-api/local-api.token';
import { Organization } from '../models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private localApi = inject(LOCAL_API);

  organization = signal<Organization | null>(null);
  isLoading = signal<boolean>(false);
  isConfigured = computed(() => this.organization() !== null && !!this.organization()?.name);

  async loadOrganization(): Promise<Organization | null> {
    this.isLoading.set(true);
    try {
      const org = await this.localApi.getOrganization();
      this.organization.set(org);
      return org;
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Organization> {
    this.isLoading.set(true);
    try {
      const saved = await this.localApi.saveOrganization(data);
      this.organization.set(saved);
      return saved;
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

Create `src/app/core/services/meeting.service.ts`:
```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { LOCAL_API } from '../local-api/local-api.token';
import { Meeting, MeetingFilter, MeetingStatus } from '../models/meeting.model';

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private localApi = inject(LOCAL_API);

  meetings = signal<Meeting[]>([]);
  selectedMeeting = signal<Meeting | null>(null);
  isLoading = signal<boolean>(false);

  upcomingMeetings = computed(() => {
    return this.meetings()
      .filter(m => m.status === 'Planned' || m.status === 'In Preparation')
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  });

  nextMeeting = computed(() => {
    return this.upcomingMeetings()[0] || null;
  });

  async loadMeetings(filter?: MeetingFilter): Promise<Meeting[]> {
    this.isLoading.set(true);
    try {
      const list = await this.localApi.getMeetings(filter);
      this.meetings.set(list);
      return list;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getMeetingById(id: string): Promise<Meeting | null> {
    this.isLoading.set(true);
    try {
      const meeting = await this.localApi.getMeetingById(id);
      this.selectedMeeting.set(meeting);
      return meeting;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    this.isLoading.set(true);
    try {
      const created = await this.localApi.createMeeting(meeting);
      await this.loadMeetings();
      return created;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateMeeting(id: string, updates: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Meeting> {
    this.isLoading.set(true);
    try {
      const updated = await this.localApi.updateMeeting(id, updates);
      await this.loadMeetings();
      if (this.selectedMeeting()?.id === id) {
        this.selectedMeeting.set(updated);
      }
      return updated;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateMeetingStatus(id: string, status: MeetingStatus): Promise<Meeting> {
    return this.updateMeeting(id, { status });
  }

  async deleteMeeting(id: string): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const ok = await this.localApi.deleteMeeting(id);
      await this.loadMeetings();
      if (this.selectedMeeting()?.id === id) {
        this.selectedMeeting.set(null);
      }
      return ok;
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

In `src/app/app.config.ts`, provide `LOCAL_API`:
```typescript
import { LOCAL_API } from './core/local-api/local-api.token';
import { ElectronLocalApi } from './core/local-api/electron-local-api.service';
import { WebLocalApi } from './core/local-api/web-local-api.service';

// Inside providers array:
{
  provide: LOCAL_API,
  useFactory: () => {
    if (typeof window !== 'undefined' && window.localApi) {
      return new ElectronLocalApi();
    }
    return new WebLocalApi();
  },
}
```

- [ ] **Step 6: Run tests to verify they pass (GREEN)**

Run: `npm test`
Expected: PASS for all tests.

- [ ] **Step 7: Commit**

```bash
git add src/app/core/local-api src/app/core/services src/app/app.config.ts
git commit -m "feat(core): add dual-target LocalApi bridge, OrganizationService, and MeetingService"
```

---

### Task 3: Electron Desktop Shell, SQLite Database & Preload Bridge

**Files:**
- Create: `desktop/database/schema.sql`
- Create: `desktop/database/connection.ts`
- Create: `desktop/database/repositories/organization.repository.ts`
- Create: `desktop/database/repositories/meeting.repository.ts`
- Create: `desktop/ipc/handlers.ts`
- Create: `desktop/preload.ts`
- Create: `desktop/main.ts`
- Create: `tsconfig.desktop.json`

**Interfaces:**
- Produces: Electron entrypoint with secure preload context bridge, SQLite schema initialization, and IPC handlers for organization & meetings.

- [ ] **Step 1: Write SQLite schema migration file**

Create `desktop/database/schema.sql`:
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

- [ ] **Step 2: Implement SQLite database connection and repositories**

Create `desktop/database/connection.ts`:
```typescript
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'orgsecretary.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run initial schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  }

  return db;
}
```

Create `desktop/database/repositories/organization.repository.ts`:
```typescript
import { getDatabase } from '../connection';

export class OrganizationRepository {
  static get() {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM organizations LIMIT 1').get() as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      acronym: row.acronym,
      address: row.address,
      contactDetails: row.contact_details,
      logoPath: row.logo_path,
      headerLines: row.header_lines_json ? JSON.parse(row.header_lines_json) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static save(org: any) {
    const db = getDatabase();
    const existing = this.get();
    const now = new Date().toISOString();
    const id = org.id || existing?.id || 'org-' + Date.now();

    if (existing) {
      db.prepare(`
        UPDATE organizations
        SET name = ?, acronym = ?, address = ?, contact_details = ?, logo_path = ?, header_lines_json = ?, updated_at = ?
        WHERE id = ?
      `).run(
        org.name,
        org.acronym || null,
        org.address || null,
        org.contactDetails || null,
        org.logoPath || null,
        JSON.stringify(org.headerLines || []),
        now,
        id
      );
    } else {
      db.prepare(`
        INSERT INTO organizations (id, name, acronym, address, contact_details, logo_path, header_lines_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        org.name,
        org.acronym || null,
        org.address || null,
        org.contactDetails || null,
        org.logoPath || null,
        JSON.stringify(org.headerLines || []),
        now,
        now
      );
    }
    return this.get();
  }
}
```

Create `desktop/database/repositories/meeting.repository.ts`:
```typescript
import { getDatabase } from '../connection';

export class MeetingRepository {
  static list(filter?: any) {
    const db = getDatabase();
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params: any[] = [];

    if (filter?.status && filter.status !== 'All') {
      query += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.searchQuery) {
      query += ' AND (title LIKE ? OR chairperson LIKE ?)';
      params.push(`%${filter.searchQuery}%`, `%${filter.searchQuery}%`);
    }

    query += ' ORDER BY meeting_date ASC';
    const rows = db.prepare(query).all(...params) as any[];

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      meetingType: r.meeting_type,
      meetingNumber: r.meeting_number,
      meetingDate: r.meeting_date,
      startTime: r.start_time,
      endTime: r.end_time,
      venue: r.venue,
      chairperson: r.chairperson,
      secretary: r.secretary,
      purpose: r.purpose,
      status: r.status,
      relatedMeetingId: r.related_meeting_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  static getById(id: string) {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      meetingType: r.meeting_type,
      meetingNumber: r.meeting_number,
      meetingDate: r.meeting_date,
      startTime: r.start_time,
      endTime: r.end_time,
      venue: r.venue,
      chairperson: r.chairperson,
      secretary: r.secretary,
      purpose: r.purpose,
      status: r.status,
      relatedMeetingId: r.related_meeting_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  static create(m: any) {
    const db = getDatabase();
    const id = 'meeting-' + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO meetings (id, title, meeting_type, meeting_number, meeting_date, start_time, end_time, venue, chairperson, secretary, purpose, status, related_meeting_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      m.title,
      m.meetingType,
      m.meetingNumber || null,
      m.meetingDate,
      m.startTime || null,
      m.endTime || null,
      m.venue || null,
      m.chairperson || null,
      m.secretary || null,
      m.purpose || null,
      m.status || 'Planned',
      m.relatedMeetingId || null,
      now,
      now
    );

    return this.getById(id);
  }

  static update(id: string, m: any) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) throw new Error(`Meeting with id ${id} not found`);

    const updated = { ...existing, ...m };
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE meetings
      SET title = ?, meeting_type = ?, meeting_number = ?, meeting_date = ?, start_time = ?, end_time = ?, venue = ?, chairperson = ?, secretary = ?, purpose = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.title,
      updated.meetingType,
      updated.meetingNumber || null,
      updated.meetingDate,
      updated.startTime || null,
      updated.endTime || null,
      updated.venue || null,
      updated.chairperson || null,
      updated.secretary || null,
      updated.purpose || null,
      updated.status,
      now,
      id
    );

    return this.getById(id);
  }

  static delete(id: string) {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
    return res.changes > 0;
  }
}
```

- [ ] **Step 3: Register IPC Handlers and Preload Bridge**

Create `desktop/ipc/handlers.ts`:
```typescript
import { ipcMain } from 'electron';
import { OrganizationRepository } from '../database/repositories/organization.repository';
import { MeetingRepository } from '../database/repositories/meeting.repository';
import { getDatabase } from '../database/connection';

export function registerIpcHandlers(): void {
  ipcMain.handle('localApi:getOrganization', () => OrganizationRepository.get());
  ipcMain.handle('localApi:saveOrganization', (_, org) => OrganizationRepository.save(org));
  ipcMain.handle('localApi:getMeetings', (_, filter) => MeetingRepository.list(filter));
  ipcMain.handle('localApi:getMeetingById', (_, id) => MeetingRepository.getById(id));
  ipcMain.handle('localApi:createMeeting', (_, meeting) => MeetingRepository.create(meeting));
  ipcMain.handle('localApi:updateMeeting', (_, id, meeting) => MeetingRepository.update(id, meeting));
  ipcMain.handle('localApi:deleteMeeting', (_, id) => MeetingRepository.delete(id));
  ipcMain.handle('localApi:getDatabaseStatus', () => {
    const db = getDatabase();
    const tables = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").get() as any;
    return {
      connected: true,
      type: 'electron-sqlite',
      tablesCount: tables?.count || 0,
    };
  });
}
```

Create `desktop/preload.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('localApi', {
  getOrganization: () => ipcRenderer.invoke('localApi:getOrganization'),
  saveOrganization: (org: any) => ipcRenderer.invoke('localApi:saveOrganization', org),
  getMeetings: (filter: any) => ipcRenderer.invoke('localApi:getMeetings', filter),
  getMeetingById: (id: string) => ipcRenderer.invoke('localApi:getMeetingById', id),
  createMeeting: (m: any) => ipcRenderer.invoke('localApi:createMeeting', m),
  updateMeeting: (id: string, m: any) => ipcRenderer.invoke('localApi:updateMeeting', id, m),
  deleteMeeting: (id: string) => ipcRenderer.invoke('localApi:deleteMeeting', id),
  getDatabaseStatus: () => ipcRenderer.invoke('localApi:getDatabaseStatus'),
});
```

Create `desktop/main.ts`:
```typescript
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'OrgSecretary Offline',
    backgroundColor: '#F5F7FA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  registerIpcHandlers();

  // In production load dist/OrgSecretary/browser/index.html, in dev load local dev server
  const distPath = path.join(__dirname, '../dist/OrgSecretary/browser/index.html');
  if (app.isPackaged || !process.env['ELECTRON_START_URL']) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(process.env['ELECTRON_START_URL']);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

Create `tsconfig.desktop.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "outDir": "./dist-desktop",
    "rootDir": "./desktop",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["desktop/**/*"]
}
```

- [ ] **Step 4: Verify desktop TypeScript builds**

Run: `npx tsc -p tsconfig.desktop.json`
Expected: 0 errors, output generated in `dist-desktop/`.

- [ ] **Step 5: Commit**

```bash
git add desktop tsconfig.desktop.json
git commit -m "feat(desktop): add electron main process, secure preload bridge, and sqlite repositories"
```

---

### Task 4: Shared UI Primitives (CardComponent, BadgeComponent, ModalComponent)

**Files:**
- Create: `src/app/shared/components/badge/badge.component.ts`
- Create: `src/app/shared/components/badge/badge.component.spec.ts`
- Create: `src/app/shared/components/card/card.component.ts`
- Create: `src/app/shared/components/card/card.component.spec.ts`
- Create: `src/app/shared/components/modal/modal.component.ts`
- Create: `src/app/shared/components/modal/modal.component.spec.ts`

**Interfaces:**
- Produces:
  - `BadgeComponent`: `status` input formatting color-coded badges for meeting statuses.
  - `CardComponent`: Styled container with title, subtitle, and action slots.
  - `ModalComponent`: Accessible dialog shell with backdrop and confirmation triggers.

- [ ] **Step 1: Write failing tests for BadgeComponent, CardComponent, ModalComponent (RED)**

Create `src/app/shared/components/badge/badge.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render status text', () => {
    fixture.componentRef.setInput('status', 'Approved');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Approved');
  });

  it('should compute emerald styling for Approved status', () => {
    fixture.componentRef.setInput('status', 'Approved');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('text-emerald-700');
  });
});
```

Create `src/app/shared/components/card/card.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render card with title', () => {
    fixture.componentRef.setInput('title', 'Upcoming Meetings');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Upcoming Meetings');
  });
});
```

Create `src/app/shared/components/modal/modal.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit close event on dismiss', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    component.onClose();
    expect(closed).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (RED)**

Run: `npm test`
Expected: FAIL (components missing).

- [ ] **Step 3: Implement BadgeComponent, CardComponent, and ModalComponent (GREEN)**

Create `src/app/shared/components/badge/badge.component.ts`:
```typescript
import { Component, computed, input } from '@angular/core';
import { MeetingStatus } from '@core/models/meeting.model';

@Component({
  selector: 'app-badge',
  template: `
    <span [class]="badgeClasses()">
      {{ status() }}
    </span>
  `,
})
export class BadgeComponent {
  status = input<MeetingStatus | string>('Planned');

  badgeClasses = computed(() => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border';
    switch (this.status()) {
      case 'Approved':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'In Preparation':
        return `${base} bg-amber-50 text-amber-700 border-amber-200`;
      case 'In Progress':
        return `${base} bg-blue-50 text-blue-700 border-blue-200`;
      case 'For Review':
        return `${base} bg-purple-50 text-purple-700 border-purple-200`;
      case 'Archived':
        return `${base} bg-slate-100 text-slate-600 border-slate-200`;
      case 'Planned':
      default:
        return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
    }
  });
}
```

Create `src/app/shared/components/card/card.component.ts`:
```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      @if (title()) {
        <div class="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">{{ title() }}</h3>
            @if (subtitle()) {
              <p class="text-xs text-slate-500 mt-0.5">{{ subtitle() }}</p>
            }
          </div>
          <ng-content select="[card-actions]" />
        </div>
      }
      <div class="p-6">
        <ng-content />
      </div>
    </div>
  `,
})
export class CardComponent {
  title = input<string>();
  subtitle = input<string>();
}
```

Create `src/app/shared/components/modal/modal.component.ts`:
```typescript
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden transform transition-all">
          <div class="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-800">{{ title() }}</h3>
            <button (click)="onClose()" class="text-slate-400 hover:text-slate-600 focus:outline-none">
              ✕
            </button>
          </div>
          <div class="p-6">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Dialog');
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass (GREEN)**

Run: `npm test`
Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/components
git commit -m "feat(shared): add BadgeComponent, CardComponent, and ModalComponent"
```

---

### Task 5: Organization Profile Feature

**Files:**
- Create: `src/app/features/organization/organization.component.ts`
- Create: `src/app/features/organization/organization.component.html`
- Create: `src/app/features/organization/organization.component.spec.ts`
- Create: `src/app/features/organization/organization.routes.ts`
- Modify: `src/app/layouts/main-layout/main-layout.component.html`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `OrganizationService`, `ButtonComponent`, `CardComponent`
- Produces: `/organization` route and reactive organization management form.

- [ ] **Step 1: Write failing unit test for OrganizationComponent (RED)**

Create `src/app/features/organization/organization.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationComponent } from './organization.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('OrganizationComponent', () => {
  let component: OrganizationComponent;
  let fixture: ComponentFixture<OrganizationComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OrganizationComponent],
      providers: [{ provide: LOCAL_API, useClass: WebLocalApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create organization component', () => {
    expect(component).toBeTruthy();
  });

  it('should update organization name signal on form submit', async () => {
    component.orgName.set('Metro Civic League');
    await component.onSubmit();
    expect(component.isSaved()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails (RED)**

Run: `npm test`
Expected: FAIL (OrganizationComponent missing).

- [ ] **Step 3: Implement OrganizationComponent and routing (GREEN)**

Create `src/app/features/organization/organization.component.html`:
```html
<div class="max-w-4xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-slate-900">Organization Profile</h1>
    <p class="mt-1 text-sm text-slate-500">Configure your organization's identity, branding, and document letterhead headers.</p>
  </div>

  @if (isSaved()) {
    <div class="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-800">
      ✓ Organization details successfully saved!
    </div>
  }

  <app-card title="General Information" subtitle="Used across meeting notices, minutes, and attendance sheets">
    <form (submit)="onSubmit(); $event.preventDefault()" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Organization Name *</label>
        <input
          type="text"
          [value]="orgName()"
          (input)="orgName.set($any($event.target).value)"
          placeholder="e.g. Sangguniang Barangay Council"
          required
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Acronym / Short Name</label>
          <input
            type="text"
            [value]="orgAcronym()"
            (input)="orgAcronym.set($any($event.target).value)"
            placeholder="e.g. SBC"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Contact Details</label>
          <input
            type="text"
            [value]="orgContact()"
            (input)="orgContact.set($any($event.target).value)"
            placeholder="e.g. secretary@barangay.gov.ph"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Office Address</label>
        <textarea
          [value]="orgAddress()"
          (input)="orgAddress.set($any($event.target).value)"
          rows="2"
          placeholder="e.g. Barangay Hall, Barangay Central, Quezon City"
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        ></textarea>
      </div>

      <div class="pt-4 flex justify-end">
        <app-button type="submit" variant="primary" [disabled]="!orgName().trim()">
          Save Organization Profile
        </app-button>
      </div>
    </form>
  </app-card>
</div>
```

Create `src/app/features/organization/organization.component.ts`:
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '@core/services/organization.service';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-organization',
  imports: [CommonModule, CardComponent, ButtonComponent],
  templateUrl: './organization.component.html',
})
export class OrganizationComponent implements OnInit {
  private orgService = inject(OrganizationService);

  orgName = signal('');
  orgAcronym = signal('');
  orgContact = signal('');
  orgAddress = signal('');
  isSaved = signal(false);

  async ngOnInit(): Promise<void> {
    const org = await this.orgService.loadOrganization();
    if (org) {
      this.orgName.set(org.name || '');
      this.orgAcronym.set(org.acronym || '');
      this.orgContact.set(org.contactDetails || '');
      this.orgAddress.set(org.address || '');
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.orgName().trim()) return;
    await this.orgService.saveOrganization({
      name: this.orgName().trim(),
      acronym: this.orgAcronym().trim(),
      contactDetails: this.orgContact().trim(),
      address: this.orgAddress().trim(),
    });
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 3000);
  }
}
```

Create `src/app/features/organization/organization.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./organization.component').then(m => m.OrganizationComponent),
  },
];
```

Register route in `src/app/app.routes.ts`:
```typescript
{
  path: 'organization',
  loadChildren: () => import('@features/organization/organization.routes').then(m => m.ORGANIZATION_ROUTES),
}
```
And add navigation link to `src/app/layouts/main-layout/main-layout.component.html`.

- [ ] **Step 4: Run tests to verify they pass (GREEN)**

Run: `npm test`
Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/organization src/app/app.routes.ts src/app/layouts/main-layout
git commit -m "feat(organization): add organization profile management and navigation"
```

---

### Task 6: Meeting Management CRUD Feature

**Files:**
- Create: `src/app/features/meetings/meeting-list/meeting-list.component.ts`
- Create: `src/app/features/meetings/meeting-list/meeting-list.component.html`
- Create: `src/app/features/meetings/meeting-list/meeting-list.component.spec.ts`
- Create: `src/app/features/meetings/meeting-form/meeting-form.component.ts`
- Create: `src/app/features/meetings/meeting-form/meeting-form.component.html`
- Create: `src/app/features/meetings/meeting-form/meeting-form.component.spec.ts`
- Create: `src/app/features/meetings/meeting-detail/meeting-detail.component.ts`
- Create: `src/app/features/meetings/meeting-detail/meeting-detail.component.html`
- Create: `src/app/features/meetings/meeting-detail/meeting-detail.component.spec.ts`
- Create: `src/app/features/meetings/meetings.routes.ts`
- Modify: `src/app/layouts/main-layout/main-layout.component.html`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `MeetingService`, `BadgeComponent`, `ButtonComponent`, `CardComponent`, `ModalComponent`
- Produces: `/meetings`, `/meetings/new`, `/meetings/:id`, `/meetings/:id/edit` routes with complete CRUD workflow.

- [ ] **Step 1: Write failing tests for MeetingListComponent, MeetingFormComponent, MeetingDetailComponent (RED)**

Create `src/app/features/meetings/meeting-list/meeting-list.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeetingListComponent } from './meeting-list.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('MeetingListComponent', () => {
  let component: MeetingListComponent;
  let fixture: ComponentFixture<MeetingListComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MeetingListComponent],
      providers: [
        provideRouter([]),
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render meeting list title', () => {
    expect(fixture.nativeElement.textContent).toContain('Meetings & Events');
  });
});
```

Create `src/app/features/meetings/meeting-form/meeting-form.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeetingFormComponent } from './meeting-form.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('MeetingFormComponent', () => {
  let component: MeetingFormComponent;
  let fixture: ComponentFixture<MeetingFormComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MeetingFormComponent],
      providers: [
        provideRouter([]),
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create meeting form component', () => {
    expect(component).toBeTruthy();
  });
});
```

Create `src/app/features/meetings/meeting-detail/meeting-detail.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeetingDetailComponent } from './meeting-detail.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('MeetingDetailComponent', () => {
  let component: MeetingDetailComponent;
  let fixture: ComponentFixture<MeetingDetailComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MeetingDetailComponent],
      providers: [
        provideRouter([]),
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create meeting detail component', () => {
    expect(component).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (RED)**

Run: `npm test`
Expected: FAIL (components missing).

- [ ] **Step 3: Implement Meeting List, Form, Detail components and routes (GREEN)**

Create `src/app/features/meetings/meeting-list/meeting-list.component.html`:
```html
<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Meetings & Events</h1>
      <p class="mt-1 text-sm text-slate-500">Prepare, run, and document organization sessions.</p>
    </div>
    <a routerLink="/meetings/new">
      <app-button variant="primary">
        + Schedule Meeting
      </app-button>
    </a>
  </div>

  <!-- Filters & Search -->
  <div class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
    <div class="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
      @for (st of statusFilters; track st) {
        <button
          (click)="filterStatus.set(st)"
          [class]="filterStatus() === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
        >
          {{ st }}
        </button>
      }
    </div>
    <div class="w-full sm:w-64">
      <input
        type="text"
        [value]="searchQuery()"
        (input)="searchQuery.set($any($event.target).value)"
        placeholder="Search title, chair..."
        class="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  </div>

  <!-- Meetings List -->
  @if (filteredMeetings().length === 0) {
    <div class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p class="text-sm font-semibold text-slate-700">No meetings found</p>
      <p class="text-xs text-slate-500 mt-1">Get started by creating your first meeting session.</p>
      <div class="mt-4">
        <a routerLink="/meetings/new">
          <app-button variant="primary" size="sm">+ New Meeting</app-button>
        </a>
      </div>
    </div>
  } @else {
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      @for (m of filteredMeetings(); track m.id) {
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {{ m.meetingType }}
              </span>
              <app-badge [status]="m.status" />
            </div>
            <h3 class="font-bold text-lg text-slate-800 line-clamp-1">{{ m.title }}</h3>
            <p class="text-xs text-slate-500 mt-1 flex items-center">
              📅 {{ m.meetingDate }} @if (m.startTime) { • {{ m.startTime }} }
            </p>
            @if (m.venue) {
              <p class="text-xs text-slate-500 mt-1 flex items-center">
                📍 {{ m.venue }}
              </p>
            }
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <a [routerLink]="['/meetings', m.id]" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Open Workspace →
            </a>
            <a [routerLink]="['/meetings', m.id, 'edit']" class="text-xs text-slate-400 hover:text-slate-600">
              Edit
            </a>
          </div>
        </div>
      }
    </div>
  }
</div>
```

Create `src/app/features/meetings/meeting-list/meeting-list.component.ts`:
```typescript
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MeetingService } from '@core/services/meeting.service';
import { MeetingStatus } from '@core/models/meeting.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';

@Component({
  selector: 'app-meeting-list',
  imports: [CommonModule, RouterLink, ButtonComponent, BadgeComponent],
  templateUrl: './meeting-list.component.html',
})
export class MeetingListComponent implements OnInit {
  private meetingService = inject(MeetingService);

  statusFilters: (MeetingStatus | 'All')[] = [
    'All',
    'Planned',
    'In Preparation',
    'In Progress',
    'For Review',
    'Approved',
    'Archived',
  ];

  filterStatus = signal<MeetingStatus | 'All'>('All');
  searchQuery = signal<string>('');

  filteredMeetings = computed(() => {
    let list = this.meetingService.meetings();
    const st = this.filterStatus();
    if (st !== 'All') {
      list = list.filter(m => m.status === st);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        m =>
          m.title.toLowerCase().includes(q) ||
          (m.chairperson && m.chairperson.toLowerCase().includes(q)),
      );
    }
    return list;
  });

  async ngOnInit(): Promise<void> {
    await this.meetingService.loadMeetings();
  }
}
```

Create `src/app/features/meetings/meeting-form/meeting-form.component.html`:
```html
<div class="max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-slate-900">
      {{ isEditMode() ? 'Edit Meeting' : 'Schedule New Meeting' }}
    </h1>
    <p class="mt-1 text-sm text-slate-500">Provide meeting details to initialize the preparation and event workspace.</p>
  </div>

  <app-card title="Meeting Information">
    <form (submit)="onSave(); $event.preventDefault()" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Meeting Title *</label>
        <input
          type="text"
          [value]="title()"
          (input)="title.set($any($event.target).value)"
          placeholder="e.g. Regular Monthly Board Session"
          required
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Meeting Type</label>
          <select
            [value]="meetingType()"
            (change)="meetingType.set($any($event.target).value)"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="Regular">Regular</option>
            <option value="Special">Special</option>
            <option value="Committee">Committee</option>
            <option value="Board">Board</option>
            <option value="General Assembly">General Assembly</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Date *</label>
          <input
            type="date"
            [value]="meetingDate()"
            (input)="meetingDate.set($any($event.target).value)"
            required
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Start Time</label>
          <input
            type="time"
            [value]="startTime()"
            (input)="startTime.set($any($event.target).value)"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Venue / Room</label>
          <input
            type="text"
            [value]="venue()"
            (input)="venue.set($any($event.target).value)"
            placeholder="e.g. Conference Room A"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Presiding Officer / Chairperson</label>
          <input
            type="text"
            [value]="chairperson()"
            (input)="chairperson.set($any($event.target).value)"
            placeholder="e.g. Hon. Maria Santos"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Secretary</label>
          <input
            type="text"
            [value]="secretary()"
            (input)="secretary.set($any($event.target).value)"
            placeholder="e.g. John Doe"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Meeting Purpose / Notes</label>
        <textarea
          [value]="purpose()"
          (input)="purpose.set($any($event.target).value)"
          rows="3"
          placeholder="Summary of agenda goals or purpose of session"
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        ></textarea>
      </div>

      <div class="pt-4 flex items-center justify-between border-t border-slate-100">
        <a routerLink="/meetings">
          <app-button variant="outline" type="button">Cancel</app-button>
        </a>
        <app-button type="submit" variant="primary" [disabled]="!title().trim() || !meetingDate()">
          {{ isEditMode() ? 'Save Changes' : 'Create Meeting' }}
        </app-button>
      </div>
    </form>
  </app-card>
</div>
```

Create `src/app/features/meetings/meeting-form/meeting-form.component.ts`:
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MeetingService } from '@core/services/meeting.service';
import { MeetingType } from '@core/models/meeting.model';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-meeting-form',
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  templateUrl: './meeting-form.component.html',
})
export class MeetingFormComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = signal(false);
  meetingId = signal<string | null>(null);

  title = signal('');
  meetingType = signal<MeetingType>('Regular');
  meetingDate = signal(new Date().toISOString().substring(0, 10));
  startTime = signal('09:00');
  venue = signal('');
  chairperson = signal('');
  secretary = signal('');
  purpose = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.meetingId.set(id);
      const meeting = await this.meetingService.getMeetingById(id);
      if (meeting) {
        this.title.set(meeting.title);
        this.meetingType.set(meeting.meetingType);
        this.meetingDate.set(meeting.meetingDate);
        this.startTime.set(meeting.startTime || '');
        this.venue.set(meeting.venue || '');
        this.chairperson.set(meeting.chairperson || '');
        this.secretary.set(meeting.secretary || '');
        this.purpose.set(meeting.purpose || '');
      }
    }
  }

  async onSave(): Promise<void> {
    if (!this.title().trim() || !this.meetingDate()) return;

    if (this.isEditMode() && this.meetingId()) {
      await this.meetingService.updateMeeting(this.meetingId()!, {
        title: this.title().trim(),
        meetingType: this.meetingType(),
        meetingDate: this.meetingDate(),
        startTime: this.startTime().trim() || undefined,
        venue: this.venue().trim() || undefined,
        chairperson: this.chairperson().trim() || undefined,
        secretary: this.secretary().trim() || undefined,
        purpose: this.purpose().trim() || undefined,
      });
      this.router.navigate(['/meetings', this.meetingId()]);
    } else {
      const created = await this.meetingService.createMeeting({
        title: this.title().trim(),
        meetingType: this.meetingType(),
        meetingDate: this.meetingDate(),
        startTime: this.startTime().trim() || undefined,
        venue: this.venue().trim() || undefined,
        chairperson: this.chairperson().trim() || undefined,
        secretary: this.secretary().trim() || undefined,
        purpose: this.purpose().trim() || undefined,
        status: 'Planned',
      });
      this.router.navigate(['/meetings', created.id]);
    }
  }
}
```

Create `src/app/features/meetings/meeting-detail/meeting-detail.component.html`:
```html
@if (meeting(); as m) {
  <div class="space-y-6">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-3">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ m.title }}</h1>
          <app-badge [status]="m.status" />
        </div>
        <p class="mt-1 text-sm text-slate-500">
          {{ m.meetingType }} Meeting • 📅 {{ m.meetingDate }} @if (m.startTime) { • 🕒 {{ m.startTime }} }
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <a [routerLink]="['/meetings', m.id, 'edit']">
          <app-button variant="outline" size="sm">Edit Details</app-button>
        </a>
        <app-button variant="primary" size="sm" (click)="statusModalOpen.set(true)">
          Update Status
        </app-button>
      </div>
    </div>

    <!-- Quick Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Presiding Officer</div>
        <div class="mt-1 text-base font-bold text-slate-800">{{ m.chairperson || 'Unspecified' }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Secretary</div>
        <div class="mt-1 text-base font-bold text-slate-800">{{ m.secretary || 'Unspecified' }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Venue</div>
        <div class="mt-1 text-base font-bold text-slate-800">{{ m.venue || 'Not specified' }}</div>
      </div>
    </div>

    <!-- Future Module Links (Phase 2 & 3 Roadmaps) -->
    <app-card title="Meeting Modules Workspace">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div class="font-bold text-sm text-slate-800">1. Checklist</div>
          <p class="text-xs text-slate-500 mt-1">Preparation tasks & venue readiness</p>
          <span class="inline-block mt-3 text-xs font-semibold text-slate-400">Phase 2 Module</span>
        </div>

        <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div class="font-bold text-sm text-slate-800">2. Agenda Builder</div>
          <p class="text-xs text-slate-500 mt-1">Topics, presenters & allocated time</p>
          <span class="inline-block mt-3 text-xs font-semibold text-slate-400">Phase 2 Module</span>
        </div>

        <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div class="font-bold text-sm text-slate-800">3. Attendance</div>
          <p class="text-xs text-slate-500 mt-1">Roll call & quorum calculator</p>
          <span class="inline-block mt-3 text-xs font-semibold text-slate-400">Phase 2 Module</span>
        </div>

        <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div class="font-bold text-sm text-slate-800">4. Live Minutes</div>
          <p class="text-xs text-slate-500 mt-1">Motions, decisions & action items</p>
          <span class="inline-block mt-3 text-xs font-semibold text-slate-400">Phase 3 Module</span>
        </div>
      </div>
    </app-card>

    <!-- Status Change Modal -->
    <app-modal [isOpen]="statusModalOpen()" title="Change Meeting Status" (close)="statusModalOpen.set(false)">
      <div class="space-y-4">
        <p class="text-sm text-slate-600">Select the new lifecycle status for this meeting session:</p>
        <div class="grid grid-cols-2 gap-2">
          @for (st of allStatuses; track st) {
            <button
              (click)="changeStatus(st)"
              class="px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
            >
              {{ st }}
            </button>
          }
        </div>
      </div>
    </app-modal>
  </div>
}
```

Create `src/app/features/meetings/meeting-detail/meeting-detail.component.ts`:
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MeetingService } from '@core/services/meeting.service';
import { Meeting, MeetingStatus } from '@core/models/meeting.model';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-meeting-detail',
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent, BadgeComponent, ModalComponent],
  templateUrl: './meeting-detail.component.html',
})
export class MeetingDetailComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private route = inject(ActivatedRoute);

  meeting = signal<Meeting | null>(null);
  statusModalOpen = signal(false);

  allStatuses: MeetingStatus[] = [
    'Planned',
    'In Preparation',
    'In Progress',
    'For Review',
    'Approved',
    'Archived',
  ];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const m = await this.meetingService.getMeetingById(id);
      this.meeting.set(m);
    }
  }

  async changeStatus(newStatus: MeetingStatus): Promise<void> {
    if (!this.meeting()) return;
    const updated = await this.meetingService.updateMeetingStatus(this.meeting()!.id, newStatus);
    this.meeting.set(updated);
    this.statusModalOpen.set(false);
  }
}
```

Create `src/app/features/meetings/meetings.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const MEETINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./meeting-list/meeting-list.component').then(m => m.MeetingListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./meeting-form/meeting-form.component').then(m => m.MeetingFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./meeting-detail/meeting-detail.component').then(m => m.MeetingDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./meeting-form/meeting-form.component').then(m => m.MeetingFormComponent),
  },
];
```

Register route in `src/app/app.routes.ts`:
```typescript
{
  path: 'meetings',
  loadChildren: () => import('@features/meetings/meetings.routes').then(m => m.MEETINGS_ROUTES),
}
```
And add navigation link in `src/app/layouts/main-layout/main-layout.component.html`.

- [ ] **Step 4: Run tests to verify they pass (GREEN)**

Run: `npm test`
Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/meetings src/app/app.routes.ts src/app/layouts/main-layout
git commit -m "feat(meetings): add full meetings CRUD workflow with list, form, and detail views"
```

---

### Task 7: Dynamic Dashboard Integration

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.ts`
- Modify: `src/app/features/dashboard/dashboard.component.html`
- Modify: `src/app/features/dashboard/dashboard.component.spec.ts`

**Interfaces:**
- Consumes: `OrganizationService`, `MeetingService`, `CardComponent`, `BadgeComponent`, `ButtonComponent`
- Produces: Dynamic Dashboard displaying next meeting alert, organization onboarding alert, metrics counters, and recent meetings.

- [ ] **Step 1: Write failing tests for Dynamic Dashboard (RED)**

Update `src/app/features/dashboard/dashboard.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should show organization setup prompt if organization is not configured', () => {
    expect(fixture.nativeElement.textContent).toContain('Set Up Organization');
  });
});
```

- [ ] **Step 2: Run test to verify it fails (RED)**

Run: `npm test`
Expected: FAIL (missing new dashboard elements).

- [ ] **Step 3: Implement Dynamic Dashboard (GREEN)**

Update `src/app/features/dashboard/dashboard.component.html`:
```html
<div class="space-y-6">
  <!-- Organization First-Run Banner -->
  @if (!isOrgConfigured()) {
    <div class="rounded-xl border border-amber-300 bg-amber-50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-base font-bold text-amber-900">Welcome to OrgSecretary Offline</h3>
        <p class="text-xs text-amber-700 mt-1">Your organization profile is not configured yet. Set up your organization name and letterhead branding.</p>
      </div>
      <a routerLink="/organization">
        <app-button variant="primary" size="sm">Set Up Organization</app-button>
      </a>
    </div>
  }

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">
        {{ orgName() ? orgName() + ' Overview' : 'Dashboard' }}
      </h1>
      <p class="mt-1 text-sm text-slate-500">Meeting schedule, preparation progress, and secretarial workspace.</p>
    </div>
    <div class="flex items-center space-x-3">
      <a routerLink="/meetings/new">
        <app-button variant="primary">+ Schedule Meeting</app-button>
      </a>
    </div>
  </div>

  <!-- Next Scheduled Event Card -->
  @if (nextMeeting(); as next) {
    <div class="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-6 shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold uppercase tracking-wider text-indigo-700">Next Scheduled Meeting</span>
        <app-badge [status]="next.status" />
      </div>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{ next.title }}</h2>
          <p class="text-sm text-slate-600 mt-1">
            📅 {{ next.meetingDate }} @if (next.startTime) { • 🕒 {{ next.startTime }} } @if (next.venue) { • 📍 {{ next.venue }} }
          </p>
        </div>
        <a [routerLink]="['/meetings', next.id]">
          <app-button variant="primary" size="sm">Open Workspace →</app-button>
        </a>
      </div>
    </div>
  }

  <!-- Metrics Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Meetings</div>
      <div class="mt-2 text-2xl font-bold text-slate-800">{{ totalMeetings() }}</div>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="text-xs font-semibold uppercase tracking-wider text-indigo-600">Upcoming</div>
      <div class="mt-2 text-2xl font-bold text-indigo-600">{{ upcomingCount() }}</div>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="text-xs font-semibold uppercase tracking-wider text-amber-600">In Preparation</div>
      <div class="mt-2 text-2xl font-bold text-amber-600">{{ prepCount() }}</div>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="text-xs font-semibold uppercase tracking-wider text-emerald-600">Approved Sessions</div>
      <div class="mt-2 text-2xl font-bold text-emerald-600">{{ approvedCount() }}</div>
    </div>
  </div>

  <!-- Recent Meetings -->
  <app-card title="Recent & Upcoming Meetings" subtitle="Direct access to meeting workspaces">
    @if (recentMeetings().length === 0) {
      <div class="text-center py-8">
        <p class="text-sm text-slate-500">No meetings recorded yet.</p>
        <div class="mt-3">
          <a routerLink="/meetings/new">
            <app-button variant="outline" size="sm">+ Schedule First Meeting</app-button>
          </a>
        </div>
      </div>
    } @else {
      <div class="divide-y divide-slate-100">
        @for (m of recentMeetings(); track m.id) {
          <div class="py-3 flex items-center justify-between">
            <div>
              <a [routerLink]="['/meetings', m.id]" class="font-semibold text-sm text-slate-800 hover:text-indigo-600">
                {{ m.title }}
              </a>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ m.meetingType }} • {{ m.meetingDate }}
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <app-badge [status]="m.status" />
              <a [routerLink]="['/meetings', m.id]" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                View →
              </a>
            </div>
          </div>
        }
      </div>
    }
  </app-card>
</div>
```

Update `src/app/features/dashboard/dashboard.component.ts`:
```typescript
import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MeetingService } from '@core/services/meeting.service';
import { OrganizationService } from '@core/services/organization.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ButtonComponent, BadgeComponent, CardComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private orgService = inject(OrganizationService);

  isOrgConfigured = this.orgService.isConfigured;
  orgName = computed(() => this.orgService.organization()?.name || '');
  nextMeeting = this.meetingService.nextMeeting;

  totalMeetings = computed(() => this.meetingService.meetings().length);
  upcomingCount = computed(() => this.meetingService.upcomingMeetings().length);
  prepCount = computed(() => this.meetingService.meetings().filter(m => m.status === 'In Preparation').length);
  approvedCount = computed(() => this.meetingService.meetings().filter(m => m.status === 'Approved').length);
  recentMeetings = computed(() => this.meetingService.meetings().slice(0, 5));

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.orgService.loadOrganization(),
      this.meetingService.loadMeetings(),
    ]);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass (GREEN)**

Run: `npm test`
Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/dashboard
git commit -m "feat(dashboard): integrate dynamic metrics, next event alert, and onboarding prompt"
```

---

### Task 8: Full Verification & Formatting

**Files:**
- Repository-wide

**Interfaces:**
- Produces: 100% formatted codebase, passing unit test suites, and clean Angular & Desktop builds.

- [ ] **Step 1: Run Prettier formatting**

Run: `npm run format`
Expected: Prettier formats all files.

- [ ] **Step 2: Run all unit tests**

Run: `npm test`
Expected: All test suites PASS.

- [ ] **Step 3: Run Angular production build**

Run: `npm run build`
Expected: Zero build warnings or errors.

- [ ] **Step 4: Run Desktop TypeScript build**

Run: `npx tsc -p tsconfig.desktop.json`
Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: format project and verify production and desktop builds"
```
