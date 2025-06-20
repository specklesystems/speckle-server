<template>
  <section class="py-8">
    <SettingsSectionHeader title="Exclusive workspace" subheading />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      Control whether workspace members can create new workspaces.
    </p>

    <div class="flex flex-col space-y-6">
      <div class="flex items-center">
        <div class="flex-1 flex-col pr-6 gap-y-1">
          <p class="text-body-xs font-medium text-foreground">
            Restrict member workspace creation
          </p>
          <p class="text-body-2xs text-foreground-2 leading-5 max-w-md mt-1">
            Prevent workspace members from creating new workspaces. Admins and guests
            can still create workspaces.
          </p>
        </div>
        <div
          v-if="props.workspace?.hasAccessToExclusiveMembership"
          v-tippy="
            !canMakeWorkspaceExclusive.authorized
              ? canMakeWorkspaceExclusive.message
              : undefined
          "
        >
          <FormSwitch
            v-model="isExclusive"
            name="workspace-exclusive"
            :disabled="!canMakeWorkspaceExclusive.authorized"
            :show-label="false"
          />
        </div>
        <FormButton
          v-else
          to="mailto:billing@speckle.systems?subject=Workspace%20Creation%20Restriction"
          size="sm"
          color="outline"
        >
          Contact us
        </FormButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesSecurityWorkspaceCreation_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspaceUpdateExclusiveMutation } from '~/lib/workspaces/graphql/mutations'

graphql(`
  fragment SettingsWorkspacesSecurityWorkspaceCreation_Workspace on Workspace {
    id
    slug
    role
    isExclusive
    hasAccessToExclusiveMembership: hasAccessToFeature(featureName: exclusiveMembership)
    permissions {
      canMakeWorkspaceExclusive {
        authorized
        message
      }
    }
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesSecurityWorkspaceCreation_WorkspaceFragment
}>()

const mixpanel = useMixpanel()
const { mutate: updateExclusive } = useMutation(workspaceUpdateExclusiveMutation)
const { triggerNotification } = useGlobalToast()

const canMakeWorkspaceExclusive = computed(
  () => props.workspace?.permissions?.canMakeWorkspaceExclusive
)

const isExclusive = computed({
  get: () => props.workspace?.isExclusive || false,
  set: async (newVal) => {
    if (!props.workspace?.id) return

    const result = await updateExclusive({
      input: {
        id: props.workspace.id,
        isExclusive: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace creation restriction updated',
        description: `Member workspace creation has been ${
          newVal ? 'restricted' : 'allowed'
        }`
      })
      mixpanel.track('Workspace Creation Restriction Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace?.id
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update workspace creation restriction'
      })
    }
  }
})
</script>
