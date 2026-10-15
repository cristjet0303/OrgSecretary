import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render status text', () => {
    fixture.componentRef.setInput('status', 'Approved');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Approved');
  });

  it('should compute emerald styling for Approved status', () => {
    fixture.componentRef.setInput('status', 'Approved');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('text-emerald-700');
  });
});
