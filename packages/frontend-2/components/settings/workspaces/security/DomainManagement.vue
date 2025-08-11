<template>
  <section class="py-8">
    <SettingsSectionHeader subheading title="Verified domains" />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      Connect verified domains to the workspace to enable security features below.
    </p>

    <div>
      <div class="border border-outline-2 rounded-lg">
        <ul v-if="workspaceDomains.length > 0" class="divide-y divide-outline-3">
          <li
            v-for="domain in workspaceDomains"
            :key="domain.id"
            class="px-6 py-3 flex items-center"
          >
            <p class="text-body-xs font-medium flex-1">@{{ domain.domain }}</p>
            <div
              v-tippy="!isWorkspaceAdmin ? 'You must be a workspace admin' : undefined"
            >
              <FormButton
                :disabled="!isWorkspaceAdmin"
                color="outline"
                size="sm"
                @click="handleRemoveDomain(domain)"
              >
                Delete
              </FormButton>
            </div>
          </li>
        </ul>

        <p
          v-else
          class="text-body-2xs text-center text-foreground-2 px-6 py-6 rounded-lg"
        >
          No domains connected yet
        </p>
        <div
          class="flex justify-between items-center gap-8 border-t border-outline-2 rounded-b-lg px-6 py-3"
        >
          <div class="flex items-center gap-1">
            <p class="text-body-2xs text-foreground-2">Connect a verified domain</p>
            <Info
              v-tippy="
                'To connect a domain, you first need to verify an email address with that domain in your personal account settings. For example, if you verify example@company.com, you can then connect the company.com domain here.'
              "
              :size="LucideSize.base"
              :stroke-width="1.5"
              :absolute-stroke-width="true"
              class="text-foreground-disabled"
            />
          </div>

          <div class="flex gap-1 min-w-[210px]">
            <div
              v-tippy="!isWorkspaceAdmin ? 'You must be a workspace admin' : undefined"
              class="w-full"
            >
              <FormSelectBase
                v-model="selectedDomain"
                :items="verifiedUserDomains"
                :disabled="!isWorkspaceAdmin"
                :disabled-item-predicate="disabledItemPredicate"
                disabled-item-tooltip="This domain can't be used for verified workspace domains"
                name="workspaceDomains"
                label="Verified domains"
                class="w-full"
                size="sm"
              >
                <template #nothing-selected>Select domain</template>
                <template #something-selected="{ value }">@{{ value }}</template>
                <template #option="{ item }">
                  <div class="flex items-center">@{{ item }}</div>
                </template>
              </FormSelectBase>
            </div>
            <FormButton
              :disabled="!selectedDomain"
              size="sm"
              color="outline"
              @click="handleAddDomain"
            >
              Add
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { ShallowRef } from 'vue'
import { blockedDomains, Roles } from '@speckle/shared'
import { useVerifiedUserEmailDomains } from '~/lib/workspaces/composables/security'
import { Info } from 'lucide-vue-next'
import { useAddWorkspaceDomain } from '~/lib/settings/composables/management'
import { settingsDeleteWorkspaceDomainMutation } from '~/lib/settings/graphql/mutations'
import type { SettingsWorkspacesSecurityDomainManagement_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsWorkspacesSecurityDomainManagement_Workspace on Workspace {
    id
    role
    discoverabilityEnabled
    domainBasedMembershipProtectionEnabled
    hasAccessToDomainBasedSecurityPolicies: hasAccessToFeature(
      featureName: domainBasedSecurityPolicies
    )
    hasAccessToSSO: hasAccessToFeature(featureName: oidcSso)
    domains {
      id
      domain
    }
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesSecurityDomainManagement_WorkspaceFragment
}>()

const { mutate: deleteDomain } = useMutation(settingsDeleteWorkspaceDomainMutation)
const addWorkspaceDomain = useAddWorkspaceDomain()
const { domains: userEmailDomains } = useVerifiedUserEmailDomains({
  filterBlocked: false
})
const { triggerNotification } = useGlobalToast()

const selectedDomain = ref<string>()
const blockedDomainItems: ShallowRef<string[]> = shallowRef(blockedDomains)

const workspaceDomains = computed(() => props.workspace?.domains || [])
const isWorkspaceAdmin = computed(() => props.workspace.role === Roles.Workspace.Admin)

const verifiedUserDomains = computed(() => {
  const workspaceDomainSet = new Set(workspaceDomains.value.map((item) => item.domain))

  return [
    ...new Set(
      userEmailDomains.value.filter((domain) => !workspaceDomainSet.has(domain))
    )
  ]
})

const disabledItemPredicate = (item: string) => {
  return blockedDomainItems.value.includes(item)
}

const handleAddDomain = async () => {
  if (!selectedDomain.value || !props.workspace?.id) return

  await addWorkspaceDomain.mutate({
    domain: selectedDomain.value,
    workspaceId: props.workspace.id
  })

  selectedDomain.value = undefined
}

const handleRemoveDomain = async (domain: { id: string; domain: string }) => {
  if (!props.workspace?.id) return

  const result = await deleteDomain({
    input: {
      workspaceId: props.workspace.id,
      id: domain.id
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Domain removed',
      description: `Successfully removed @${domain.domain} from workspace`
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to remove domain',
      description: 'Please try again later'
    })
  }
}
</script>
