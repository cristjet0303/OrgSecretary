import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MeetingService } from '@core/services/meeting.service';
import { OrganizationService } from '@core/services/organization.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CardComponent } from '@shared/components/card/card.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ButtonComponent, BadgeComponent, CardComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private orgService = inject(OrganizationService);

  isOrgConfigured = this.orgService.isConfigured;
  orgName = computed(() => this.orgService.organization()?.name || '');
  nextMeeting = this.meetingService.nextMeeting;

  totalMeetings = computed(() => this.meetingService.meetings().length);
  upcomingCount = computed(() => this.meetingService.upcomingMeetings().length);
  prepCount = computed(
    () => this.meetingService.meetings().filter((m) => m.status === 'In Preparation').length,
  );
  approvedCount = computed(
    () => this.meetingService.meetings().filter((m) => m.status === 'Approved').length,
  );
  recentMeetings = computed(() => this.meetingService.meetings().slice(0, 5));

  async ngOnInit(): Promise<void> {
    await Promise.all([this.orgService.loadOrganization(), this.meetingService.loadMeetings()]);
  }
}
