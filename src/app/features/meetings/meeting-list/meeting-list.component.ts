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
      list = list.filter((m) => m.status === st);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (m) =>
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
