export type HeaderSubheader = {
  header: string
  subheader: string
}

export function getHeaderAndSubheaderForSpeckleObject(
  object: Record<string, unknown>
): HeaderSubheader {
  const rawSpeckleData = object
  const speckleData = object
  const speckleType = speckleData.speckle_type as string
  if (!speckleType)
    return {
      header: rawSpeckleData.name || rawSpeckleData.Name || rawSpeckleData.speckle_type,
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
      return { header: famHeader, subheader: famSubheader }
    }

    if (speckleType.toLowerCase().includes('revitelementtype')) {
      return {
        header: rawSpeckleData.family as string,
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
      header: anyHeader,
      subheader: anySubheaderParts.join(' / ')
    } as HeaderSubheader
  }

  // Handle ifc objects
  if (speckleType.toLowerCase().includes('ifc')) {
    const name = rawSpeckleData.Name || rawSpeckleData.name
    return {
      header: name || rawSpeckleData.speckleType,
      subheader: name ? rawSpeckleData.speckle_type : rawSpeckleData.id
    } as HeaderSubheader
  }

  if (speckleType.toLowerCase().includes('objects.geometry')) {
    return {
      header: speckleType.split('.').reverse()[0],
      subheader: rawSpeckleData.id
    } as HeaderSubheader
  }

  // LAST DITCH EFFORT
  return {
    header:
      (rawSpeckleData.name as string) ||
      (rawSpeckleData.Name as string) ||
      (rawSpeckleData.speckle_type as string).split('.').reverse()[0],
    subheader: speckleType.split('.').reverse()[0]
  } as HeaderSubheader
}
