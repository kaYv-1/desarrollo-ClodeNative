import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { App } from './app';

class MsalServiceMock {
  instance = {
    getActiveAccount: () => null,
    getAllAccounts: () => [],
    setActiveAccount: () => undefined,
  };

  initialize = () => of(undefined);
  handleRedirectObservable = () => of(null);
  acquireTokenSilent = () => of({ accessToken: 'token-demo' });
  acquireTokenPopup = () => of({ accessToken: 'token-demo' });
  loginPopup = () => of({ account: { name: 'Usuario Demo', username: 'demo@duoc.cl' } });
  logoutPopup = () => undefined;
}

class MsalBroadcastServiceMock {
  msalSubject$ = of();
  inProgress$ = of();
}

import { provideRouter } from '@angular/router';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: MsalService, useClass: MsalServiceMock },
        { provide: MsalBroadcastService, useClass: MsalBroadcastServiceMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the sign-in prompt by default', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Pedidos360');
    expect(compiled.querySelector('button')?.textContent).toContain('Iniciar Sesión');
  });
});
