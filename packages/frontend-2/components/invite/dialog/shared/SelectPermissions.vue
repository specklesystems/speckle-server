<template>
  <LayoutDialog
    v-model:open="isOpen"
    :buttons="dialogButtons"
    max-width="md"
    @update:open="onUpdateOpen"
  >
    <template #header>
      <span class="capitalize">{{ inviteTarget }}</span>
      permissions
    </template>
    <form class="flex flex-col gap-y-4 text-foreground" @submit="onSubmit">
      <p class="text-body-xs text-foreground-2">
        Some of the people you've invited will be added to the {{ inviteTarget }}. You
        can update their {{ inviteTarget }} permissions now or later in the settings.
      </p>
      <ul class="flex flex-col">
        <li
          v-for="(item, index) in fields"
          :key="item.key"
          class="border-outline-2 border-x border-b first:border-t first:rounded-t-lg last:rounded-b-lg p-3 pl-5 border-b-outline-3 last:border-b-outline-2 flex items-center"
        >
          <div class="flex-1">
            {{ item.value.email }}
          </div>
          <FormSelectWorkspaceRoles
            v-if="props.inviteTarget === 'workspace'"
            v-model="item.value.workspaceRole"
            label="Select role"
            :name="`fields.${index}.workspaceRole`"
            class="sm:w-44"
            mount-menu-on-body
            :allow-unset="false"
            :disabled="!getMatchesDomainPolicy(item.value.email)"
          />
          <FormSelectServerRoles
            v-if="props.inviteTarget === 'server'"
            v-model="item.value.serverRole"
            :name="`fields.${index}.serverRole`"
            :allow-guest="isGuestMode"
            :allow-admin="isAdmin"
            class="sm:w-44"
            mount-menu-on-body
            :allow-unset="false"
            :rules="[
              canBeServerGuest({
                workspaceRole: item.value.workspaceRole,
                projectRole: item.value.projectRole
              })
            ]"
          />
        </li>
      </ul>
      <slot />
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm, useFieldArray } from 'vee-validate'
import type { InviteGenericForm, InviteGenericItem } from '~~/lib/invites/helpers/types'
import { type MaybeNullOrUndefined } from '@speckle/shared'
import { matchesDomainPolicy, canBeServerGuest } from '~/lib/invites/helpers/validation'
import { useServerInfo } from '~~/lib/core/composables/server'

const emit = defineEmits<{
  (e: 'onSubmit', v: InviteGenericItem[]): void
  (e: 'onBack'): void
}>()

const props = defineProps<{
  invites: InviteGenericItem[]
  allowedDomains?: MaybeNullOrUndefined<string[]>
  inviteTarget: 'workspace' | 'server'
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { isGuestMode } = useServerInfo()
const { isAdmin } = useActiveUser()
const { handleSubmit } = useForm<InviteGenericForm>({
  initialValues: {
    fields: [...props.invites]
  }
})
const { fields, replace: replaceFields } = useFieldArray<InviteGenericItem>('fields')

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Back',
    props: { color: 'outline' },
    onClick: () => onUpdateOpen(false)
  },
  {
    text: 'Invite',
    props: {
      submit: true
    },
    onClick: onSubmit
  }
])

const getMatchesDomainPolicy = (email: string): boolean => {
  return matchesDomainPolicy(email, props.allowedDomains)
}

const onUpdateOpen = (open: boolean) => {
  if (!open) {
    isOpen.value = false
    emit('onBack')
  }
}

const onSubmit = handleSubmit(() => {
  const invites = fields.value
    .filter((invite) => invite.value.email)
    .map((invite) => invite.value)

  emit('onSubmit', invites)

  isOpen.value = false
})

watch(isOpen, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    replaceFields([...props.invites])
  }
})
</script>
