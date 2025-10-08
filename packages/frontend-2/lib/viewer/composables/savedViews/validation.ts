import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import type { GenericValidateFunction } from 'vee-validate'
import { graphql } from '~/lib/common/generated/gql/gql'
import {
  SavedViewVisibility,
  type FullPermissionCheckResultFragment,
  type UseSavedViewValidationHelpers_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { Globe, User } from 'lucide-vue-next'
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
      canMove {
        ...FullPermissionCheckResult
      }
      canEditTitle {
        ...FullPermissionCheckResult
      }
      canEditDescription {
        ...FullPermissionCheckResult
      }
      canSetAsHomeView {
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

  const permissions = computed(() => params.view.value?.permissions)
  const canUpdate = computed(() => permissions.value?.canUpdate)
  const canMove = computed(() => permissions.value?.canMove)
  const canEditTitle = computed(() => permissions.value?.canEditTitle)
  const canEditDescription = computed(() => permissions.value?.canEditDescription)

  const canEmbed = computed((): FullPermissionCheckResultFragment | undefined => {
    if (isLoading.value) {
      return {
        authorized: false,
        errorMessage: undefined,
        code: 'LOADING',
        message: ''
      }
    }

    if (params.view.value?.visibility !== SavedViewVisibility.Public) {
      return {
        authorized: false,
        errorMessage: 'Only shared views can be embedded',
        code: 'FORBIDDEN',
        message: 'Only shared views can be embedded'
      }
    }

    return { authorized: true, code: 'OK', message: '' }
  })

  const canOpenEditDialog = computed(
    (): FullPermissionCheckResultFragment | undefined => {
      if (isLoading.value) {
        return {
          authorized: false,
          errorMessage: undefined,
          code: 'LOADING',
          message: ''
        }
      }

      if (canUpdate.value?.authorized) return canUpdate.value
      if (canEditTitle.value?.authorized) return canEditTitle.value
      if (canEditDescription.value?.authorized) return canEditDescription.value
      if (canMove.value?.authorized) return canMove.value
      return canMove.value
    }
  )

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
      introduction: 'Visible to anyone with access to the model',
      icon: Globe
    },
    {
      value: SavedViewVisibility.AuthorOnly,
      title: 'Private',
      introduction: 'Visible only to the view author',
      icon: User,
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
      if (!permissions.value?.canSetAsHomeView.authorized || isLoading.value) {
        return {
          authorized: false,
          message: permissions.value?.canSetAsHomeView.errorMessage || undefined
        }
      }

      if (isFederatedView.value) {
        return {
          authorized: false,
          message: "Home view settings can't be updated while in a federated view"
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
    canToggleVisibility,
    canMove,
    canEditTitle,
    canEditDescription,
    canOpenEditDialog,
    canEmbed
  }
}
