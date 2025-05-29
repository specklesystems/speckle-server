import { Scopes } from '@/modules/core/helpers/mainConstants'
import {
  speckleAutomateUrl,
  getServerOrigin,
  getFeatureFlags
} from '@/modules/shared/helpers/envHelper'
import { ServerScope } from '@speckle/shared'
import { Merge } from 'type-fest'

const { FF_WORKSPACES_MODULE_ENABLED, FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const workspaceScopes = FF_WORKSPACES_MODULE_ENABLED ? [Scopes.Workspaces.Read] : []
const automateScopes = FF_AUTOMATE_MODULE_ENABLED ? [Scopes.Automate.ReportResults] : []

export enum DefaultAppIds {
  Web = 'spklwebapp',
  Explorer = 'explorer',
  DesktopManager = 'sdm',
  Connector = 'sca',
  SpeckleDesktopAuthService = 'sdas',
  Excel = 'spklexcel',
  PowerBI = 'spklpwerbi',
  Automate = 'spklautoma'
}

const SpeckleWebApp = {
  id: DefaultAppIds.Web,
  secret: DefaultAppIds.Web,
  name: 'Speckle Web Manager',
  description:
    'The Speckle Web Manager is your one-stop place to manage and coordinate your data.',
  trustByDefault: true,
  public: true,
  redirectUrl: getServerOrigin(),
  scopes: 'all'
}

const SpeckleApiExplorer = {
  id: DefaultAppIds.Explorer,
  secret: DefaultAppIds.Explorer,
  name: 'Speckle Explorer',
  description: 'GraphiQL Playground with authentication.',
  trustByDefault: true,
  public: true,
  redirectUrl: new URL('/explorer', getServerOrigin()).toString(),
  scopes: 'all'
}

const SpeckleDesktopApp = {
  id: DefaultAppIds.DesktopManager,
  secret: DefaultAppIds.DesktopManager,
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
    Scopes.Users.Invite,
    ...workspaceScopes
  ]
}

const SpeckleConnectorApp = {
  id: DefaultAppIds.Connector,
  secret: DefaultAppIds.Connector,
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
    Scopes.Users.Invite,
    ...workspaceScopes
  ]
}

/** Next gen connectors */
const SpeckleDesktopAuthService = {
  id: DefaultAppIds.SpeckleDesktopAuthService,
  secret: DefaultAppIds.SpeckleDesktopAuthService,
  name: 'Speckle Connector',
  description:
    'Speckle desktop authentication service. This application helps link your Speckle account with all host application connectors, like Revit, Rhino etc.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'http://localhost:29364',
  scopes: [
    Scopes.Streams.Read,
    Scopes.Streams.Write,
    Scopes.Profile.Read,
    Scopes.Profile.Email,
    Scopes.Users.Read,
    Scopes.Users.Invite,
    ...workspaceScopes
  ]
}

const SpeckleExcel = {
  id: DefaultAppIds.Excel,
  secret: DefaultAppIds.Excel,
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
    Scopes.Users.Invite,
    ...workspaceScopes
  ]
}

const SpecklePowerBi = {
  id: DefaultAppIds.PowerBI,
  secret: DefaultAppIds.PowerBI,
  name: 'Speckle Connector For PowerBI',
  description: 'The Speckle Connector for Power BI.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'https://oauth.powerbi.com/views/oauthredirect.html',
  scopes: [
    Scopes.Streams.Read,
    Scopes.Profile.Read,
    Scopes.Profile.Email,
    Scopes.Users.Read,
    Scopes.Users.Invite,
    ...workspaceScopes
  ]
}

const SpeckleAutomate = {
  id: DefaultAppIds.Automate,
  secret: DefaultAppIds.Automate,
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
    ...automateScopes
  ]
}

const defaultApps = [
  SpeckleWebApp,
  SpeckleApiExplorer,
  SpeckleDesktopApp,
  SpeckleConnectorApp,
  SpeckleDesktopAuthService,
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

export type DefaultApp = (typeof defaultApps)[number]

/**
 * Some workflows need 'all' unwrapped into the actual scopes
 */
export type DefaultAppWithUnwrappedScopes = Merge<DefaultApp, { scopes: ServerScope[] }>
