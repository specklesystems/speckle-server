<template>
  <LayoutDialog v-model:open="isOpen" title="Delete account" max-width="md">
    <form class="flex flex-col gap-2" @submit="onDelete">
      <p class="text-body-xs font-medium mb-1">
        This action cannot be undone. We will delete all projects where you are the sole
        owner, and any associated data.
      </p>
      <p class="text-body-xs">
        To delete your account, type in your
        <HelpText :text="emailPlaceholder">e-mail address</HelpText>
        and press the Delete.
      </p>

      <div class="flex gap-2 mt-3 mb-6">
        <FormTextInput
          name="deleteEmail"
          label="Your e-mail address"
          :placeholder="emailPlaceholder"
          color="foundation"
          full-width
          validate-on-mount
          validate-on-value-update
          hide-error-message
          :rules="[stringMatchesEmail]"
        />
        <FormButton
          color="danger"
          submit
          :disabled="!!Object.values(errors).length || loading"
        >
          Delete
        </FormButton>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import type { GenericValidateFunction } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import type { SettingsUserProfileDeleteAccount_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { useDeleteAccount } from '~~/lib/user/composables/management'

graphql(`
  fragment SettingsUserProfileDeleteAccount_User on User {
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
  user: SettingsUserProfileDeleteAccount_UserFragment
}>()

const isOpen = defineModel<boolean>('open', { required: true })

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
