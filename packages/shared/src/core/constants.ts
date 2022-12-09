import _ from 'lodash'

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
  Server: {
    Admin: 'server:admin',
    User: 'server:user',
    ArchivedUser: 'server:archived-user'
  }
})

export type ServerRoles = typeof Roles['Server'][keyof typeof Roles['Server']]
export type StreamRoles = typeof Roles['Stream'][keyof typeof Roles['Stream']]

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
  }
})

/**
 * All scopes
 */
export const AllScopes = _.flatMap(Scopes, (v) => Object.values(v))

export type SourceAppDefinition = {
  /**
   * String to look for in input app names to match them to a specific source app
   */
  searchKey: string

  /**
   * Full name
   */
  name: string

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
    short: 'TEKLAS',
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
  }
]
