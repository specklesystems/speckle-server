<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Get your colleagues in!</template>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-y-3 text-foreground mb-4">
        <p class="text-body-xs">
          Speckle will send a server invite link to the email(-s) below. You can also
          add a personal message if you want to. To add multiple e-mails, seperate them
          with commas.
        </p>
        <FormTextInput
          name="emailsString"
          color="foundation"
          label="E-mail"
          show-label
          placeholder="example@example.com, example2@example.com"
          :rules="[isRequired, isOneOrMultipleEmails]"
          :disabled="anyMutationsLoading"
        />
        <FormSelectServerRoles
          v-if="allowServerRoleSelect"
          v-model="serverRole"
          label="Select server role"
          class="w-full sm:w-60"
          show-label
          :allow-guest="isGuestMode"
          :allow-admin="isAdmin"
          mount-menu-on-body
        />
        <FormTextArea
          name="message"
          show-optional
          show-label
          label="Message"
          color="foundation"
          :disabled="anyMutationsLoading"
          :rules="[isStringOfLength({ maxLength: 1024 })]"
          placeholder="Write an optional invitation message!"
        />
        <FormSelectProjects
          v-model="selectedProject"
          label="Select project to invite to"
          class="w-full sm:w-60"
          owned-only
          show-optional
          mount-menu-on-body
          show-label
        />
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { Optional, ServerRoles } from '@speckle/shared'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import {
  isRequired,
  isOneOrMultipleEmails,
  isStringOfLength
} from '~~/lib/common/helpers/validation'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useServerInfo } from '~~/lib/core/composables/server'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useInviteUserToServer } from '~~/lib/server/composables/invites'

const selectedProject = ref(undefined as Optional<FormSelectProjects_ProjectFragment>)
const serverRole = ref<ServerRoles>(Roles.Server.User)

const { handleSubmit } = useForm<{ message?: string; emailsString: string }>()
const { mutate: inviteUserToServer } = useInviteUserToServer()
const inviteUserToProject = useInviteUserToProject()
const anyMutationsLoading = useMutationLoading()
const { isAdmin } = useActiveUser()
const { isGuestMode } = useServerInfo()

const isOpen = defineModel<boolean>('open', { required: true })

const allowServerRoleSelect = computed(() => isAdmin.value || isGuestMode.value)

const mp = useMixpanel()
const onSubmit = handleSubmit(async (values) => {
  const emails = values.emailsString.split(',').map((i) => i.trim())
  const project = selectedProject.value

  const success = project
    ? await inviteUserToProject(
        project.id,
        emails.map((email) => ({
          email,
          serverRole: allowServerRoleSelect.value ? serverRole.value : undefined
        }))
      )
    : await inviteUserToServer(
        emails.map((email) => ({
          email,
          message: values.message,
          serverRole: allowServerRoleSelect.value ? serverRole.value : undefined
        }))
      )
  if (success) {
    isOpen.value = false
    selectedProject.value = undefined
    mp.track('Invite Action', {
      type: 'server invite',
      name: 'send',
      multiple: emails.length !== 1,
      count: emails.length,
      hasProject: !!project,
      to: 'email'
    })
  }
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Send',
    props: {
      submit: true,
      disabled: anyMutationsLoading.value
    },
    onClick: onSubmit
  }
])
</script>
