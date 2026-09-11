import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ClientePortalComponent } from './components/cliente-portal/cliente-portal.component';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { RoleGuard } from './guards/role.guard';

const protectedGuards = [MsalGuard, RoleGuard];

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    children: []
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: protectedGuards,
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'portal',
    component: ClientePortalComponent,
    canActivate: protectedGuards,
    data: { roles: ['CLIENTE'] }
  },
  {
    path: '403',
    component: AccessDeniedComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
