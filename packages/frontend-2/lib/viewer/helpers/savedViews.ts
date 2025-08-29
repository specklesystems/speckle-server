import { throwUncoveredError, type StringEnumValues } from '@speckle/shared'
import { isObjectLike, isString } from 'lodash-es'

export const ViewsType = {
  All: 'all',
  Mine: 'mine'
} as const
export type ViewsType = StringEnumValues<typeof ViewsType>

export const viewsTypeLabels: Record<ViewsType, string> = {
  [ViewsType.All]: 'All views',
  [ViewsType.Mine]: 'My views'
}

/**
 * Url hash state struct for saved views
 */
export type SavedViewUrlSettings = {
  id: string
  loadOriginal?: boolean
}

export const parseSavedViewUrlSettings = (
  settingsString: string | null
): SavedViewUrlSettings | null => {
  if (!settingsString) return null

  try {
    const parsed = JSON.parse(settingsString)
    if (isObjectLike(parsed) && isString(parsed.id)) {
      return parsed as SavedViewUrlSettings
    }
  } catch {
    // suppress
  }

  return null
}

export const serializeSavedViewUrlSettings = (
  settings: SavedViewUrlSettings
): string => {
  return JSON.stringify(settings)
}

export const viewsTypeToFilters = (type: ViewsType) => {
  if (type === ViewsType.Mine) {
    return {
      onlyAuthored: true
    }
  } else if (type === ViewsType.All) {
    return {}
  } else {
    throwUncoveredError(type)
  }
}
