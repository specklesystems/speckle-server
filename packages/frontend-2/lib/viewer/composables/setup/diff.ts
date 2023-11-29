import type { Nullable, Optional } from '@speckle/shared'
import { SpeckleViewer } from '@speckle/shared'
import { VisualDiffMode } from '@speckle/viewer'
import type { DiffResult } from '@speckle/viewer'
import type { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import type {
  InitialStateWithUrlHashState,
  InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import {
  isObjectLike,
  has,
  get,
  isArray,
  differenceBy,
  sortBy,
  isString
} from 'lodash-es'

export function setupUiDiffState(
  state: InitialStateWithUrlHashState
): InjectableViewerState['ui']['diff'] {
  const {
    urlHashState: { diff },
    resources: {
      response: { availableModelsAndVersions }
    }
  } = state
  const result = shallowRef(undefined as Optional<DiffResult>)
  const time = ref(0.5)
  const mode = ref<VisualDiffMode>(VisualDiffMode.COLORED)

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
    (): Optional<ViewerModelVersionCardItemFragment> => getVersion('versionA')
  )
  const versionB = computed(
    (): Optional<ViewerModelVersionCardItemFragment> => getVersion('versionB')
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

  const enabled = computed(() => !!(diff.value && sortedActiveVersions.value))

  return {
    newVersion: computed(() => sortedActiveVersions.value?.newVersion),
    oldVersion: computed(() => sortedActiveVersions.value?.oldVersion),
    time,
    mode,
    enabled,
    result
  }
}

export type DiffInstruction = {
  versionA: SpeckleViewer.ViewerRoute.ViewerVersionResource
  versionB: SpeckleViewer.ViewerRoute.ViewerVersionResource
}

export type DiffStateCommand = {
  diffs: DiffInstruction[]
}

export function useDiffBuilderUtilities() {
  const logger = useLogger()

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
          const valString = isString(val) ? val : null
          if (!valString) return null

          const [resource] = SpeckleViewer.ViewerRoute.parseUrlParameters(valString)
          if (!resource || !SpeckleViewer.ViewerRoute.isModelResource(resource))
            return null

          const modelId = resource.modelId
          const versionId = resource.versionId
          if (!modelId || !versionId) return null

          return new SpeckleViewer.ViewerRoute.ViewerVersionResource(modelId, versionId)
        }

        const versionA = getResource(get(diff, 'versionA'))
        const versionB = getResource(get(diff, 'versionB'))
        if (!versionA || !versionB) continue

        finalDiffs.push({
          versionB,
          versionA
        })
      }

      if (!finalDiffs.length) throw new Error('No valid resource referneces found')
      return { diffs: finalDiffs }
    } catch (e) {
      logger.warn('Diff command deserialization failed', e)
      return null
    }
  }

  const areDiffsEqual = (a: DiffStateCommand, b: DiffStateCommand): boolean => {
    const differentInstructions = differenceBy(
      a.diffs,
      b.diffs,
      (instruction) =>
        `${instruction.versionA.toString()}->${instruction.versionB.toString()}`
    )
    return differentInstructions.length < 1
  }

  return {
    serializeDiffCommand,
    deserializeDiffCommand,
    areDiffsEqual
  }
}
