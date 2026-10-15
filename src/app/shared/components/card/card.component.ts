import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div
      class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      @if (title()) {
        <div
          class="flex items-center justify-between border-b border-slate-100 px-6 py-4"
        >
          <div>
            <h3 class="text-base font-bold text-slate-800">{{ title() }}</h3>
            @if (subtitle()) {
              <p class="mt-0.5 text-xs text-slate-500">{{ subtitle() }}</p>
            }
          </div>
          <ng-content select="[card-actions]" />
        </div>
      }
      <div class="p-6">
        <ng-content />
      </div>
    </div>
  `,
})
export class CardComponent {
  title = input<string>();
  subtitle = input<string>();
}
