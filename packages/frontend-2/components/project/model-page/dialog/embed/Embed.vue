<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="lg"
    :buttons="buttons"
    title="Embed model"
  >
    <template v-if="canGenerateEmbed">
      <CommonAlert
        v-if="multipleVersionedResources"
        class="mb-4"
        color="info"
        size="xs"
      >
        <template #title>You are embedding a specific version</template>
        <template #description>
          <p>
            Anyone with this embed link can view your model data. Be careful where you
            share it!
          </p>
        </template>
      </CommonAlert>

      <CommonAlert
        v-if="!isPublicProject && canCreateEmbedTokens"
        class="mb-4"
        color="info"
        size="2xs"
      >
        <template #title>
          You are embedding a
          <span class="lowercase">{{ projectVisibility }}</span>
          project
        </template>
        <template #description>
          <p>
            Anyone with this embed link can view your model, be careful where you share
            it.
          </p>
        </template>
      </CommonAlert>

      <div class="flex flex-col lg:flex-row gap-8 mb-6">
        <div class="flex-1 order-1 lg:order-2">
          <h4 class="text-heading-sm text-foreground-2 mb-1 ml-0.5">Embed code</h4>
          <FormClipboardInput :value="iframeCode" is-multiline />
          <p class="text-body-xs text-foreground-2 mt-2 mb-5 ml-0.5">
            Copy this code to embed your model in a webpage or document.
          </p>
          <h4 class="text-heading-sm text-foreground-2 mb-1 ml-0.5">Embed URL</h4>
          <FormClipboardInput class="mb-4" :value="updatedUrl" />
          <LayoutDialogSection border-b border-t title="Options">
            <div class="flex flex-col gap-1.5 sm:gap-2 text-body-xs cursor-default">
              <div v-for="option in embedDialogOptions" :key="option.id">
                <label
                  :for="`option-${option.id}`"
                  class="flex items-center gap-1 cursor-pointer max-w-max"
                >
                  <FormCheckbox
                    :id="`option-${option.id}`"
                    :model-value="option.value.value"
                    :name="option.label"
                    hide-label
                    class="cursor-pointer"
                    @update:model-value="
                      (newValue) => updateOption(option.value, newValue)
                    "
                  />
                  <span>{{ option.label }}</span>
                </label>
              </div>
              <div v-if="isWorkspacesEnabled">
                <label
                  :for="`option-hide-logo`"
                  class="flex items-center gap-1 cursor-pointer max-w-max"
                >
                  <FormCheckbox
                    id="option-hide-logo"
                    v-model="hideSpeckleBranding"
                    name="Hide Speckle logo"
                    hide-label
                    class="cursor-pointer"
                    :disabled="
                      workspaceHideSpeckleBrandingEnabled ||
                      !canEditEmbedOptions?.authorized
                    "
                  />
                  <div class="flex flex-col gap-0.5">
                    <span
                      :key="`hide-branding-tooltip-${workspaceHideSpeckleBrandingEnabled}`"
                      v-tippy="hideSpeckleBrandingTooltip"
                    >
                      Hide Speckle logo
                    </span>
                    <span
                      v-if="
                        !canEditEmbedOptions?.authorized &&
                        canEditEmbedOptions?.code ===
                          'WorkspacePlanNoFeatureAccessError'
                      "
                      class="text-body-2xs text-foreground-2"
                    >
                      This feature is only available on the business plan
                      <NuxtLink
                        v-if="isAdmin"
                        :to="settingsWorkspaceRoutes.billing.route(workspaceSlug)"
                        class="underline"
                      >
                        upgrade now
                      </NuxtLink>
                    </span>
                    <span
                      v-if="hideSpeckleBranding && !workspaceHideSpeckleBrandingEnabled"
                      class="text-body-2xs text-foreground-2"
                    >
                      Tip: You can also hide the logo for all embeds in
                      <NuxtLink
                        :to="settingsWorkspaceRoutes.general.route(workspaceSlug)"
                        class="underline"
                        target="_blank"
                      >
                        workspace settings.
                      </NuxtLink>
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </LayoutDialogSection>
          <LayoutDialogSection
            v-if="!isSmallerOrEqualSm"
            lazy-load
            border-b
            title="Preview"
          >
            <ProjectModelPageDialogEmbedIframe
              v-if="!isSmallerOrEqualSm"
              :src="updatedUrl"
              title="Preview"
              width="600"
              height="400"
              class="shrink-0 w-[600px] h-[400px] mx-auto border border-outline-2"
            />
          </LayoutDialogSection>
        </div>
      </div>
    </template>
    <template v-else>
      <CommonAlert color="info" size="xs">
        <template #title>
          Cannot embed
          <span class="lowercase">'{{ project.visibility }}'</span>
          project
        </template>
        <template #description>
          <p>
            {{ cantGenerateDialogDescription }}
          </p>
        </template>
      </CommonAlert>
    </template>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { ProjectsModelPageEmbed_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { useClipboard } from '~~/composables/browser'
import { SpeckleViewer, Roles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useCreateEmbedToken } from '~~/lib/projects/composables/tokenManagement'
import {
  SupportedProjectVisibility,
  castToSupportedVisibility
} from '~/lib/projects/helpers/visibility'
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment ProjectsModelPageEmbed_Project on Project {
    id
    visibility
    permissions {
      canCreateEmbedTokens {
        ...FullPermissionCheckResult
      }
    }
    workspace {
      id
      slug
      role
      embedOptions {
        hideSpeckleBranding
      }
      permissions {
        canEditEmbedOptions {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectsModelPageEmbed_ProjectFragment
  modelId?: string
  versionId?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const route = useRoute()
const { copy } = useClipboard()
const {
  public: { baseUrl }
} = useRuntimeConfig()
const createEmbedToken = useCreateEmbedToken()

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const transparentBackground = ref(false)
const hideViewerControls = ref(false)
const hideSelectionInfo = ref(false)
const disableModelLink = ref(false)
const preventScrolling = ref(false)
const manuallyLoadModel = ref(false)
const hideSpeckleBranding = ref(false)
const embedToken = ref<string | null>(null)

const isAdmin = computed(() => props.project.workspace?.role === Roles.Workspace.Admin)

const routeModelId = computed(() => route.params.modelId as string)

const parsedResources = computed(() =>
  SpeckleViewer.ViewerRoute.parseUrlParameters(routeModelId.value)
)

const multipleVersionedResources = computed(() => {
  return (
    parsedResources.value.filter(
      (resource) =>
        SpeckleViewer.ViewerRoute.isModelResource(resource) &&
        resource.versionId !== undefined
    ).length > 1
  )
})

const updatedUrl = computed(() => {
  const url = new URL(`/projects/${encodeURIComponent(props.project.id)}`, baseUrl)

  url.pathname += '/models/'

  // Use props.modelId and props.versionId if provided
  if (props.modelId) {
    let modelPath = encodeURIComponent(props.modelId)
    if (props.versionId) {
      modelPath += `@${encodeURIComponent(props.versionId)}`
    }
    url.pathname += modelPath
  } else {
    // Otherwise, use routeModelId directly
    url.pathname += routeModelId.value
  }

  // Add token parameter if embed token exists
  if (embedToken.value) {
    url.searchParams.set('embedToken', embedToken.value)
  }

  // Construct the embed options as a hash fragment
  const embedOptions: Record<string, boolean> = { isEnabled: true }
  embedDialogOptions.forEach((option) => {
    if (option.value.value) {
      embedOptions[option.id] = true
    }
  })

  if (
    hideSpeckleBranding.value &&
    isWorkspacesEnabled.value &&
    !workspaceHideSpeckleBrandingEnabled.value
  ) {
    embedOptions['hideSpeckleBranding'] = true
  }

  // Serialize the embedOptions into a hash fragment
  const hashFragment = encodeURIComponent(JSON.stringify(embedOptions))
  url.hash = `embed=${hashFragment}`

  return url.toString()
})

const iframeCode = computed(() => {
  return `<iframe title="Speckle" src="${updatedUrl.value}" width="600" height="400" frameborder="0"></iframe>`
})

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  ...(isPublicProject.value || (!isPublicProject.value && canCreateEmbedTokens.value)
    ? [
        {
          text: 'Copy embed code',
          props: {},
          onClick: () => {
            handleEmbedCodeCopy(iframeCode.value)
          }
        }
      ]
    : [])
])

const workspaceSlug = computed(() => {
  return props.project.workspace?.slug
})
const canEditEmbedOptions = computed(() => {
  return props.project.workspace?.permissions?.canEditEmbedOptions
})
const canCreateEmbedTokens = computed(() => {
  return props.project.permissions?.canCreateEmbedTokens?.authorized
})
const projectVisibility = computed(() =>
  castToSupportedVisibility(props.project.visibility)
)
const isPublicProject = computed(
  () => projectVisibility.value === SupportedProjectVisibility.Public
)
const workspaceHideSpeckleBrandingEnabled = computed(() => {
  if (!isWorkspacesEnabled.value) return false
  return props.project.workspace?.embedOptions?.hideSpeckleBranding
})
const hideSpeckleBrandingTooltip = computed(() => {
  if (!isWorkspacesEnabled.value) return ''
  if (workspaceHideSpeckleBrandingEnabled.value) {
    return 'Speckle branding is disabled for all embeds in this workspace'
  }
  return ''
})
const canGenerateEmbed = computed(() => {
  return isPublicProject.value || (!isPublicProject.value && canCreateEmbedTokens.value)
})
const cantGenerateDialogDescription = computed(() => {
  if (
    props.project.permissions?.canCreateEmbedTokens?.code === 'WorkspaceNoFeatureAccess'
  ) {
    return `Embedding ${props.project.visibility.toLowerCase()} projects is not available on your plan. Upgrade your workspace to get access to this feature.`
  }
  return `The visibility of this project is set to '${props.project.visibility.toLowerCase()}'. Please contact the project owner to change the visibility or generate an embed link.`
})

const handleEmbedCodeCopy = async (value: string) => {
  await copy(value, {
    successMessage: 'Embed code copied to clipboard',
    failureMessage: 'Failed to copy embed code to clipboard'
  })
}

const updateOption = (optionRef: Ref<boolean>, newValue: unknown) => {
  optionRef.value = newValue === undefined ? false : !!newValue
}

const embedDialogOptions = [
  {
    id: 'isTransparent',
    label: 'Transparent background',
    value: transparentBackground
  },
  {
    id: 'hideControls',
    label: 'Hide viewer controls',
    value: hideViewerControls
  },
  {
    id: 'hideSelectionInfo',
    label: 'Hide the selection info panel',
    value: hideSelectionInfo
  },
  {
    id: 'disableModelLink',
    label: 'No link back to web viewer',
    value: disableModelLink
  },
  {
    id: 'noScroll',
    label: 'Prevent scrolling (zooming)',
    value: preventScrolling
  },
  {
    id: 'manualLoad',
    label: 'Load model manually',
    value: manuallyLoadModel
  }
]

watch(
  () => props.project.workspace?.embedOptions?.hideSpeckleBranding,
  () => {
    if (isWorkspacesEnabled.value) {
      hideSpeckleBranding.value =
        props.project.workspace?.embedOptions?.hideSpeckleBranding ?? false
    }
  },
  { immediate: true }
)

watch(
  isOpen,
  async (newValue) => {
    if (newValue) {
      mixpanel.track('Embed Dialog Opened', {
        projectId: props.project.id,
        visibility: projectVisibility.value
      })

      if (canCreateEmbedTokens.value) {
        mixpanel.track('Embed Token Created', {
          projectId: props.project.id,
          visibility: projectVisibility.value
        })

        const token = await createEmbedToken({
          projectId: props.project.id,
          resourceIdString: routeModelId.value
        })

        if (token) {
          embedToken.value = token
        }
      }
    }
  },
  { immediate: true }
)
</script>
