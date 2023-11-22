<template>
  <LayoutDialogSection border-b title="Delete Account" title-color="danger">
    <template #icon>
      <TrashIcon class="h-full w-full" />
    </template>
    <form class="flex flex-col gap-2" @submit="onDelete">
      <div
        class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-4 bg-danger-lighter dark:bg-danger-darker rounded-md select-none mb-4"
      >
        <div>
          <ExclamationTriangleIcon class="mt-0.5 h-12 w-12 text-danger" />
        </div>
        <div>
          <p class="font-semibold text-danger-darker dark:text-danger-lighter">
            This action cannot be undone. We will delete all projects where you are the
            sole owner, and any associated data.
          </p>
          <p class="text-sm">
            To delete your account, type in your
            <HelpText :text="emailPlaceholder">e-mail address</HelpText>
            and press the button.
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <FormTextInput
          name="deleteEmail"
          label="Your e-mail address"
          :placeholder="emailPlaceholder"
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
  </LayoutDialogSection>
</template>
<script setup lang="ts">
import { LayoutDialogSection } from '@speckle/ui-components'
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
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
