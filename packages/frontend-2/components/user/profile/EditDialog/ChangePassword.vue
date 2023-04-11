<template>
  <LayoutDisclosure title="Change password" :icon="LockClosedIcon">
    <form class="flex flex-col space-y-4" @submit="onChange">
      <FormTextInput
        name="oldPassword"
        label="Old password"
        size="sm"
        full-width
        validate-on-value-update
        show-label
        type="password"
        :rules="[isRequired]"
      />
      <FormTextInput
        name="newPassword"
        label="New password"
        size="sm"
        full-width
        validate-on-value-update
        show-label
        type="password"
        :rules="[isRequired]"
      />
      <FormTextInput
        name="newPasswordRepeat"
        label="New password (repeated)"
        size="sm"
        full-width
        validate-on-value-update
        show-label
        type="password"
        :rules="[isRequired, isSameAs('newPassword', 'New password')]"
      />
      <div class="flex justify-end">
        <FormButton submit size="sm" :disabled="loading">Change</FormButton>
      </div>
    </form>
  </LayoutDisclosure>
</template>
<script setup lang="ts">
import { LockClosedIcon } from '@heroicons/vue/24/outline'
import { useForm } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import { isRequired, isSameAs } from '~~/lib/common/helpers/validation'
import { useChangePassword } from '~~/lib/user/composables/management'

graphql(`
  fragment UserProfileEditDialogDeleteAccount_User on User {
    id
    email
  }
`)

const { handleSubmit } = useForm<{
  oldPassword: string
  newPassword: string
  newPasswordRepeat: string
}>()
const { mutate, loading } = useChangePassword()

const onChange = handleSubmit(async (values) => {
  await mutate(values)
})
</script>
