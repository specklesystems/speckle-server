/**
 * TODO: Does this need to change for new frontend?
 */
export const speckleWebAppId = 'spklwebapp'

export enum AuthStrategy {
  Local = 'local',
  Google = 'google',
  Github = 'github',
  AzureAD = 'azuread'
}

export const AuthStrategyStyles: Partial<
  Record<AuthStrategy, { buttonType: 'danger' | 'outline' | 'pop' }>
> = {
  [AuthStrategy.Google]: {
    buttonType: 'danger'
  },
  [AuthStrategy.Github]: {
    buttonType: 'outline'
  },
  [AuthStrategy.AzureAD]: {
    buttonType: 'pop'
  }
}
