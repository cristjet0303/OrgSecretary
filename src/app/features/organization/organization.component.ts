import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '@core/services/organization.service';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-organization',
  imports: [CommonModule, CardComponent, ButtonComponent],
  templateUrl: './organization.component.html',
})
export class OrganizationComponent implements OnInit {
  private orgService = inject(OrganizationService);

  orgName = signal('');
  orgAcronym = signal('');
  orgContact = signal('');
  orgAddress = signal('');
  isSaved = signal(false);

  async ngOnInit(): Promise<void> {
    const org = await this.orgService.loadOrganization();
    if (org) {
      this.orgName.set(org.name || '');
      this.orgAcronym.set(org.acronym || '');
      this.orgContact.set(org.contactDetails || '');
      this.orgAddress.set(org.address || '');
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.orgName().trim()) return;
    await this.orgService.saveOrganization({
      name: this.orgName().trim(),
      acronym: this.orgAcronym().trim(),
      contactDetails: this.orgContact().trim(),
      address: this.orgAddress().trim(),
    });
    this.isSaved.set(true);
    setTimeout(() => this.isSaved.set(false), 3000);
  }
}
