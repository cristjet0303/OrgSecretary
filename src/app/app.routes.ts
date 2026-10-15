import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'organization',
        loadChildren: () =>
          import('@features/organization/organization.routes').then((m) => m.ORGANIZATION_ROUTES),
      },
      {
        path: 'meetings',
        loadChildren: () =>
          import('@features/meetings/meetings.routes').then((m) => m.MEETINGS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
