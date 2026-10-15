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

  async createMeeting(
    meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Meeting> {
    this.isLoading.set(true);
    try {
      const created = await this.localApi.createMeeting(meeting);
      await this.loadMeetings();
      return created;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateMeeting(
    id: string,
    updates: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Meeting> {
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

  async updateMeetingStatus(
    id: string,
    status: MeetingStatus,
  ): Promise<Meeting> {
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
