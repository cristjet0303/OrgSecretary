import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeetingDetailComponent } from './meeting-detail.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('MeetingDetailComponent', () => {
  let component: MeetingDetailComponent;
  let fixture: ComponentFixture<MeetingDetailComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MeetingDetailComponent],
      providers: [
        provideRouter([]),
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create meeting detail component', () => {
    expect(component).toBeTruthy();
  });
});
