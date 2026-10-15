import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit close event on dismiss', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    component.onClose();
    expect(closed).toBe(true);
  });
});
