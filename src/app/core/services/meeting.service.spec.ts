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
});
