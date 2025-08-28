import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import type { GenericValidateFunction } from 'vee-validate'
import { graphql } from '~/lib/common/generated/gql/gql'
import {
  SavedViewVisibility,
  type UseSavedViewValidationHelpers_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { Globe, Lock } from 'lucide-vue-next'
import type { FormRadioGroupItem } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

graphql(`
  fragment UseSavedViewValidationHelpers_SavedView on SavedView {
    id
    isHomeView
    visibility
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const useSavedViewValidationHelpers = (params: {
  view: ComputedRef<
    MaybeNullOrUndefined<UseSavedViewValidationHelpers_SavedViewFragment>
  >
}) => {
  const homeViewPrivateError = 'A home view must be shared'

  const isLoading = useMutationLoading()
  const {
    resources: {
      response: { isFederatedView }
    }
  } = useInjectedViewerState()

  const canUpdate = computed(() => params.view.value?.permissions.canUpdate)
  const isOnlyVisibleToMe = computed(
    () => params.view.value?.visibility === SavedViewVisibility.AuthorOnly
  )
  const isHomeView = computed(() => params.view.value?.isHomeView)

  /**
   * Visibility options for visibility radio group
   */
  const visibilityOptions = computed((): FormRadioGroupItem<SavedViewVisibility>[] => [
    {
      value: SavedViewVisibility.Public,
      title: 'Shared',
      introduction: 'Visible to anyone with access to the model.',
      icon: Globe
    },
    {
      value: SavedViewVisibility.AuthorOnly,
      title: 'Private',
      introduction: 'Visible only to the view author.',
      icon: Lock,
      ...(params.view.value?.isHomeView
        ? {
            disabled: true,
            help: homeViewPrivateError
          }
        : {})
    }
  ])

  const canSetHomeView = computed(
    (): { authorized: boolean; message: Optional<string> } => {
      if (!canUpdate.value?.authorized || isLoading.value) {
        return {
          authorized: false,
          message: canUpdate.value?.errorMessage || undefined
        }
      }

      if (isFederatedView.value) {
        return {
          authorized: false,
          message: "Home view settings can't be updated while in a federated view"
        }
      }

      if (isOnlyVisibleToMe.value) {
        return {
          authorized: false,
          message: 'A view must be shared to be set as home view'
        }
      }

      return { authorized: true, message: undefined }
    }
  )

  const canToggleVisibility = computed(() => {
    if (!canUpdate.value?.authorized || isLoading.value) {
      return {
        authorized: false,
        message: canUpdate.value?.errorMessage || undefined
      }
    }

    if (isHomeView.value && !isOnlyVisibleToMe.value) {
      return {
        authorized: false,
        message: homeViewPrivateError
      }
    }

    return { authorized: true, message: undefined }
  })

  /**
   * Vee-validate rule for visibility checks
   */
  const validateVisibility: GenericValidateFunction<SavedViewVisibility> = (value) => {
    if (!params.view.value) return true
    if (!params.view.value.isHomeView) return true

    return value === SavedViewVisibility.AuthorOnly ? homeViewPrivateError : true
  }

  return {
    validateVisibility,
    visibilityOptions,
    canUpdate,
    isOnlyVisibleToMe,
    canSetHomeView,
    isHomeView,
    canToggleVisibility
  }
}
