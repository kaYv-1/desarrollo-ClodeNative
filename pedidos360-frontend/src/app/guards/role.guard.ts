import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
      return new Observable(observer => {
        observer.next(requiredRoles?.includes('ADMIN') ?? true);
        observer.complete();
      });
    }

    return this.checkUserRoles(requiredRoles);
  }

  private checkUserRoles(requiredRoles: string[]): Observable<boolean> {
    const currentAccount = this.msalService.instance.getActiveAccount();

    if (!currentAccount) {
      this.router.navigate(['/']);
      return new Observable(obs => obs.next(false));
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return new Observable(obs => obs.next(true));
    }

    // Extract roles from JWT claims (Azure JWT)
    const idTokenClaims = currentAccount.idTokenClaims as any;
    const roles = (idTokenClaims?.roles || []) as string[];

    const hasRequiredRole = requiredRoles.some(requiredRole =>
      roles.some(role => role.toUpperCase() === requiredRole.toUpperCase())
    );

    if (!hasRequiredRole) {
      this.router.navigate(['/403']);
      return new Observable(obs => obs.next(false));
    }

    return new Observable(obs => obs.next(true));
  }
}
