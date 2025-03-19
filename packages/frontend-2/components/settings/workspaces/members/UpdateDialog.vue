<!-- TODO: Check how domain policy interacts with this -->
<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard size="sm" class="bg-foundation-2 text-body-2xs">
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

      <p v-if="roleInfo" class="text-foreground-2 text-body-2xs">
        {{ roleInfo }}. More about
        <NuxtLink
          :to="LearnMoreRolesSeatsUrl"
          target="_blank"
          class="text-foreground-2 underline"
        >
          workspace roles.
        </NuxtLink>
      </p>
      <div v-if="seatCountMessage" class="text-body-2xs text-foreground-2 leading-5">
        {{ editorSeatsMessage }}
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { LearnMoreRolesSeatsUrl } from '~/lib/settings/helpers/constants'

const props = defineProps<{
  user: UserItem
  title: string
  mainMessage: string
  roleInfo?: string
  seatCountMessage?: boolean
  buttonText: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const open = defineModel<boolean>('open', { required: true })

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
    text: props.buttonText,
    props: {
      color: 'primary'
    },
    onClick: () => {
      open.value = false
      emit('confirm')
    }
  }
])
</script>
