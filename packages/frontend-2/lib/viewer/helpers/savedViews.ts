import { throwUncoveredError, type StringEnumValues } from '@speckle/shared'
import { isObjectLike, isString } from 'lodash-es'
import { SavedViewVisibility } from '~/lib/common/generated/gql/graphql'

export const ViewsType = {
  Personal: 'personal',
  Shared: 'shared'
} as const
export type ViewsType = StringEnumValues<typeof ViewsType>

export const viewsTypeLabels: Record<ViewsType, string> = {
  [ViewsType.Personal]: 'Personal',
  [ViewsType.Shared]: 'Shared'
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
  if (type === ViewsType.Personal) {
    return {
      onlyAuthored: true
    }
  } else if (type === ViewsType.Shared) {
    return {
      onlyVisibility: SavedViewVisibility.Public
    }
  } else {
    throwUncoveredError(type)
  }
}
