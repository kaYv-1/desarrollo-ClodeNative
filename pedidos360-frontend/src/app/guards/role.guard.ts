import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private msalService: MsalService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];

    if (environment.demoMode) {
      return of(requiredRoles?.includes('ADMIN') ?? true);
    }

    return this.checkUserRoles(requiredRoles, state);
  }

  private checkUserRoles(requiredRoles: string[], state?: RouterStateSnapshot): Observable<boolean> {
    const currentAccount = this.msalService.instance.getActiveAccount();

    if (!currentAccount) {
      if (state && state.url !== '/' && state.url !== '') {
        this.router.navigate(['/']);
      }
      return of(false);
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return of(true);
    }

    // Extract roles from JWT claims (Azure JWT)
    const idTokenClaims = currentAccount.idTokenClaims as any;
    const roles = (idTokenClaims?.roles || []) as string[];

    const hasRequiredRole = requiredRoles.some(requiredRole =>
      roles.some(role => role.toUpperCase() === requiredRole.toUpperCase())
    );

    if (!hasRequiredRole) {
      if (state?.url !== '/403') {
        this.router.navigate(['/403']);
      }
      return of(false);
    }

    return of(true);
  }
}
