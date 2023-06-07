import { Nullable, Optional, SpeckleViewer } from '@speckle/shared'
import { DiffResult, VisualDiffMode } from '@speckle/viewer'
import { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import {
  InitialStateWithUrlHashState,
  InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import { isObjectLike, has, get, isArray, differenceBy, sortBy } from 'lodash-es'

export function setupUiDiffState(
  state: InitialStateWithUrlHashState
): InjectableViewerState['ui']['diff'] {
  const {
    urlHashState: { diff },
    resources: {
      response: { availableModelsAndVersions }
    }
  } = state
  const diffResult = shallowRef(undefined as Optional<DiffResult>)
  const diffTime = ref(0.5)
  const diffMode = ref<VisualDiffMode>(VisualDiffMode.COLORED)

  // TODO: Only single diff for now
  const getVersion = (type: keyof DiffInstruction) => {
    const instruction = diff.value?.diffs[0]
    if (!instruction) return undefined

    const model = availableModelsAndVersions.value.find(
      (m) => m.model.id === instruction[type].modelId
    )
    if (!model) return undefined
    return model.versions.find((v) => v.id === instruction[type].versionId)
  }

  const versionA = computed(
    (): Optional<ViewerModelVersionCardItemFragment> => getVersion('previousVersion')
  )
  const versionB = computed(
    (): Optional<ViewerModelVersionCardItemFragment> => getVersion('newVersion')
  )

  const sortedActiveVersions = computed(() => {
    if (!versionA.value || !versionB.value) return null
    const sorted = sortBy([versionA.value, versionB.value], (v) =>
      new Date(v.createdAt).getTime()
    )

    return {
      oldVersion: sorted[0],
      newVersion: sorted[1]
    }
  })

  const isEnabled = computed(() => !!(diff.value && sortedActiveVersions.value))

  return {
    newVersion: computed(() => sortedActiveVersions.value?.newVersion),
    oldVersion: computed(() => sortedActiveVersions.value?.oldVersion),
    diffTime,
    diffMode,
    enabled: isEnabled,
    diffResult
  }
}

export type DiffInstruction = {
  previousVersion: SpeckleViewer.ViewerRoute.ViewerVersionResource
  newVersion: SpeckleViewer.ViewerRoute.ViewerVersionResource
}

export type DiffStateCommand = {
  diffs: DiffInstruction[]
}

export function useDiffBuilderUtilities() {
  const serializeDiffCommand = (command: DiffStateCommand): string =>
    JSON.stringify(command)

  const deserializeDiffCommand = (
    command: Nullable<string>
  ): Nullable<DiffStateCommand> => {
    if (!command) return null

    try {
      const deserializedCommand = JSON.parse(command) as unknown
      if (!isObjectLike(deserializedCommand)) throw new Error('Invalid structure')
      if (!has(deserializedCommand, 'diffs')) throw new Error('Invalid structure')

      const diffs = get(deserializedCommand, 'diffs') as unknown
      if (!isArray(diffs)) throw new Error('Invalid structure')

      const finalDiffs: DiffInstruction[] = []
      for (const diff of diffs) {
        const getResource = (
          val: unknown
        ): Nullable<SpeckleViewer.ViewerRoute.ViewerVersionResource> => {
          const modelId = get(val, 'modelId') as string
          const versionId = get(val, 'versionId') as string
          if (!modelId || !versionId) return null

          return new SpeckleViewer.ViewerRoute.ViewerVersionResource(modelId, versionId)
        }

        const previousVersion = getResource(get(diff, 'previousVersion'))
        const newVersion = getResource(get(diff, 'newVersion'))
        if (!previousVersion || !newVersion) continue

        finalDiffs.push({
          newVersion,
          previousVersion
        })
      }

      if (!finalDiffs.length) throw new Error('No valid resource referneces found')
      return { diffs: finalDiffs }
    } catch (e) {
      console.warn('Diff command deserialization failed', e)
      return null
    }
  }

  const areDiffsEqual = (a: DiffStateCommand, b: DiffStateCommand): boolean => {
    const differentInstructions = differenceBy(
      a.diffs,
      b.diffs,
      (instruction) =>
        `${instruction.previousVersion.toString()}->${instruction.newVersion.toString()}`
    )
    return differentInstructions.length < 1
  }

  return {
    serializeDiffCommand,
    deserializeDiffCommand,
    areDiffsEqual
  }
}
