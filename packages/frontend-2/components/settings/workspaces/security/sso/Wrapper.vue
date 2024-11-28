<template>
  <section class="flex flex-col gap-3">
    <SettingsSectionHeader title="Authentication" subheading class="mb-3" />

    <div v-if="loading" class="flex justify-center">
      <CommonLoadingIcon />
    </div>

    <template v-else>
      <div class="flex items-center mb-4">
        <div class="flex-1 flex-col pr-6 gap-y-1">
          <p class="text-body-xs font-medium text-foreground">Enable SSO</p>
          <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
            Allow logins through your OpenID identity provider.
          </p>
        </div>
        <div v-if="workspace.hasAccessToSSO">
          <FormButton
            v-if="isWorkspaceAdmin"
            :disabled="isFormVisible || !!provider"
            @click="handleConfigureClick"
          >
            Configure
          </FormButton>

          <div v-else v-tippy="`You must be a workspace admin`">
            <FormButton disabled>Configure</FormButton>
          </div>
        </div>

        <FormButton v-else @click="goToBilling">Upgrade to Plus</FormButton>
      </div>

      <CommonCard
        v-if="!workspace.hasAccessToSSO && workspace.sso?.provider?.id"
        class="bg-foundation"
      >
        SSO access requires an active Plus or Business subscription.
      </CommonCard>

      <!-- Existing Provider Configuration -->
      <div v-if="provider" class="p-4 border border-outline-3 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-body-xs font-medium text-foreground">
              {{ provider.name }}
            </h3>
            <CommonBadge
              dot
              color-classes="bg-highlight-3 text-foreground-2"
              :dot-icon-color-classes="
                isSsoAuthenticated ? 'text-green-500' : 'text-danger'
              "
            >
              {{ isSsoAuthenticated ? 'Authenticated via SSO' : 'SSO login required' }}
            </CommonBadge>
          </div>
          <LayoutMenu
            v-model:open="showActionsMenu"
            :menu-id="menuId"
            :items="actionsItems"
            :menu-position="HorizontalDirection.Left"
            @chosen="onActionChosen"
          >
            <FormButton
              color="subtle"
              hide-text
              :icon-right="EllipsisHorizontalIcon"
              class="!text-foreground-2"
              @click="onButtonClick"
            />
          </LayoutMenu>
        </div>
      </div>

      <!-- Configuration Instructions -->
      <div
        v-if="isFormVisible && !provider"
        class="py-6 px-8 border border-outline-3 rounded-lg mt-4"
      >
        <FormSelectBase
          v-model="selectedProviderValue"
          :items="providers"
          label="SSO Provider"
          :multiple="false"
          name="provider"
          show-label
          label-position="left"
        >
          <template #option="{ item }">{{ item.label }}</template>
          <template #something-selected="{ value }">
            {{ (Array.isArray(value) ? value[0] : value).label }}
          </template>
        </FormSelectBase>

        <!-- Only show instructions and form after provider is selected -->
        <template v-if="selectedProviderValue">
          <div class="mt-2">
            <SettingsWorkspacesSecuritySsoInstructions
              :selected-provider="selectedProviderValue.id"
              :workspace-slug="workspace.slug"
            />
            <SettingsWorkspacesSecuritySsoForm
              :workspace-slug="workspace.slug"
              :provider-name="selectedProviderValue?.label"
              :issuer-url="selectedProviderValue?.issuerUrl"
              :url-suffix="selectedProviderValue?.urlSuffix"
              @cancel="handleCancel"
              @submit="handleFormSubmit"
            />
          </div>
        </template>
      </div>
    </template>
    <SettingsWorkspacesSecuritySsoDeleteDialog
      v-if="provider"
      v-model:open="isDeleteDialogOpen"
      :provider-name="provider?.name"
      :workspace-id="workspace.id"
    />
  </section>
</template>

<script setup lang="ts">
import type { SettingsWorkspacesSecuritySsoWrapper_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { useWorkspaceSsoStatus } from '~/lib/workspaces/composables/sso'
import { SsoProviderType, type SsoFormValues } from '~/lib/workspaces/helpers/types'
import type { LayoutMenuItem } from '@speckle/ui-components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~/lib/common/generated/gql'
import { useMenuState } from '~/lib/settings/composables/menu'
import { SettingMenuKeys } from '~/lib/settings/helpers/types'
import { Roles } from '@speckle/shared'

type ProviderOption = {
  id: SsoProviderType
  label: string
  issuerUrl?: string
  urlSuffix?: string
}

graphql(`
  fragment SettingsWorkspacesSecuritySsoWrapper_Workspace on Workspace {
    id
    role
    slug
    sso {
      provider {
        id
        name
        clientId
        issuerUrl
      }
    }
    hasAccessToSSO: hasAccessToFeature(featureName: oidcSso)
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesSecuritySsoWrapper_WorkspaceFragment
}>()

enum ActionTypes {
  Delete = 'delete'
}

const { goToWorkspaceMenuItem } = useMenuState()
const logger = useLogger()
const menuId = useId()
const { provider, loading, isSsoAuthenticated } = useWorkspaceSsoStatus({
  workspaceSlug: computed(() => props.workspace.slug)
})

const isFormVisible = ref(false)
const isEditing = ref(false)
const showActionsMenu = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedProviderValue = ref<ProviderOption | undefined>()

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Remove provider...',
      id: ActionTypes.Delete,
      disabled: !isWorkspaceAdmin.value,
      disabledTooltip: 'You must be a workspace admin'
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.Delete:
      isDeleteDialogOpen.value = true
      break
  }
}

const onButtonClick = () => {
  showActionsMenu.value = !showActionsMenu.value
}

const handleConfigureClick = () => {
  isFormVisible.value = true
}

const handleFormSubmit = (data: SsoFormValues) => {
  logger.info('Form submitted:', data)
  isEditing.value = false
  isFormVisible.value = false
}

const handleCancel = () => {
  isFormVisible.value = false
  isEditing.value = false
}

const providers: ProviderOption[] = [
  {
    id: SsoProviderType.Google,
    label: 'Google',
    issuerUrl: 'https://accounts.google.com'
  },
  { id: SsoProviderType.Okta, label: 'Okta', urlSuffix: '.okta.com' },
  {
    id: SsoProviderType.EntraId,
    label: 'Microsoft Entra ID',
    urlSuffix: '.microsoft.com/v2.0'
  },
  { id: SsoProviderType.Custom, label: 'Custom Configuration' }
]

const goToBilling = () => {
  goToWorkspaceMenuItem(props.workspace.id, SettingMenuKeys.Workspace.Billing)
}
</script>
