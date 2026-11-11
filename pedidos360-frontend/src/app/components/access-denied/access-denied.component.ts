import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="access-denied">
      <div class="access-card">
        <span class="access-code">403</span>
        <h1>Acceso restringido</h1>
        <p>Tu cuenta está autenticada, pero no tiene permisos para ver este espacio.</p>
        <a routerLink="/">Volver al inicio</a>
      </div>
    </div>
  `,
  styles: [`
    .access-denied {
      display: grid;
      min-height: 60vh;
      place-items: center;
      padding: 2rem;
    }
    .access-card {
      max-width: 32rem;
      padding: clamp(2rem, 5vw, 3.5rem);
      border: 1px solid #e2e8f0;
      border-radius: 1.5rem;
      background: #fff;
      text-align: center;
      box-shadow: 0 20px 50px rgba(15, 23, 42, .1);
    }
    .access-code {
      color: #2563eb;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 4rem;
      font-weight: 700;
      line-height: 1;
    }
    h1 { margin: 1rem 0 .5rem; color: #172033; }
    p { margin: 0 0 1.5rem; color: #64748b; line-height: 1.6; }
    a {
      display: inline-block;
      padding: .7rem 1rem;
      border-radius: .65rem;
      background: #2563eb;
      color: #fff;
      font-weight: 700;
      text-decoration: none;
    }
  `]
})
export class AccessDeniedComponent {}
