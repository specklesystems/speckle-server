<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Get your colleagues in!</template>
    <form ref="formRef" class="flex flex-col gap-2" @submit="onSubmit">
      <div
        v-for="(user, index) in users"
        :key="index"
        class="flex gap-4 items-end text-foreground"
      >
        <div class="w-full">
          <!-- Email Input -->
          <FormTextInput
            v-model="user.email"
            :name="'email-' + index"
            label="E-mail"
            :show-label="index === 0"
            placeholder="example@example.com"
            :rules="[isRequired, isEmail]"
            :disabled="anyMutationsLoading"
            @input="handleInput(index)"
          />
        </div>

        <!-- Role Select -->
        <FormSelectServerRoles
          v-if="allowServerRoleSelect"
          v-model="user.role"
          label="Server role"
          :show-label="index === 0"
          fixed-height
          :allow-guest="isGuestMode"
          :allow-admin="isAdmin"
          mount-menu-on-body
        />

        <!-- Remove Row Button -->
        <FormButton
          v-if="users.length > 1"
          hide-text
          :icon-left="TrashIcon"
          color="invert"
          @click="removeUser(index)"
        >
          Remove Row
        </FormButton>
      </div>

      <div class="flex justify-end">
        <!-- Add Row Button -->
        <FormButton
          :icon-left="PlusIcon"
          color="invert"
          hide-text
          class="max-w-[100px]"
          @click="addUser"
        >
          Add Row
        </FormButton>
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { Optional } from '@speckle/shared'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useMutationLoading } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { isRequired, isEmail } from '~~/lib/common/helpers/validation'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useServerInfo } from '~~/lib/core/composables/server'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useInviteUserToServer } from '~~/lib/server/composables/invites'

const selectedProject = ref(undefined as Optional<FormSelectProjects_ProjectFragment>)
const users = ref([{ email: '', role: Roles.Server.User }])
const formRef: Ref<HTMLElement | null> = ref(null)

const { handleSubmit } = useForm<{ emailsString: string }>()
const { mutate: inviteUserToServer } = useInviteUserToServer()
const inviteUserToProject = useInviteUserToProject()
const anyMutationsLoading = useMutationLoading()
const { isAdmin } = useActiveUser()
const { isGuestMode } = useServerInfo()

const isOpen = defineModel<boolean>('open', { required: true })

const allowServerRoleSelect = computed(() => isAdmin.value || isGuestMode.value)

const mp = useMixpanel()
const onSubmit = handleSubmit(async () => {
  const project = selectedProject.value
  const success = project
    ? await inviteUserToProject(
        project.id,
        users.value.map((user) => ({
          email: user.email,
          serverRole: user.role
        }))
      )
    : await inviteUserToServer(
        users.value.map((user) => ({
          email: user.email,
          serverRole: user.role
        }))
      )
  if (success) {
    isOpen.value = false
    selectedProject.value = undefined
    mp.track('Invite Action', {
      type: 'server invite',
      name: 'send',
      multiple: users.value.length !== 1,
      count: users.value.length,
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

const addUser = () => {
  users.value.push({ email: '', role: users.value[0].role })
}

const removeUser = (index: number) => {
  users.value.splice(index, 1)
}

const focusLastEmailInput = () => {
  nextTick(() => {
    // Type guard for formRef.value
    if (formRef.value instanceof HTMLElement) {
      const lastEmailInput = formRef.value.querySelector(
        `input[name='email-${users.value.length - 1}']`
      ) as HTMLInputElement | null

      if (lastEmailInput) {
        lastEmailInput.focus()
      }
    }
  })
}

const handleInput = (index: number) => {
  const currentEmail = users.value[index].email
  if (currentEmail.includes(', ')) {
    const splitEmails = currentEmail.split(', ').map((e) => e.trim())
    // Update the current email to the first part before the comma
    users.value[index].email = splitEmails[0]
    // If there are additional parts, add them as new rows
    if (splitEmails.length > 1) {
      const additionalEmails = splitEmails.slice(1)
      additionalEmails.forEach((email) => {
        users.value.push({ email, role: users.value[index].role })
      })
      // Focus on the last email input
      focusLastEmailInput()
    }
  }
}
</script>
