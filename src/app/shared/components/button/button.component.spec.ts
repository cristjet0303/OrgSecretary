import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute primary variant classes by default', () => {
    expect(component.buttonClasses()).toContain('bg-indigo-600');
  });

  it('should compute outline variant classes when set', () => {
    fixture.componentRef.setInput('variant', 'outline');
    fixture.detectChanges();
    expect(component.buttonClasses()).toContain('border-slate-300');
  });
});
