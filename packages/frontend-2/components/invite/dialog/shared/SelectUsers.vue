<template>
  <LayoutDialog
    v-model:open="isOpen"
    :buttons="dialogButtons"
    max-width="md"
    @update:open="onUpdateOpen"
  >
    <template #header>
      Invite to
      <span class="capitalize">{{ inviteTarget }}</span>
    </template>
    <slot name="top" />
    <form @submit="onSubmit">
      <div class="flex flex-col gap-y-3 text-foreground">
        <div v-for="(item, index) in fields" :key="item.key" class="flex gap-x-3">
          <div class="flex flex-col gap-y-3 flex-1">
            <div class="flex flex-row gap-x-3">
              <div class="flex-1">
                <FormTextInput
                  v-model="item.value.email"
                  :name="`email-${item.key}`"
                  color="foundation"
                  placeholder="Email address"
                  show-clear
                  full-width
                  use-label-in-errors
                  :show-label="index === 0"
                  label="Email"
                  :rules="[
                    isEmailOrEmpty,
                    canHaveRole({
                      allowedDomains: props.allowedDomains,
                      workspaceRole: item.value.workspaceRole,
                      projectRole: item.value.projectRole
                    })
                  ]"
                  :help="
                    item.value.matchesDomainPolicy === false
                      ? 'This email does not match the set domain policy, and can only be invited as a guest'
                      : undefined
                  "
                />
              </div>
              <FormSelectWorkspaceRoles
                v-if="props.inviteTarget === 'workspace'"
                v-model="item.value.workspaceRole"
                label="Select role"
                :name="`fields.${index}.workspaceRole`"
                class="sm:w-44"
                mount-menu-on-body
                :allow-unset="false"
                :show-label="index === 0"
                :disabled-items="getDisabledWorkspaceItems(item.value.email)"
                disabled-item-tooltip="This email does not match the set domain policy, and can only be invited as a guest"
                :rules="[isRequiredIfDependencyExists(() => item.value.email)]"
              />
              <FormSelectProjectRoles
                v-if="props.inviteTarget === 'project'"
                v-model="item.value.projectRole"
                label="Select role"
                :name="`fields.${index}.projectRole`"
                class="sm:w-44"
                mount-menu-on-body
                :allow-unset="false"
                :show-label="index === 0"
                :disabled-items="getDisabledProjectItems(item.value.email)"
                disabled-item-tooltip="This email does not match the set domain policy, and can only be invited as a reviewer"
                :rules="[isRequiredIfDependencyExists(() => item.value.email)]"
              />
            </div>
          </div>
          <div class="relative w-4">
            <CommonTextLink
              v-if="fields.length > 1"
              class="absolute right-0"
              :class="{ 'top-7': index === 0 }"
              @click="removeInviteItem(index)"
            >
              <TrashIcon class="h-4 w-4 text-foreground-2" />
            </CommonTextLink>
          </div>
        </div>
        <FormButton color="subtle" :icon-left="PlusIcon" @click="addInviteItem">
          Add another user
        </FormButton>

        <div v-if="showBillingInfo" class="text-body-2xs text-foreground-2 leading-5">
          <p>
            Inviting users may add seats to your current billing cycle. If there are
            available seats, they will be used first. Your workspace is currently billed
            for X.
          </p>
        </div>
        <slot />
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm, useFieldArray } from 'vee-validate'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { InviteGenericForm, InviteGenericItem } from '~~/lib/invites/helpers/types'
import { emptyInviteGenericItem } from '~~/lib/invites/helpers/constants'
import { isEmailOrEmpty } from '~~/lib/common/helpers/validation'
import {
  Roles,
  type WorkspaceRoles,
  type StreamRoles,
  type MaybeNullOrUndefined
} from '@speckle/shared'
import {
  canHaveRole,
  matchesDomainPolicy,
  isRequiredIfDependencyExists
} from '~/lib/invites/helpers/validation'

const emit = defineEmits<{
  (e: 'onSubmit', v: InviteGenericItem[]): void
  (e: 'onCancel'): void
}>()

const props = defineProps<{
  invites: InviteGenericItem[]
  allowedDomains?: MaybeNullOrUndefined<string[]>
  inviteTarget: 'workspace' | 'project'
  showBillingInfo?: boolean
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { handleSubmit } = useForm<InviteGenericForm>({
  initialValues: {
    fields: [...props.invites]
  }
})
const {
  fields,
  replace: replaceFields,
  push: pushInvite,
  remove: removeInvite
} = useFieldArray<InviteGenericItem>('fields')

const enableNextButton = computed(() => {
  return fields.value.some((item) => item.value.email)
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => onUpdateOpen(false)
  },
  {
    text: 'Invite',
    props: {
      submit: true,
      disabled: !enableNextButton.value
    },
    onClick: onSubmit
  }
])

const onUpdateOpen = (open: boolean) => {
  if (!open) {
    isOpen.value = false
    emit('onCancel')
  }
}

const addInviteItem = () => {
  pushInvite({
    ...emptyInviteGenericItem,
    ...(props.inviteTarget === 'workspace'
      ? { workspaceRole: Roles.Workspace.Member }
      : { projectRole: Roles.Stream.Contributor })
  })
}

const removeInviteItem = (index: number) => {
  removeInvite(index)
}

const getDisabledWorkspaceItems = (email: string): WorkspaceRoles[] => {
  return !matchesDomainPolicy(email, props.allowedDomains)
    ? [Roles.Workspace.Admin, Roles.Workspace.Member]
    : []
}

const getDisabledProjectItems = (email: string): StreamRoles[] => {
  return !matchesDomainPolicy(email, props.allowedDomains) ? [Roles.Stream.Owner] : []
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
