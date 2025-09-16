import type { Optional } from '@speckle/shared'
import type { AsyncWritableComputedRef } from '@speckle/ui-components'
import { useQuery } from '@vue/apollo-composable'
import type { Get } from 'type-fest'
import type { ProjectPresentationPageQuery } from '~/lib/common/generated/gql/graphql'
import { projectPresentationPageQuery } from '~/lib/presentations/graphql/queries'

type ResponseProject = Optional<Get<ProjectPresentationPageQuery, 'project'>>
type ResponseWorkspace = Get<ProjectPresentationPageQuery, 'project.workspace'>
type ResponseGroup = Get<ResponseProject, 'savedViewGroup'>

export type InjectablePresentationState = Readonly<{
  projectId: AsyncWritableComputedRef<string>
  presentationId: AsyncWritableComputedRef<string>
  response: {
    project: ComputedRef<ResponseProject>
    workspace: ComputedRef<ResponseWorkspace>
    savedViewGroup: ComputedRef<ResponseGroup>
  }
}>

type InitState = Pick<InjectablePresentationState, 'projectId' | 'presentationId'>
type ResponseState = Pick<InjectablePresentationState, 'response'>

export const InjectablePresentationStateKey: InjectionKey<InjectablePresentationState> =
  Symbol('INJECTABLE_PRESENTATION_STATE')

export type UseSetupPresentationParams = {
  projectId: AsyncWritableComputedRef<string>
  presentationId: AsyncWritableComputedRef<string>
}

const setupStateResponse = (initState: InitState): ResponseState => {
  const { result } = useQuery(projectPresentationPageQuery, () => ({
    projectId: initState.projectId.value,
    savedViewGroupId: initState.presentationId.value,
    input: {
      limit: 100
    }
  }))

  const project = computed(() => result.value?.project)
  const savedViewGroup = computed(() => project.value?.savedViewGroup)
  const workspace = computed(() => project.value?.workspace)

  return {
    response: {
      project,
      workspace,
      savedViewGroup
    }
  }
}

export const useSetupPresentationState = (params: UseSetupPresentationParams) => {
  const initState: InitState = params
  const responseState = setupStateResponse(initState)

  const state: InjectablePresentationState = {
    ...initState,
    ...responseState
  }

  // We don't want the state to ever be proxified (e.g. when passed through props),
  // cause that will break composables (refs will be automatically unwrapped as if
  // they're accessed in a template)
  const rawState = markRaw(state)

  provide(InjectablePresentationStateKey, rawState)
  return rawState
}

export const useInjectedPresentationState = (): InjectablePresentationState => {
  // we're forcing TS to ignore the scenario where this data can't be found and returns undefined
  // to avoid unnecessary null checks everywhere
  const state = inject(InjectablePresentationStateKey) as InjectablePresentationState
  return state
}
