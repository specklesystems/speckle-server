<!-- TODO: Check how domain policy interacts with this -->
<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ dialogTitle }}</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard class="bg-foundation-2 !py-4 text-body-2xs">
        <div class="flex flex-row gap-x-2 items-center">
          <UserAvatar
            hide-tooltip
            :user="user"
            light-style
            class="bg-foundation"
            no-bg
          />
          {{ user.name }}
        </div>
      </CommonCard>

      <p>{{ mainMessage }}</p>

      <p v-if="showRoleInfo" class="text-foreground-2 text-body-2xs">
        {{ roleInfoMessage }}
      </p>
      <div v-if="showEditorSeatsInfo" class="text-body-2xs text-foreground-2 leading-5">
        {{ editorSeatsMessage }}
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { UserUpdateActionTypes } from '~/lib/settings/helpers/types'

const DIALOG_SCENARIOS = {
  [UserUpdateActionTypes.MakeAdmin]: {
    title: 'Make an admin?',
    mainMessage: (seatType: string) =>
      seatType === 'editor'
        ? 'They will become project owner for all existing and new workspace projects.'
        : 'They will be given an editor seat and become project owner for all existing and new workspace projects.',
    roleInfo:
      'Admins can edit workspaces, including settings, members and all projects. More about workspace roles.',
    buttonText: 'Make an admin',
    showRoleInfo: true,
    showEditorSeatsInfo: (seatType: string) => seatType === 'viewer'
  },
  [UserUpdateActionTypes.MakeGuest]: {
    title: 'Make a guest?',
    mainMessage: 'They will lose access to all existing workspace projects.',
    roleInfo:
      "Guest can contribute to projects they're invited to. More about workspace roles.",
    buttonText: 'Make a guest',
    showRoleInfo: true,
    showEditorSeatsInfo: () => false
  },
  [UserUpdateActionTypes.UpgradeEditor]: {
    title: 'Upgrade to an editor seat?',
    mainMessage: 'An editor seat will allow them to create new models and versions.',
    roleInfo: '',
    buttonText: 'Upgrade to editor',
    showRoleInfo: false,
    showEditorSeatsInfo: () => true
  },
  [UserUpdateActionTypes.DowngradeEditor]: {
    title: 'Downgrade to a viewer seat?',
    mainMessage:
      'A viewer seat will allow them to view and receive model, but not send to it.',
    roleInfo: '',
    buttonText: 'Downgrade to viewer',
    showRoleInfo: false,
    showEditorSeatsInfo: () => true
  },
  [UserUpdateActionTypes.RemoveMember]: {
    title: 'Remove from workspace?',
    mainMessage: 'They will lose access to all existing workspace projects.',
    roleInfo: '',
    buttonText: 'Remove from workspace',
    showRoleInfo: false,
    showEditorSeatsInfo: (seatType: string) => seatType === 'editor'
  }
} as const

const props = defineProps<{
  user: UserItem
  type?: UserUpdateActionTypes
}>()

const emit = defineEmits<{
  (e: 'makeAdmin'): void
  (e: 'makeGuest'): void
  (e: 'upgradeEditor'): void
  (e: 'downgradeEditor'): void
  (e: 'removeUser'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const scenario = computed(() => (props.type ? DIALOG_SCENARIOS[props.type] : null))

const dialogTitle = computed(() => scenario.value?.title ?? '')
const mainMessage = computed(() =>
  typeof scenario.value?.mainMessage === 'function'
    ? scenario.value.mainMessage(props.user.seatType)
    : scenario.value?.mainMessage ?? ''
)
const roleInfoMessage = computed(() => scenario.value?.roleInfo ?? '')
const showRoleInfo = computed(() => scenario.value?.showRoleInfo ?? false)
const showEditorSeatsInfo = computed(() =>
  typeof scenario.value?.showEditorSeatsInfo === 'function'
    ? scenario.value.showEditorSeatsInfo(props.user.seatType)
    : scenario.value?.showEditorSeatsInfo ?? false
)
const buttonText = computed(() => scenario.value?.buttonText ?? '')

const editorSeatsMessage = computed(() => {
  // TODO: Replace with actual editor seats once backend adds support
  const editor = 0
  const editorLimit = 5
  return `After this, ${
    editor + 1
  } of ${editorLimit} editor seats included in your plan will be used.`
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: buttonText.value,
    props: {
      color: 'primary'
    },
    onClick: () => {
      open.value = false
      switch (props.type) {
        case UserUpdateActionTypes.MakeAdmin:
          emit('makeAdmin')
          break
        case UserUpdateActionTypes.MakeGuest:
          emit('makeGuest')
          break
        case UserUpdateActionTypes.UpgradeEditor:
          emit('upgradeEditor')
          break
        case UserUpdateActionTypes.DowngradeEditor:
          emit('downgradeEditor')
          break
      }
    }
  }
])
</script>
