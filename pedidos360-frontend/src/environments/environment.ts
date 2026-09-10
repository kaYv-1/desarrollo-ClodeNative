const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';

const apiScope = 'api://cca6baa4-4933-4d00-b8a9-8c899dbfba57/access_as_user';
const demoMode = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('demo') === 'true';

export const environment = {
  production: false,
  demoMode,
  azure: {
    clientId: 'cca6baa4-4933-4d00-b8a9-8c899dbfba57',
    tenantId: '77747a67-519b-49e8-a701-13c4e011672c',
    redirectUri: currentOrigin,
    postLogoutRedirectUri: currentOrigin,
    apiScope,
    apiEndpoint: 'http://localhost:8080',
    loginScopes: ['openid', 'profile', 'email', apiScope],
    apiScopes: [apiScope],
  },
};
