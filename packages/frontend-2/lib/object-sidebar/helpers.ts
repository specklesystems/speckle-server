import type { SpeckleObject } from '~/lib/viewer/helpers/sceneExplorer'

export type HeaderSubheader = {
  header: string
  subheader: string
}

export function getHeaderAndSubheaderForSpeckleObject(
  object: SpeckleObject
): HeaderSubheader {
  const rawSpeckleData = object
  const speckleData = object
  const speckleType = speckleData.speckle_type as string
  if (!speckleType)
    return {
      header: cleanName(
        (rawSpeckleData.name as string) ||
          (rawSpeckleData.Name as string) ||
          (rawSpeckleData.speckle_type as string)
      ),
      subheader: ''
    } as HeaderSubheader

  // Handle revit objects
  if (speckleType.toLowerCase().includes('revit')) {
    if (speckleType.toLowerCase().includes('familyinstance')) {
      // TODO
      const famHeader = `${rawSpeckleData.family as string} (${
        rawSpeckleData.category as string
      })`
      const famSubheader = rawSpeckleData.type as string
      return { header: cleanName(famHeader), subheader: famSubheader }
    }

    if (speckleType.toLowerCase().includes('revitelementtype')) {
      return {
        header: cleanName(rawSpeckleData.family as string),
        subheader: `${rawSpeckleData.type as string} / ${
          rawSpeckleData.category as string
        }` //rawSpeckleData.type + ' / ' + rawSpeckleData.category
      }
    }
    const anyHeader = speckleType.split('.').reverse()[0]
    const anySubheaderParts = [rawSpeckleData.category, rawSpeckleData.type].filter(
      (part) => !!part
    )
    return {
      header: cleanName(anyHeader),
      subheader: anySubheaderParts.join(' / ')
    } as HeaderSubheader
  }

  // Handle ifc objects
  if (speckleType.toLowerCase().includes('ifc')) {
    const name = (rawSpeckleData.Name || rawSpeckleData.name) as string
    return {
      header: cleanName((name as string) || (rawSpeckleData.speckle_type as string)),
      subheader: name ? rawSpeckleData.speckle_type : rawSpeckleData.id
    } as HeaderSubheader
  }

  // Handle geometry objects
  if (speckleType.toLowerCase().includes('objects.geometry')) {
    return {
      header: cleanName(speckleType.split('.').reverse()[0]),
      subheader: rawSpeckleData.id
    } as HeaderSubheader
  }

  // LAST DITCH EFFORT
  return {
    header: cleanName(
      (rawSpeckleData.name as string) ||
        (rawSpeckleData.Name as string) ||
        (rawSpeckleData.speckle_type as string).split('.').reverse()[0]
    ),
    subheader: speckleType.split('.').reverse()[0]
  } as HeaderSubheader
}

function cleanName(name: string) {
  if (!name) return 'Unnamed'
  let cleanName = name.trim()

  if (cleanName.startsWith('@')) cleanName = cleanName.substring(1) // remove "@" signs
  // TODO check if this is all we need
  return cleanName
}

/**
 * Encodes a bunch of conventions around getting target object ids from random speckle objects or created
 * @param object
 */
export function getTargetObjectIds(object: Record<string, unknown> | SpeckleObject) {
  // Handle array collections (generated on the fly in the tree explorer)
  if (object.speckle_type === 'Array Collection' && Array.isArray(object.children)) {
    return object.children
      .map((k) => (k as { referencedId: string }).referencedId)
      .filter((id) => !!id)
  }
  // Handles both actual collection objecs( ala IFC) and individual objects
  if (object.id) return [object.id as string]
  return []
}
