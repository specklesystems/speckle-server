import { SpeckleViewer } from '@speckle/shared'
import { modelRoute } from '~/lib/common/helpers/route'
import { useIsItemExpanded } from '~~/lib/common/composables/window'

export const useIsModelExpanded = (params: {
  fullName: MaybeRef<string>
  projectId: MaybeRef<string>
}) => {
  const id = computed(() => `${unref(params.projectId)}:${unref(params.fullName)}`)
  const state = useIsItemExpanded({ stateName: 'ModelExpandedState', id })
  return state.isExpanded
}

export const useViewerRouteBuilder = () => {
  const builder = () => SpeckleViewer.ViewerRoute.resourceBuilder()

  const modelUrl = (params: { projectId: string; modelId: string }) => {
    const { projectId, modelId } = params
    return modelRoute(projectId, builder().addModel(modelId).toString())
  }

  const versionUrl = (params: {
    projectId: string
    modelId: string
    versionId: string
  }) => {
    const { projectId, modelId, versionId } = params
    return modelRoute(projectId, builder().addModel(modelId, versionId).toString())
  }

  return {
    modelUrl,
    versionUrl
  }
}
