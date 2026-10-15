import { Injectable, computed, inject, signal } from '@angular/core';
import { LOCAL_API } from '../local-api/local-api.token';
import { Organization } from '../models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private localApi = inject(LOCAL_API);

  organization = signal<Organization | null>(null);
  isLoading = signal<boolean>(false);
  isConfigured = computed(() => this.organization() !== null && !!this.organization()?.name);

  async loadOrganization(): Promise<Organization | null> {
    this.isLoading.set(true);
    try {
      const org = await this.localApi.getOrganization();
      this.organization.set(org);
      return org;
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveOrganization(
    data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
    },
  ): Promise<Organization> {
    this.isLoading.set(true);
    try {
      const saved = await this.localApi.saveOrganization(data);
      this.organization.set(saved);
      return saved;
    } finally {
      this.isLoading.set(false);
    }
  }
}
