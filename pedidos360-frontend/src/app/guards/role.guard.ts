import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];
    if (!requiredRoles || requiredRoles.length === 0) {
      return of(true);
    }

    return this.apiService.obtenerPerfilAutenticado().pipe(
      map(profile => {
        const hasRequiredRole = requiredRoles.some(requiredRole =>
          profile.roles.some(role => role.toUpperCase() === requiredRole.toUpperCase())
        );

        if (!hasRequiredRole) {
          this.router.navigate(['/403']);
        }
        return hasRequiredRole;
      }),
      catchError(error => {
        console.error('No se pudieron verificar los roles del Access Token:', error);
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}
