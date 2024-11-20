import { flatMap } from '#lodash'

/**
 * Speckle role constants
 * - Stream - user roles in the context of a specific stream
 * - Server - user roles in the context of the entire server
 */
export const Roles = Object.freeze(<const>{
  Stream: {
    Owner: 'stream:owner',
    Contributor: 'stream:contributor',
    Reviewer: 'stream:reviewer'
  },
  Workspace: {
    Admin: 'workspace:admin',
    Member: 'workspace:member',
    Guest: 'workspace:guest'
  },
  Server: {
    Admin: 'server:admin',
    User: 'server:user',
    Guest: 'server:guest',
    ArchivedUser: 'server:archived-user'
  }
})

export const RoleInfo = Object.freeze(<const>{
  Stream: {
    [Roles.Stream.Owner]: {
      title: 'Owner',
      description: 'Can edit project, including settings, collaborators and all models'
    },
    [Roles.Stream.Contributor]: {
      title: 'Contributor',
      description: 'Can create models, publish model versions, and comment'
    },
    [Roles.Stream.Reviewer]: {
      title: 'Reviewer',
      description: 'Can view models, load model data, and comment'
    }
  },
  Server: {
    [Roles.Server.Admin]: {
      title: 'Admin',
      description: 'Can edit server, including settings, users and all projects'
    },
    [Roles.Server.User]: {
      title: 'User',
      description: 'Can create and own projects'
    },
    [Roles.Server.Guest]: {
      title: 'Guest',
      description: "Can contribute to projects they're invited to"
    },
    [Roles.Server.ArchivedUser]: {
      title: 'Archived',
      description: 'Can no longer access server'
    }
  },
  Workspace: {
    [Roles.Workspace.Admin]: {
      title: 'Admin',
      description: 'Can edit workspace, including settings, members and all projects'
    },
    [Roles.Workspace.Member]: {
      title: 'Member',
      description: 'Can create and own projects'
    },
    [Roles.Workspace.Guest]: {
      title: 'Guest',
      description: "Can contribute to projects they're invited to"
    }
  }
})

export type ServerRoles = (typeof Roles)['Server'][keyof (typeof Roles)['Server']]
export type WorkspaceRoles =
  (typeof Roles)['Workspace'][keyof (typeof Roles)['Workspace']]
export type StreamRoles = (typeof Roles)['Stream'][keyof (typeof Roles)['Stream']]

export type AvailableRoles = ServerRoles | StreamRoles | WorkspaceRoles

/**
 * Speckle scope constants
 * - Scopes define what kind of access has a user approved for a specific access token
 */
export const Scopes = Object.freeze(<const>{
  Streams: {
    Read: 'streams:read',
    Write: 'streams:write'
  },
  Profile: {
    Read: 'profile:read',
    Email: 'profile:email',
    Delete: 'profile:delete'
  },
  Users: {
    Read: 'users:read',
    Email: 'users:email',
    Invite: 'users:invite'
  },
  Server: {
    Stats: 'server:stats',
    Setup: 'server:setup'
  },
  Tokens: {
    Read: 'tokens:read',
    Write: 'tokens:write'
  },
  Apps: {
    Read: 'apps:read',
    Write: 'apps:write'
  },
  Automate: {
    ReportResults: 'automate:report-results'
  },
  AutomateFunctions: {
    Read: 'automate-functions:read',
    Write: 'automate-functions:write'
  },
  Workspaces: {
    Create: 'workspace:create',
    Read: 'workspace:read',
    Update: 'workspace:update',
    Delete: 'workspace:delete'
  },
  Gatekeeper: {
    WorkspaceBilling: 'workspace:billing'
  }
})

export type StreamScopes = (typeof Scopes)['Streams'][keyof (typeof Scopes)['Streams']]
export type ProfileScopes = (typeof Scopes)['Profile'][keyof (typeof Scopes)['Profile']]
export type UserScopes = (typeof Scopes)['Users'][keyof (typeof Scopes)['Users']]
export type ServerScopes = (typeof Scopes)['Server'][keyof (typeof Scopes)['Server']]
export type TokenScopes = (typeof Scopes)['Tokens'][keyof (typeof Scopes)['Tokens']]
export type AppScopes = (typeof Scopes)['Apps'][keyof (typeof Scopes)['Apps']]
export type AutomateScopes =
  (typeof Scopes)['Automate'][keyof (typeof Scopes)['Automate']]
export type AutomateFunctionScopes =
  (typeof Scopes)['AutomateFunctions'][keyof (typeof Scopes)['AutomateFunctions']]
