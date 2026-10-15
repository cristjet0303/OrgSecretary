import { Component, computed, input } from '@angular/core';
import { MeetingStatus } from '@core/models/meeting.model';

@Component({
  selector: 'app-badge',
  template: `
    <span [class]="badgeClasses()">
      {{ status() }}
    </span>
  `,
})
export class BadgeComponent {
  status = input<MeetingStatus | string>('Planned');

  badgeClasses = computed(() => {
    const base =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border';
    switch (this.status()) {
      case 'Approved':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'In Preparation':
        return `${base} bg-amber-50 text-amber-700 border-amber-200`;
      case 'In Progress':
        return `${base} bg-blue-50 text-blue-700 border-blue-200`;
      case 'For Review':
        return `${base} bg-purple-50 text-purple-700 border-purple-200`;
      case 'Archived':
        return `${base} bg-slate-100 text-slate-600 border-slate-200`;
      case 'Planned':
      default:
        return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
    }
  });
}
