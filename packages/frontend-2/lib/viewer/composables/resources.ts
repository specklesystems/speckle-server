import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  createGetParamFromResources,
  isModelResource,
  parseUrlParameters
} from '@speckle/shared/viewer/route'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { UseLoadLatestVersion_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import { modelRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment UseLoadLatestVersion_Project on Project {
    id
    workspace {
      slug
    }
  }
`)

export const useLoadLatestVersion = (params: {
  project: Ref<MaybeNullOrUndefined<UseLoadLatestVersion_ProjectFragment>>
  resourceIdString: Ref<string>
}) => {
  const mixpanel = useMixpanel()
  const workspaceSlug = computed(() => unref(params.project)?.workspace?.slug)
  const projectId = computed(() => unref(params.project)?.id)

  const stripVersionIds = (resourceIdString: string) => {
    const resources2 = parseUrlParameters(resourceIdString)
    return createGetParamFromResources(
      resources2.map((r) => {
        if (isModelResource(r)) {
          r.versionId = undefined // Remove versionId from the resource
        }

        return r
      })
    )
  }

  const load = async () => {
    if (!projectId.value) return

    mixpanel.track('Load Latest Version Button Clicked', {
      location: 'viewer',
      ...(workspaceSlug.value
        ? {
            // eslint-disable-next-line camelcase
            workspace_id: workspaceSlug.value
          }
        : {})
    })

    const latestResourceIdString = stripVersionIds(unref(params.resourceIdString))

    // Use the modelRoute but with the cleaned resource string that has no version IDs
    navigateTo(modelRoute(projectId.value, latestResourceIdString))
  }

  const createButton = (isPrimary = true): LayoutDialogButton => ({
    text: 'Load latest version',
    props: {
      color: isPrimary ? 'primary' : 'outline'
    },
    disabled: !projectId.value?.length || !unref(params.resourceIdString)?.length,
    onClick: load
  })

  return { createButton, load }
}
