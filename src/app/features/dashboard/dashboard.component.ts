import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  counter = signal<number>(0);

  increment(): void {
    this.counter.update(c => c + 1);
  }
}
