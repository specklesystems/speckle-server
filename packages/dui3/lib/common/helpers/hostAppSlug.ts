/**
 * @param appname application name with its version, i.e. `Rhino 7`, `Revit 2024`
 * @returns slug
 */
export function getSlugFromHostAppNameAndVersion(appname: string) {
  if (!appname) {
    return 'other'
  }

  // delete space if any
  appname = appname.toLowerCase().replace(/\s/g, '')

  const keywords = [
    'dynamo',
    'revit',
    'autocad',
    'civil',
    'rhino',
    'grasshopper',
    'unity',
    'gsa',
    'microstation',
    'openroads',
    'openrail',
    'openbuildings',
    'etabs',
    'sap',
    'csibridge',
    'safe',
    'teklastructures',
    'dxf',
    'excel',
    'unreal',
    'powerbi',
    'blender',
    'qgis',
    'arcgis',
    'sketchup',
    'archicad',
    'topsolid',
    'python',
    'net',
    'navisworks',
    'advancesteel'
  ]

  for (const keyword of keywords) {
    if (appname.includes(keyword)) {
      return keyword
    }
  }

  return appname
}
