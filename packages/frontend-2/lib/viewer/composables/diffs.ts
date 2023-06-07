import { ToastNotificationType } from '@speckle/ui-components'
import { useApolloClient } from '@vue/apollo-composable'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { useGlobalToast } from '~~/lib/common/composables/toast'
import { getFirstErrorMessage } from '~~/lib/common/helpers/graphql'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useGetObjectUrl } from '~~/lib/viewer/composables/viewer'
import { viewerDiffVersionsQuery } from '~~/lib/viewer/graphql/queries'

export function useDiffing() {
  const state = useInjectedViewerState()
  const getObjectUrl = useGetObjectUrl()
  const authToken = useAuthCookie()
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  // TODO: Instead of managing separate queries and separate stores of versions, this should
  // all just be sourced from state.resources.response
  const diff = async (modelId: string, versionA: string, versionB: string) => {
    const { data, errors } = await apollo.query({
      query: viewerDiffVersionsQuery,
      variables: {
        projectId: state.projectId.value,
        modelId,
        versionAId: versionA,
        versionBId: versionB
      },
      fetchPolicy: 'network-only'
    })

    if (!data.project) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to retrieve versions for diffing.',
        description: getFirstErrorMessage(errors)
      })
      return
    }

    // Brain freeze version of date sort
    const orderFlag =
      new Date(data.project.model.versionA.createdAt).getTime() -
        new Date(data.project.model.versionB.createdAt).getTime() >
      0

    const newVersion = orderFlag
      ? data.project.model.versionA
      : data.project.model.versionB

    const oldVersion = orderFlag
      ? data.project.model.versionB
      : data.project.model.versionA

    if (!newVersion || !oldVersion) return // TODO error

    state.ui.diff.newVersion.value = newVersion
    state.ui.diff.oldVersion.value = oldVersion

    const newObjUrl = getObjectUrl(
      state.projectId.value,
      newVersion.referencedObject as string
    )
    const oldObjUrl = getObjectUrl(
      state.projectId.value,
      oldVersion.referencedObject as string
    )

    // Viewer will load missing resources, so we don't need to do any preloading on our end
    // In undiff() it will unload any things it had to load extra
    // Like this we avoid adding or removing resources ourselves...
    state.ui.diff.diffResult.value = await state.viewer.instance.diff(
      oldObjUrl,
      newObjUrl,
      state.ui.diff.diffMode.value,
      authToken.value
    )

    // if (!state.urlHashState.focusedThreadId.value)
    //   await state.urlHashState.diff.update(state.ui.diff.diffString.value)
  }

  const endDiff = async () => {
    await state.viewer.instance.undiff()
    await state.urlHashState.diff.update(null)
  }

  // TODO: Confusing that this looks identical to the resourceIdString pattern, which would
  // resolve this string differently (2 models, 1 with a specific version ID)
  // + Now we have 2 conflicting sources of truth from which to pull "loaded version" information from:
  // - diffState AND resourceIdString. It should just be the one.
  const formatDiffString = (modelId: string, versionAId: string, versionBId: string) =>
    `${modelId}@${versionAId},${versionBId}`

  const unpackDiffString = (diffString: string) => {
    const parts = diffString.split('@')
    const modelId = parts[0]
    const partsVersions = parts[1].split(',')
    const versionA = partsVersions[0]
    const versionB = partsVersions[1]
    return {
      modelId,
      versionA,
      versionB
    }
  }

  return {
    formatDiffString,
    unpackDiffString,
    diff,
    endDiff
  }
}
