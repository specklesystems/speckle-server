<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Invite to server</template>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-y-5 text-foreground mb-4">
        <div v-for="(item, index) in fields" :key="item.key" class="flex gap-x-3">
          <div class="flex flex-col gap-y-3 flex-1">
            <hr v-if="index !== 0" class="border-outline-3" />
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
                  show-label
                  label="Email"
                  :rules="[isEmail]"
                />
              </div>
              <FormSelectServerRoles
                v-if="allowServerRoleSelect"
                v-model="item.value.serverRole"
                label="Select role"
                class="sm:w-48"
                show-label
                :disabled="anyMutationsLoading"
                :allow-guest="isGuestMode"
                :allow-admin="isAdmin"
                mount-menu-on-body
              />
            </div>
            <FormSelectProjects
              v-model="item.value.project"
              label="Select project"
              class="w-full"
              owned-only
              show-optional
              mount-menu-on-body
              show-label
              :name="`project-${index}`"
            />
          </div>
          <div class="relative w-4">
            <CommonTextLink
              v-if="fields.length > 1"
              class="top-10 absolute right-0"
              :class="{ 'top-7': index === 0 }"
              @click="removeInviteItem(index)"
            >
              <TrashIcon class="h-4 w-4 text-foreground-2" />
            </CommonTextLink>
          </div>
        </div>
        <FormButton
          color="subtle"
          :icon-left="PlusIcon"
          :disabled="anyMutationsLoading"
          @click="addInviteItem"
        >
          Invite another user
        </FormButton>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { useForm, useFieldArray } from 'vee-validate'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useServerInfo } from '~~/lib/core/composables/server'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useInviteUserToServer } from '~~/lib/server/composables/invites'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { InviteServerForm, InviteServerItem } from '~~/lib/invites/helpers/types'
import { emptyInviteServerItem } from '~~/lib/invites/helpers/constants'
import { isEmail } from '~~/lib/common/helpers/validation'

const isOpen = defineModel<boolean>('open', { required: true })

const { handleSubmit } = useForm<InviteServerForm>({
  initialValues: {
    fields: [
      {
        ...emptyInviteServerItem
      }
    ]
  }
})
const {
  fields,
  replace: replaceFields,
  push: pushInvite,
  remove: removeInvite
} = useFieldArray<InviteServerItem>('fields')
const { mutate: inviteUserToServer } = useInviteUserToServer()
const inviteUserToProject = useInviteUserToProject()
const anyMutationsLoading = useMutationLoading()
const { isAdmin } = useActiveUser()
const { isGuestMode } = useServerInfo()
const mixpanel = useMixpanel()

const allowServerRoleSelect = computed(() => isAdmin.value || isGuestMode.value)
const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Invite',
    props: {
      submit: true,
      disabled: anyMutationsLoading.value
    },
    onClick: onSubmit
  }
])

const addInviteItem = () => {
  pushInvite({ ...emptyInviteServerItem })
}

const removeInviteItem = (index: number) => {
  removeInvite(index)
}

const onSubmit = handleSubmit(() => {
  fields.value.forEach(async (invite) => {
    invite.value.project
      ? await inviteUserToProject(invite.value.project.id, [
          {
            email: invite.value.email,
            serverRole: invite.value.serverRole
          }
        ])
      : await inviteUserToServer([
          {
            email: invite.value.email,
            serverRole: invite.value.serverRole
          }
        ])
  })

  mixpanel.track('Invite Action', {
    type: 'server invite',
    name: 'send',
    multiple: fields.value.length !== 1,
    count: fields.value.length,
    hasProject: !!fields.value.some((invite) => invite.value.project),
    to: 'email'
  })

  isOpen.value = false
})

watch(isOpen, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    replaceFields([
      {
        ...emptyInviteServerItem
      }
    ])
  }
})
</script>