export type WorkspaceScopes =
  (typeof Scopes)['Workspaces'][keyof (typeof Scopes)['Workspaces']]
export type GatekeeperScopes =
  (typeof Scopes)['Gatekeeper'][keyof (typeof Scopes)['Gatekeeper']]

export type AvailableScopes =
  | StreamScopes
  | ProfileScopes
  | UserScopes
  | ServerScopes
  | TokenScopes
  | AppScopes
  | AutomateScopes
  | AutomateFunctionScopes
  | WorkspaceScopes

/**
 * All scopes
 */
export const AllScopes = flatMap(Scopes, (v) => Object.values(v))

export type ServerScope = (typeof AllScopes)[number]

export const isScope = (scope: unknown): scope is ServerScope =>
  !!(scope && (AllScopes as unknown[]).includes(scope))

export const SourceAppNames = [
  'Dynamo',
  'Revit',
  'AutoCAD',
  'Civil3D',
  'Blender',
  'Rhino',
  'Grasshopper',
  'Excel',
  'Unity',
  'Unreal',
  'Python',
  '.NET',
  'IFC',
  'QGIS',
  'ArcGIS',
  'ETABS',
  'PowerBI',
  'SketchUp',
  'SAP2000',
  'CSiBridge',
  'SAFE',
  'Archicad',
  'Tekla Structures',
  'OpenRoads',
  'OpenRail',
  'OpenBuildings',
  'MicroStation',
  'Navisworks',
  'Speckle Automate'
] as const

export type SourceAppName = (typeof SourceAppNames)[number]

export type SourceAppDefinition = {
  /**
   * String to look for in input app names to match them to a specific source app
   */
  searchKey: string

  /**
   * Full name
   */
  name: SourceAppName

  /**
   * Shortened name
   */
  short: string

  /**
   * BG color hex code for badges
   */
  bgColor: string
}

export const SourceApps: SourceAppDefinition[] = [
  { searchKey: 'dynamo', name: 'Dynamo', short: 'DYN', bgColor: '#a438b6' },
  { searchKey: 'revit', name: 'Revit', short: 'RVT', bgColor: '#3091e7' },
  { searchKey: 'autocad', name: 'AutoCAD', short: 'ACAD', bgColor: '#f0605e' },
  { searchKey: 'civil', name: 'Civil3D', short: 'C3D', bgColor: '#14c1d7' },
  { searchKey: 'blender', name: 'Blender', short: 'BLEND', bgColor: '#fb9514' },
  { searchKey: 'rhino', name: 'Rhino', short: 'RH', bgColor: '#141414' },
  { searchKey: 'grasshopper', name: 'Grasshopper', short: 'GH', bgColor: '#48974b' },
  { searchKey: 'excel', name: 'Excel', short: 'XLSX', bgColor: '#72c076' },
  { searchKey: 'unity', name: 'Unity', short: 'UNITY', bgColor: '#149e91' },
  { searchKey: 'unreal', name: 'Unreal', short: 'UE', bgColor: '#846256' },
  { searchKey: 'python', name: 'Python', short: 'PY', bgColor: '#fddb45' },
  { searchKey: '.net', name: '.NET', short: '.NET', bgColor: '#8531a9' },
  { searchKey: 'ifc', name: 'IFC', short: 'IFC', bgColor: '#bd2e2e' },
  { searchKey: 'qgis', name: 'QGIS', short: 'QGIS', bgColor: '#70e029' },
  { searchKey: 'arcgis', name: 'ArcGIS', short: 'AGIS', bgColor: '#3a6eff' },
  { searchKey: 'etabs', name: 'ETABS', short: 'ETABS', bgColor: '#6d6d6d' },
  { searchKey: 'powerbi', name: 'PowerBI', short: 'PBI', bgColor: '#ffff96' },
  { searchKey: 'sketchup', name: 'SketchUp', short: 'SKP', bgColor: '#8cb7ff' },
  { searchKey: 'sap', name: 'SAP2000', short: 'SAP', bgColor: '#6d6d6d' },
  { searchKey: 'csibridge', name: 'CSiBridge', short: 'CSIB', bgColor: '#6d6d6d' },
  { searchKey: 'safe', name: 'SAFE', short: 'SAFE', bgColor: '#6d6d6d' },
  { searchKey: 'archicad', name: 'Archicad', short: 'ARCHI', bgColor: '#3091e7' },
  {
    searchKey: 'teklastructures',
    name: 'Tekla Structures',
    short: 'TKL',
    bgColor: '#3a6eff'
  },
  { searchKey: 'openroads', name: 'OpenRoads', short: 'OROAD', bgColor: '#846256' },
  { searchKey: 'openrail', name: 'OpenRail', short: 'ORAIL', bgColor: '#846256' },
  {
    searchKey: 'openbuildings',
    name: 'OpenBuildings',
    short: 'OBUILD',
    bgColor: '#846256'
  },
  {
    searchKey: 'microstation',
    name: 'MicroStation',
    short: 'MICRO',
    bgColor: '#846256'
  },
  { searchKey: 'navisworks', name: 'Navisworks', bgColor: '#3e8742', short: 'NAVIS' },
  {
    searchKey: 'automate',
    name: 'Speckle Automate',
    bgColor: '#f85c56',
    short: 'ATMAT'
  }
]

