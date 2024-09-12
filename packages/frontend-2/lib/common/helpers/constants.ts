/**
 * Key values for JS-accessible cookies
 */
export enum CookieKeys {
  AuthToken = 'authn',
  Theme = 'theme',
  PostAuthRedirect = 'postAuthRedirect',
  DismissedDiscoverableWorkspaces = 'dismissedDiscoverableWorkspaces',
  DismissedWorkspaceBanner = 'dismissedWorkspaceBanner'
}

/**
 * Key values for (frontend only) local storage keys
 */
export enum LocalStorageKeys {
  AuthAppChallenge = 'appChallenge'
}

export const ViewerSceneExplorerStateKey = 'viewer-selection'
