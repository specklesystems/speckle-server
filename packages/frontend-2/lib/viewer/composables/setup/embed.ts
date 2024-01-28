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

export function isEmbedOptions(obj: unknown): obj is EmbedOptions {
  if (typeof obj === 'object' && obj !== null) {
    const possibleOptions = obj as Partial<EmbedOptions>
    return Object.keys(possibleOptions).every(
      (key) =>
        [
          'isEnabled',
          'isTransparent',
          'hideControls',
          'hideSelectionInfo',
          'noScroll',
          'manualLoad',
          'commentSlideshow'
        ].includes(key) &&
        typeof possibleOptions[key as keyof EmbedOptions] === 'boolean'
    )
  }
  return false
}

export function deserializeEmbedOptions(embedString: string | null): EmbedOptions {
  const logger = useLogger()
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
  }

  return { isEnabled: false }
}

export function useEmbedState() {
  const { hashState } = useRouteHashState()

  const embedOptions = computed(() => {
    const embedString = hashState.value.embed
    return deserializeEmbedOptions(embedString)
  })

  return { embedOptions }
}
