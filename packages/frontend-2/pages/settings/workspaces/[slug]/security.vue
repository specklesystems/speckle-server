<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Security"
        text="Manage verified workspace domains and associated features."
      />
      <template v-if="isSsoEnabled">
        <SettingsWorkspacesSecuritySsoWrapper v-if="workspace" :workspace="workspace" />
        <hr class="my-6 md:my-8 border-outline-2" />
      </template>
      <section>
        <SettingsSectionHeader
          title="Allowed email domains"
          class="pb-4 md:pb-6"
          subheading
        />
        <CommonCard v-if="workspace?.sso?.provider?.id" class="bg-foundation mb-4">
          With SSO enabled, allowed domains are configured on your identity provider's
          side.
        </CommonCard>
        <ul v-if="hasWorkspaceDomains">
          <li
            v-for="domain in workspaceDomains"
            :key="domain.id"
            class="border-x border-b first:border-t first:rounded-t-lg border-outline-2 last:rounded-b-lg p-6 py-4 flex items-center"
          >
            <p class="text-body-xs font-medium flex-1">@{{ domain.domain }}</p>
            <FormButton
              :disabled="workspaceDomains.length === 1 && isDomainProtectionEnabled"
              color="outline"
              @click="openRemoveDialog(domain)"
            >
              Delete
            </FormButton>
          </li>
        </ul>

        <p
          v-else
          class="text-body-xs text-foreground-2 border border-outline-2 p-6 rounded-lg"
        >
          No verified domains yet
        </p>
      </section>
      <section class="mt-8">
        <div class="grid grid-cols-2 gap-x-6 items-center">
          <div class="flex flex-col gap-y-1">
            <p class="text-body-xs font-medium text-foreground">New domain</p>
            <p class="text-body-2xs text-foreground-2 leading-5">
              Add a domain from a list of email domains for your active account.
            </p>
          </div>
          <div class="flex gap-x-3">
            <FormSelectBase
              v-model="selectedDomain"
              :items="verifiedUserDomains"
              :disabled-item-predicate="disabledItemPredicate"
              disabled-item-tooltip="This domain can't be used for verified workspace domains"
              name="workspaceDomains"
              label="Verified domains"
              class="w-full"
            >
              <template #nothing-selected>Select domain</template>
              <template #something-selected="{ value }">@{{ value }}</template>
              <template #option="{ item }">
                <div class="flex items-center">@{{ item }}</div>
              </template>
            </FormSelectBase>
            <FormButton :disabled="!selectedDomain" @click="addDomain">Add</FormButton>
          </div>
        </div>
      </section>
      <section class="flex flex-col space-y-3 mt-8">
        <div class="flex flex-col space-y-8">
          <div class="flex items-center">
            <div class="flex-1 flex-col pr-6 gap-y-1">
              <p class="text-body-xs font-medium text-foreground">Domain protection</p>
              <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
                Only users with email addresses from your verified domains can be added
                as workspace members or administrators.
              </p>
            </div>
            <FormSwitch
              v-model="isDomainProtectionEnabled"
              :show-label="false"
              :disabled="!hasWorkspaceDomains"
              name="domain-protection"
            />
          </div>
          <div class="flex items-center">
            <div class="flex-1 flex-col pr-6 gap-y-1">
              <p class="text-body-xs font-medium text-foreground">
                Domain-based discoverability
              </p>
              <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
                When enabled, users with a verified email address from your verified
                domain list will be able to able to automatically join this workspace.
              </p>
            </div>
            <FormSwitch
              v-model="isDomainDiscoverabilityEnabled"
              name="domain-discoverability"
              :disabled="!hasWorkspaceDomains"
              :show-label="false"
            />
          </div>
        </div>
      </section>
    </div>

    <SettingsWorkspacesSecurityDomainRemoveDialog
      v-if="removeDialogDomain && workspace"
      v-model:open="showRemoveDomainDialog"
      :workspace-id="workspace?.id"
      :domain="removeDialogDomain"
    />
  </section>
</template>

<script setup lang="ts">
import type { ShallowRef } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment } from '~/lib/common/generated/gql/graphql'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { settingsWorkspacesSecurityQuery } from '~/lib/settings/graphql/queries'
import { useAddWorkspaceDomain } from '~/lib/settings/composables/management'
import { useMixpanel } from '~/lib/core/composables/mp'
import { blockedDomains } from '@speckle/shared'
import { useIsWorkspacesSsoEnabled } from '~/composables/globals'
import {
  workspaceUpdateDomainProtectionMutation,
  workspaceUpdateDiscoverabilityMutation
} from '~/lib/workspaces/graphql/mutations'

