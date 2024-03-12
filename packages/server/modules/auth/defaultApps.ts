import { Scopes } from '@/modules/core/helpers/mainConstants'
import { speckleAutomateUrl, getServerOrigin } from '@/modules/shared/helpers/envHelper'

const SpeckleWebApp = {
  id: 'spklwebapp',
  secret: 'spklwebapp',
  name: 'Speckle Web Manager',
  description:
    'The Speckle Web Manager is your one-stop place to manage and coordinate your data.',
  trustByDefault: true,
  public: true,
  redirectUrl: getServerOrigin(),
  scopes: 'all'
}

const SpeckleApiExplorer = {
  id: 'explorer',
  secret: 'explorer',
  name: 'Speckle Explorer',
  description: 'GraphiQL Playground with authentication.',
  trustByDefault: true,
  public: true,
  redirectUrl: new URL('/explorer', getServerOrigin()).toString(),
  scopes: 'all'
}

const SpeckleDesktopApp = {
  id: 'sdm',
  secret: 'sdm',
  name: 'Speckle Desktop Manager',
  description:
    'Manages local installations of Speckle connectors, kits and everything else.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'speckle://account',
  scopes: [
    Scopes.Streams.Read,
    Scopes.Streams.Write,
    Scopes.Profile.Read,
    Scopes.Profile.Email,
    Scopes.Users.Read,
    Scopes.Users.Invite
  ]
}

const SpeckleConnectorApp = {
  id: 'sca',
  secret: 'sca',
  name: 'Speckle Connector',
  description: 'A Speckle Desktop Connectors.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'http://localhost:29363',
  scopes: [
    Scopes.Streams.Read,
    Scopes.Streams.Write,
    Scopes.Profile.Read,
    Scopes.Profile.Email,
    Scopes.Users.Read,
    Scopes.Users.Invite
  ]
}

const SpeckleExcel = {
  id: 'spklexcel',
  secret: 'spklexcel',
  name: 'Speckle Connector For Excel',
  description:
    'The Speckle Connector For Excel. For more info, check the docs here: https://speckle.guide/user/excel.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'https://speckle-excel.netlify.app',
  scopes: [
    Scopes.Streams.Read,
    Scopes.Streams.Write,
    Scopes.Profile.Read,
    Scopes.Profile.Email,
    Scopes.Users.Read,
    Scopes.Users.Invite
  ]
}

const SpecklePowerBi = {
  id: 'spklpwerbi',
  secret: 'spklpwerbi',
  name: 'Speckle Connector For PowerBI',
  description:
    'The Speckle Connector For Excel. For more info check the docs here: https://speckle.guide/user/powerbi.html.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'https://oauth.powerbi.com/views/oauthredirect.html',
  scopes: [
    Scopes.Streams.Read,
    Scopes.Profile.Read,
    Scopes.Profile.Email,
    Scopes.Users.Read,
    Scopes.Users.Invite
  ]
}

const SpeckleAutomate = {
  id: 'spklautoma',
  secret: 'spklautoma',
  name: 'Speckle Automate',
  description: 'Our automation platform',
  trustByDefault: true,
  public: true,
  redirectUrl: `${speckleAutomateUrl()}/authn/callback`,
  scopes: [
    Scopes.Profile.Email,
    Scopes.Profile.Read,
    Scopes.Users.Read,
    Scopes.Tokens.Write,
    Scopes.Streams.Read,
    Scopes.Streams.Write,
    Scopes.Automate.ReportResults
  ]
}

const defaultApps = [
  SpeckleWebApp,
  SpeckleApiExplorer,
  SpeckleDesktopApp,
  SpeckleConnectorApp,
  SpeckleExcel,
  SpecklePowerBi,
  SpeckleAutomate
]

export function getDefaultApps() {
  return defaultApps
}

export function getDefaultApp({ id }: { id: string }) {
  return defaultApps.find((app) => app.id === id) || null
}
