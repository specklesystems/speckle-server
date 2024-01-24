import { computed } from 'vue'
import { useRouteHashState } from '~~/lib/common/composables/url'

export type EmbedOptions = {
  isEnabled?: boolean
  isTransparent?: boolean
  hideControls?: boolean
  hideSelectionInfo?: boolean
  noScroll?: boolean
  manualLoad?: boolean
  commentSlideshow?: boolean
}

const logger = useLogger()

export function isEmbedOptions(obj: unknown): obj is EmbedOptions {
  if (typeof obj === 'object' && obj !== null) {
    const possibleOptions = obj as Partial<Record<keyof EmbedOptions, unknown>>
    return (
      [
        'isTransparent',
        'hideControls',
        'hideSelectionInfo',
        'noScroll',
        'manualLoad',
        'commentSlideshow'
      ] as Array<keyof EmbedOptions>
    ).every((key) => {
      return !(key in possibleOptions) || typeof possibleOptions[key] === 'boolean'
    })
  }
  return false
}

export function useEmbedState() {
  const { hashState } = useRouteHashState()

  const embedOptions = computed((): EmbedOptions => {
    const embedString = hashState.value.embed
    if (!embedString) {
      return { isEnabled: false }
    }

    try {
      const parsed: unknown = JSON.parse(embedString)
      if (isEmbedOptions(parsed)) {
        return { ...parsed, isEnabled: true }
      }
      logger.error('Parsed object is not of type EmbedOptions')
    } catch (error) {
      logger.error(error)
      return { isEnabled: true }
    }

    return { isEnabled: true }
  })

  return {
    embedOptions
  }
}
