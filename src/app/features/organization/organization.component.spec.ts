import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationComponent } from './organization.component';
import { LOCAL_API } from '@core/local-api/local-api.token';
import { WebLocalApi } from '@core/local-api/web-local-api.service';

describe('OrganizationComponent', () => {
  let component: OrganizationComponent;
  let fixture: ComponentFixture<OrganizationComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OrganizationComponent],
      providers: [{ provide: LOCAL_API, useClass: WebLocalApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create organization component', () => {
    expect(component).toBeTruthy();
  });

  it('should update organization name signal on form submit', async () => {
    component.orgName.set('Metro Civic League');
    await component.onSubmit();
    expect(component.isSaved()).toBe(true);
  });
});
