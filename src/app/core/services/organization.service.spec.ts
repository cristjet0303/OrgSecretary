import { TestBed } from '@angular/core/testing';
import { OrganizationService } from './organization.service';
import { LOCAL_API } from '../local-api/local-api.token';
import { WebLocalApi } from '../local-api/web-local-api.service';

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [OrganizationService, { provide: LOCAL_API, useClass: WebLocalApi }],
    });
    service = TestBed.inject(OrganizationService);
  });

  it('should initialize with null organization and load successfully', async () => {
    expect(service.organization()).toBeNull();
    await service.loadOrganization();
    expect(service.isConfigured()).toBe(false);
  });

  it('should save organization and update reactive signals', async () => {
    const saved = await service.saveOrganization({
      name: 'United Civic Council',
      acronym: 'UCC',
      address: 'City Hall',
      contactDetails: 'info@ucc.org',
    });
    expect(saved.name).toBe('United Civic Council');
    expect(service.organization()?.name).toBe('United Civic Council');
    expect(service.isConfigured()).toBe(true);
  });

  it('should preserve logoPath and headerLines when updating profile without them', async () => {
    await service.saveOrganization({
      name: 'Initial Org',
      logoPath: '/assets/logo.png',
      headerLines: ['Line 1', 'Line 2'],
    });

    const updated = await service.saveOrganization({
      name: 'Updated Org Name',
      acronym: 'UON',
    });

    expect(updated.name).toBe('Updated Org Name');
    expect(updated.logoPath).toBe('/assets/logo.png');
    expect(updated.headerLines).toEqual(['Line 1', 'Line 2']);
  });
});
