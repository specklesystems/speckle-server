<template>
  <LayoutDisclosure title="Delete account" :icon="TrashIcon" color="danger">
    <form class="flex flex-col space-y-4" @submit="onDelete">
      <div>
        This action cannot be undone. We will delete all projects where you are the sole
        owner, and any associated data.
        <br />
        To delete your account, type in your
        <HelpText :text="emailPlaceholder">e-mail address</HelpText>
        and press the button.
      </div>
      <div class="flex space-x-2">
        <FormTextInput
          name="deleteEmail"
          label="Your e-mail address"
          size="sm"
          :placeholder="emailPlaceholder"
          full-width
          validate-on-mount
          validate-on-value-update
          hide-error-message
          :rules="[stringMatchesEmail]"
        />
        <FormButton
          color="danger"
          size="sm"
          submit
          :disabled="!!Object.values(errors).length || loading"
        >
          Delete
        </FormButton>
      </div>
    </form>
  </LayoutDisclosure>
</template>
<script setup lang="ts">
import { TrashIcon } from '@heroicons/vue/24/outline'
import { GenericValidateFunction, useForm } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import { UserProfileEditDialogDeleteAccount_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { useDeleteAccount } from '~~/lib/user/composables/management'

graphql(`
  fragment UserProfileEditDialogDeleteAccount_User on User {
    id
    email
  }
`)

const stringMatchesEmail: GenericValidateFunction<string> = (val: string) => {
  return (val || '').toLowerCase() === (props.user.email || '').toLowerCase()
    ? true
    : 'Value must match the email exactly'
}

const emit = defineEmits<{
  (e: 'deleted'): void
}>()

const props = defineProps<{
  user: UserProfileEditDialogDeleteAccount_UserFragment
}>()

const { handleSubmit, errors } = useForm<{ deleteEmail: string }>()
const { mutate, loading } = useDeleteAccount()

const emailPlaceholder = computed(() => props.user.email || 'example@example.com')

const onDelete = handleSubmit(async (values) => {
  const isDeleted = await mutate({
    email: values.deleteEmail
  })
  if (isDeleted) emit('deleted')
})
</script>
