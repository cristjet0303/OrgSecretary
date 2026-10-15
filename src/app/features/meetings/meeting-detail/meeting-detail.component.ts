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
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    ModalComponent,
  ],
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
