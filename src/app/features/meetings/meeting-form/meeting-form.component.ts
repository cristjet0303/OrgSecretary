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
