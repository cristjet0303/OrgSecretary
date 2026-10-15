import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
      >
        <div
          class="w-full max-w-lg transform overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all"
        >
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 class="text-lg font-bold text-slate-800">{{ title() }}</h3>
            <button
              (click)="onClose()"
              class="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              ✕
            </button>
          </div>
          <div class="p-6">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Dialog');
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }
}
