<template>
  <LayoutDialog v-model:open="open" max-width="xs" :buttons="dialogButtons">
    <template #header>Leave workspace?</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <p>
        You will no longer have access to projects in the
        <span class="font-medium">{{ workspace?.name }}</span>
        workspace.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import type { SettingsWorkspacesMembersTable_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { homeRoute } from '~/lib/common/helpers/route'

const props = defineProps<{
  workspace: MaybeNullOrUndefined<SettingsWorkspacesMembersTable_WorkspaceFragment>
  isOnlyAdmin: boolean
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const { activeUser } = useActiveUser()
const updateUserRole = useWorkspaceUpdateRole()
const { mutateActiveWorkspaceSlug } = useNavigation()
const router = useRouter()

const handleConfirm = async () => {
  if (!props.workspace?.id || !activeUser.value?.id) return

  await updateUserRole({
    userId: activeUser.value.id,
    role: null,
    workspaceId: props.workspace.id
  })

  mutateActiveWorkspaceSlug(null)
  router.push(homeRoute)
  open.value = false
  emit('success')
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: 'Leave',
    onClick: handleConfirm
  }
])
</script>
