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

  async saveOrganization(
    org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Organization> {
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
      list = list.filter(
        m =>
          m.title.toLowerCase().includes(q) ||
          (m.chairperson && m.chairperson.toLowerCase().includes(q)),
      );
    }
    return list;
  }

  async getMeetingById(id: string): Promise<Meeting | null> {
    const list = await this.getMeetings();
    return list.find(m => m.id === id) || null;
  }

  async createMeeting(
    meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Meeting> {
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

  async updateMeeting(
    id: string,
    updates: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Meeting> {
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
    return {
      connected: true,
      type: 'web-storage',
      tablesCount: 2,
    };
  }
}