graphql(`
  fragment SettingsWorkspacesSecurity_Workspace on Workspace {
    id
    slug
    domains {
      id
      domain
      ...SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomain
    }
    ...SettingsWorkspacesSecuritySsoWrapper_Workspace
    domainBasedMembershipProtectionEnabled
    discoverabilityEnabled
  }

  fragment SettingsWorkspacesSecurity_User on User {
    id
    emails {
      id
      email
      verified
    }
  }
`)

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Security'
})

const slug = computed(() => (route.params.slug as string) || '')

const route = useRoute()
const addWorkspaceDomain = useAddWorkspaceDomain()
const { triggerNotification } = useGlobalToast()
const isSsoEnabled = useIsWorkspacesSsoEnabled()
const mixpanel = useMixpanel()
const { mutate: updateDomainProtection } = useMutation(
  workspaceUpdateDomainProtectionMutation
)
const { mutate: updateDiscoverability } = useMutation(
  workspaceUpdateDiscoverabilityMutation
)

const selectedDomain = ref<string>()
const showRemoveDomainDialog = ref(false)
const removeDialogDomain =
  ref<SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment>()
const blockedDomainItems: ShallowRef<string[]> = shallowRef(blockedDomains)

const { result } = useQuery(settingsWorkspacesSecurityQuery, {
  slug: slug.value
})

const workspace = computed(() => result.value?.workspaceBySlug)
const workspaceDomains = computed(() => {
  return workspace.value?.domains || []
})
const hasWorkspaceDomains = computed(() => workspaceDomains.value.length > 0)
const verifiedUserDomains = computed(() => {
  const workspaceDomainSet = new Set(workspaceDomains.value.map((item) => item.domain))

  return [
    ...new Set(
      (result.value?.activeUser?.emails ?? [])
        .filter((email) => email.verified)
        .map((email) => email.email.split('@')[1])
        .filter((domain) => !workspaceDomainSet.has(domain))
    )
  ]
})

const isDomainProtectionEnabled = computed({
  get: () => workspace.value?.domainBasedMembershipProtectionEnabled || false,
  set: async (newVal) => {
    if (!workspace.value?.id) return

    const result = await updateDomainProtection({
      input: {
        id: workspace.value.id,
        domainBasedMembershipProtectionEnabled: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Workspace Domain Protection Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: workspace.value?.id
      })

      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Domain protection ${newVal ? 'enabled' : 'disabled'}`
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: getFirstErrorMessage(result?.errors)
      })
    }
  }
})

const isDomainDiscoverabilityEnabled = computed({
  get: () => workspace.value?.discoverabilityEnabled || false,
  set: async (newVal) => {
    if (!workspace.value?.id) return

    const result = await updateDiscoverability({
      input: {
        id: workspace.value.id,
        discoverabilityEnabled: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Workspace Discoverability Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: workspace.value?.id
      })

      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Discoverability ${newVal ? 'enabled' : 'disabled'}`
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: getFirstErrorMessage(result?.errors)
      })
    }
  }
})

const addDomain = async () => {
  if (!selectedDomain.value || !workspace.value) return
  await addWorkspaceDomain.mutate(
    {
      domain: selectedDomain.value,
      workspaceId: workspace.value.id
    },
    workspace.value.domains ?? [],
    workspace.value.discoverabilityEnabled,
    workspace.value.domainBasedMembershipProtectionEnabled,
    workspace.value.hasAccessToSSO
  )

  mixpanel.track('Workspace Domain Added', {
    // eslint-disable-next-line camelcase
    workspace_id: workspace.value?.id
  })
  selectedDomain.value = undefined
}

const openRemoveDialog = (
  domain: SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
) => {
  removeDialogDomain.value = domain
  showRemoveDomainDialog.value = true
}

const disabledItemPredicate = (item: string) => {
  return blockedDomainItems.value.includes(item)
}

watch(
  () => workspaceDomains.value,
  () => {
    if (!hasWorkspaceDomains.value) {
      isDomainDiscoverabilityEnabled.value = false
    }
  }
)
</script>
