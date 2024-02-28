import { writableAsyncComputed } from '~/lib/common/composables/async'
import { useScopedState } from '~/lib/common/composables/scopedState'
import { ViewerHashStateKeys } from '~/lib/viewer/composables/setup/urlHashState'
import { useConditionalViewerRendering } from '~/lib/viewer/composables/ui'
import { useRouteHashState } from '~~/lib/common/composables/url'

export type EmbedOptions = {
  isEnabled?: boolean
  isTransparent?: boolean
  hideControls?: boolean
  hideSelectionInfo?: boolean
  noScroll?: boolean
  manualLoad?: boolean
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
          'manualLoad'
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

  const embedOptions = writableAsyncComputed({
    get: () => {
      const embedString = hashState.value[ViewerHashStateKeys.EmbedOptions]
      return deserializeEmbedOptions(embedString)
    },
    set: async (newOptions) => {
      const embedString = newOptions ? JSON.stringify(newOptions) : null
      await hashState.update({
        ...hashState.value,
        [ViewerHashStateKeys.EmbedOptions]: embedString
      })
    },
    initialState: null,
    asyncRead: false
  })

  return { embedOptions }
}

const embedStateScopedKey = Symbol('EmbedStateScopedKey')

export function useEmbed() {
  const { embedOptions } = useEmbedState()
  const { showControls } = useConditionalViewerRendering()

  // useScopedState so that we don't keep creating new computeds
  return useScopedState(embedStateScopedKey, () => {
    const createComputed = <K extends keyof EmbedOptions>(key: K) =>
      writableAsyncComputed({
        get: () => embedOptions.value?.[key],
        set: async (newVal) => {
          await embedOptions.update({
            ...(embedOptions.value ?? {}),
            ...{
              [key]: newVal
            }
          })
        },
        initialState: null,
        asyncRead: false
      })

    const isEnabled = createComputed('isEnabled')
    const isTransparent = createComputed('isTransparent')

    const hideSelectionInfo = createComputed('hideSelectionInfo')
    const noScroll = createComputed('noScroll')
    const manualLoad = createComputed('manualLoad')

    const showControlsNew = writableAsyncComputed({
      get: () => showControls.value,
      set: async (newVal) =>
        await embedOptions.update({
          ...(embedOptions.value ?? {}),
          ...{
            hideControls: !(newVal || undefined)
          }
        }),
      initialState: null,
      asyncRead: false
    })

    return {
      isEnabled,
      isEmbedEnabled: isEnabled,
      isTransparent,
      showControls: showControlsNew,
      hideSelectionInfo,
      noScroll,
      manualLoad
    }
  })
}
