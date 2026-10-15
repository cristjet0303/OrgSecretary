import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeetingListComponent } from './meeting-list.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('MeetingListComponent', () => {
  let component: MeetingListComponent;
  let fixture: ComponentFixture<MeetingListComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MeetingListComponent],
      providers: [
        provideRouter([]),
        { provide: LOCAL_API, useClass: WebLocalApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render meeting list title', () => {
    expect(fixture.nativeElement.textContent).toContain('Meetings & Events');
  });
});
