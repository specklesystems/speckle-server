<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="md"
    title="Get your colleagues in!"
    :buttons="dialogButtons"
  >
    <form @submit="onSubmit">
      <div class="flex flex-col space-y-4 text-foreground">
        <p>
          Speckle will send a server invite link to the email(-s) below. You can also
          add a personal message if you want to. To add multiple e-mails, seperate them
          with commas.
        </p>
        <FormTextInput
          :custom-icon="EnvelopeIcon"
          name="emailsString"
          label="E-mail"
          placeholder="example@example.com, example2@example.com"
          :rules="[isRequired, isOneOrMultipleEmails]"
          :disabled="anyMutationsLoading"
        />
        <FormTextArea
          name="message"
          label="Message"
          :disabled="anyMutationsLoading"
          :rules="[isStringOfLength({ maxLength: 1024 })]"
          placeholder="Write an optional invitation message!"
        />
        <div
          class="grow flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center"
        >
          <div
            class="grow flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0"
          >
            <FormSelectProjects
              v-model="selectedProject"
              label="(Optional) Select project to invite to"
              class="w-full sm:w-60"
              owned-only
              show-label
            />
            <FormSelectServerRoles
              v-if="allowServerRoleSelect"
              v-model="serverRole"
              label="Select server role"
              show-label
              :allow-guest="isGuestMode"
              :allow-admin="isAdmin"
            />
          </div>
        </div>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { EnvelopeIcon } from '@heroicons/vue/24/solid'
import { Optional, Roles, ServerRoles } from '@speckle/shared'
import { useMutationLoading } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
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

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Send',
    props: {
      color: 'primary',
      fullWidth: true,
      outline: true,
      submit: true,
      disabled: anyMutationsLoading.value
    },
    onClick: onSubmit
  }
])
</script>
