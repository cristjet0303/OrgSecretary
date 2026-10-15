import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./organization.component').then((m) => m.OrganizationComponent),
  },
];
