import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeetingFormComponent } from './meeting-form.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('MeetingFormComponent', () => {
  let component: MeetingFormComponent;
  let fixture: ComponentFixture<MeetingFormComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MeetingFormComponent],
      providers: [provideRouter([]), { provide: LOCAL_API, useClass: WebLocalApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create meeting form component', () => {
    expect(component).toBeTruthy();
  });
});
