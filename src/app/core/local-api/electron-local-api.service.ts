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
  saveOrganization(
    org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Organization> {
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
  updateMeeting(
    id: string,
    meeting: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Meeting> {
    return this.api.updateMeeting(id, meeting);
  }
  deleteMeeting(id: string): Promise<boolean> {
    return this.api.deleteMeeting(id);
  }
  getDatabaseStatus(): Promise<DatabaseStatus> {
    return this.api.getDatabaseStatus();
  }
}
