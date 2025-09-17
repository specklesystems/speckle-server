import type {
  UsePresentation_WorkspaceFragment,
  UsePresentation_SavedViewGroupFragment,
  UsePresentation_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export interface InjectablePresentationState {
  presentation: Ref<MaybeNullOrUndefined<UsePresentation_SavedViewGroupFragment>>
  workspace: Ref<MaybeNullOrUndefined<UsePresentation_WorkspaceFragment>>
  slides: Ref<MaybeNullOrUndefined<UsePresentation_SavedViewFragment>[]>
  currentSlide: Ref<MaybeNullOrUndefined<UsePresentation_SavedViewFragment>>
  currentSlideIndex: Ref<number>
  hideUi: Ref<boolean>
  isFirstSlide: Ref<boolean>
  isLastSlide: Ref<boolean>
  slideCount: Ref<number>
}
