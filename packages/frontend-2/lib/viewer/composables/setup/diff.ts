import { Optional } from '@speckle/shared'
import { DiffResult, VisualDiffMode } from '@speckle/viewer'
import { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import {
  InitialStateWithUrlHashState,
  InjectableViewerState
} from '~~/lib/viewer/composables/setup'

export function setupUiDiffState(
  state: InitialStateWithUrlHashState
): InjectableViewerState['ui']['diff'] {
  const {
    urlHashState: { diff }
  } = state

  const newVersion = ref<ViewerModelVersionCardItemFragment>()
  const oldVersion = ref<ViewerModelVersionCardItemFragment>()
  const diffResult = shallowRef(undefined as Optional<DiffResult>)
  const diffTime = ref(0.5)
  const diffMode = ref<VisualDiffMode>(VisualDiffMode.COLORED)
  const isEnabled = computed(() => !!diff.value)

  return {
    newVersion,
    oldVersion,
    diffTime,
    diffMode,
    enabled: isEnabled,
    diffResult //computed(()=> diffResult.value)
  }
}
