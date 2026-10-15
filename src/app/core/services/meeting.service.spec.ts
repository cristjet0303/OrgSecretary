import { TestBed } from '@angular/core/testing';
import { MeetingService } from './meeting.service';
import { LOCAL_API } from '../local-api/local-api.token';
import { WebLocalApi } from '../local-api/web-local-api.service';

describe('MeetingService', () => {
  let service: MeetingService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [MeetingService, { provide: LOCAL_API, useClass: WebLocalApi }],
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
    await service.createMeeting({
      title: 'M1',
      meetingType: 'Regular',
      meetingDate: '2026-11-01',
      status: 'Planned',
    });
    await service.createMeeting({
      title: 'M2',
      meetingType: 'Special',
      meetingDate: '2026-11-02',
      status: 'Approved',
    });

    await service.loadMeetings({ status: 'Planned' });
    expect(service.meetings().length).toBe(1);
    expect(service.meetings()[0].title).toBe('M1');
  });

  it('should compute upcomingMeetings filtering out past dates', async () => {
    const today = new Date().toISOString().substring(0, 10);
    await service.createMeeting({
      title: 'Past Meeting',
      meetingType: 'Regular',
      meetingDate: '2020-01-01',
      status: 'Planned',
    });
    await service.createMeeting({
      title: 'Future Meeting 2',
      meetingType: 'Regular',
      meetingDate: '2099-12-01',
      status: 'Planned',
    });
    await service.createMeeting({
      title: 'Future Meeting 1',
      meetingType: 'Regular',
      meetingDate: '2099-06-01',
      status: 'In Preparation',
    });

    const upcoming = service.upcomingMeetings();
    expect(upcoming.length).toBe(2);
    expect(upcoming[0].title).toBe('Future Meeting 1');
    expect(upcoming[1].title).toBe('Future Meeting 2');
    expect(service.nextMeeting()?.title).toBe('Future Meeting 1');
  });
});