export const WebhookTriggers = Object.freeze(<const>{
  StreamUpdate: 'stream_update',
  StreamDelete: 'stream_delete',
  BranchCreate: 'branch_create',
  BranchUpdate: 'branch_update',
  BranchDelete: 'branch_delete',
  CommitCreate: 'commit_create',
  CommitUpdate: 'commit_update',
  CommitReceive: 'commit_receive',
  CommitDelete: 'commit_delete',
  CommentCreated: 'comment_created',
  CommentArchived: 'comment_archived',
  CommentReplied: 'comment_replied',
  StreamPermissionsAdd: 'stream_permissions_add',
  StreamPermissionsRemove: 'stream_permissions_remove'
})

export const blockedDomains: string[] = [
  // Common Free Email Providers
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'aol.com',
  'ymail.com',
  'mail.com',
  'protonmail.com',
  'icloud.com',
  'zoho.com',
  'gmx.com',
  'me.com',
  'inbox.com',

  // Temporary/Disposable Email Providers
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
  'throwawaymail.com',
  'temp-mail.org',
  'maildrop.cc',
  'getairmail.com',
  'mintemail.com',
  'fakemail.net',
  'temp-mail.ru',
  'moakt.com',
  'emailondeck.com',
  'spamgourmet.com',
  'mailcatch.com',
  'sharklasers.com',
  'trashmail.com',
  'mytrashmail.com',
  'emailfake.com',
  'fakeinbox.com',
  'spamex.com',
  'spambox.us',
  'mailsac.com',
  'fakemailgenerator.com',
  '33mail.com',
  'anonmails.de',
  'anonbox.net',
  'anonymousspeech.com',
  'boun.cr',
  'guerrillamailblock.com',
  'mailfreeonline.com',
  'temp-email.com',
  'mailnesia.com',
  'hmamail.com',
  'fastmail.com',
  'tmailinator.com',
  'spam4.me',
  'fakebox.com',
  'emkei.cz',
  'dispostable.com',
  'mytemp.email',
  'deadaddress.com',
  'spamdecoy.net',
  '0wnd.net',
  '0wnd.org',
  '10mail.org',
  '20mail.it',
  '20mail.in',
  '24hourmail.com',
  '2prong.com',
  '3d-painting.com',
  '4warding.com',
  '4warding.net',
  '4warding.org',
  '5mail.cf',
  '60minutemail.com',
  '675hosting.com',
  '675hosting.net',
  '675hosting.org',
  '6ip.us',
  '6url.com',
  '75hosting.com',
  '75hosting.net',
  '75hosting.org',
  '7tags.com',
  '9ox.net',
  'a-bc.net',
  'afrobacon.com',
  'ajaxapp.net',
  'amilegit.com',
  'anonbox.net',
  'antichef.com',
  'antichef.net',
  'antireg.ru',
  'antispam.de',
  'baxomale.ht.cx',
  'beefmilk.com',
  'binkmail.com',
  'bio-muesli.net',
  'bobmail.info',
  'bofthew.com',
  'brefmail.com',
  'bsnow.net',
  'bugmenot.com',
  'bumpymail.com',
  'casualdx.com',
  'chogmail.com',
  'cool.fr.nf',
  'correo.blogos.net',
  'cosmorph.com',
  'courriel.fr.nf',
  'cubiclink.com',
  'curryworld.de',
  'dacoolest.com',
  'dandikmail.com',
  'deadspam.com',
  'despam.it',
  'devnullmail.com',
  'dfgh.net',
  'digitalsanctuary.com',
  'discardmail.com',
  'dispose.it',
  'disposableaddress.com',
  'disposeamail.com',
  'dispostable.com',
  'dodgeit.com',
  'dodgit.com',
  'dodgit.org',
  'dontreg.com',
  'dontsendmespam.de'
]
