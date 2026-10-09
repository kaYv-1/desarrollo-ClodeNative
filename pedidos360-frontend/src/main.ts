import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

interface RuntimeConfig {
  apiEndpoint: string;
}

function isRuntimeConfig(value: unknown): value is RuntimeConfig {
  if (typeof value !== 'object' || value === null || !('apiEndpoint' in value)) {
    return false;
  }

  const apiEndpoint = value.apiEndpoint;
  if (typeof apiEndpoint !== 'string' || apiEndpoint.trim() === '') {
    return false;
  }

  try {
    const endpoint = new URL(apiEndpoint);
    return ['http:', 'https:'].includes(endpoint.protocol)
      && endpoint.username === ''
      && endpoint.password === ''
      && endpoint.search === ''
      && endpoint.hash === '';
  } catch {
    return false;
  }
}

async function bootstrap(): Promise<void> {
  const configUrl = new URL('runtime-config.json', document.baseURI);
  const response = await fetch(configUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${configUrl.href}: HTTP ${response.status}`);
  }

  const config: unknown = await response.json();
  if (!isRuntimeConfig(config)) {
    throw new Error('runtime-config.json debe contener una URL HTTP(S) válida en apiEndpoint.');
  }

  const endpoint = new URL(config.apiEndpoint);
  environment.azure.apiEndpoint = `${endpoint.origin}${endpoint.pathname}`.replace(/\/+$/, '');
  await bootstrapApplication(App, appConfig);
}

void bootstrap().catch((error: unknown) => {
  console.error('No se pudo iniciar Pedidos360:', error);
  document.querySelector('app-root')?.replaceChildren(
    document.createTextNode('No se pudo iniciar la aplicación. Revisa la configuración runtime-config.json.')
  );
});
