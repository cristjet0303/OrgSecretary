export type MeetingStatus =
  'Planned' | 'In Preparation' | 'In Progress' | 'For Review' | 'Approved' | 'Archived';

export type MeetingType = 'Regular' | 'Special' | 'Committee' | 'Board' | 'General Assembly';

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
