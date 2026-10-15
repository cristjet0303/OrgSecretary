import { Organization } from '../models/organization.model';
import { Meeting, MeetingFilter } from '../models/meeting.model';
import { DatabaseStatus } from '../models/database.model';

export interface LocalApi {
  getOrganization(): Promise<Organization | null>;
  saveOrganization(
    org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Organization>;
  getMeetings(filter?: MeetingFilter): Promise<Meeting[]>;
  getMeetingById(id: string): Promise<Meeting | null>;
  createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting>;
  updateMeeting(
    id: string,
    meeting: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Meeting>;
  deleteMeeting(id: string): Promise<boolean>;
  getDatabaseStatus(): Promise<DatabaseStatus>;
}
