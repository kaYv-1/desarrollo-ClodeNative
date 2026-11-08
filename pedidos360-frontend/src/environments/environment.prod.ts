const apiScope = 'api://cca6baa4-4933-4d00-b8a9-8c899dbfba57/access_as_user';
const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

export const environment = {
  production: true,
  apiGatewayUrl: 'https://api-gateway-id.execute-api.region.amazonaws.com/prod',
  azure: {
    clientId: 'cca6baa4-4933-4d00-b8a9-8c899dbfba57',
    tenantId: '77747a67-519b-49e8-a701-13c4e011672c',
    redirectUri: currentOrigin,
    postLogoutRedirectUri: currentOrigin,
    apiScope,
    loginScopes: ['openid', 'profile', 'email', apiScope],
    apiScopes: [apiScope],
  },
};
