<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <form @submit="onSubmit">
      <div class="flex flex-col space-y-4 text-foreground">
        <h1 class="h4 font-bold">Send an invite</h1>
        <p>
          Speckle will send a server invite link to the email below. You can also add a
          personal message if you want to.
        </p>
        <FormTextInput
          type="email"
          name="email"
          label="E-mail"
          placeholder="example@example.com"
          :rules="[isRequired, isEmail, isStringOfLength({ maxLength: 256 })]"
          :disabled="anyMutationsLoading"
        />
        <FormTextArea
          name="message"
          label="Message"
          :disabled="anyMutationsLoading"
          :rules="[isStringOfLength({ maxLength: 1024 })]"
          placeholder="Write an optional invitation message!"
        />
        <div class="grow flex justify-end">
          <FormButton text @click="isOpen = false">Cancel</FormButton>
          <FormButton submit :disabled="anyMutationsLoading">Send</FormButton>
        </div>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useMutationLoading } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { isRequired, isEmail, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useInviteUserToServer } from '~~/lib/server/composables/invites'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const { handleSubmit } = useForm<{ message?: string; email: string }>()
const { mutate: inviteUser } = useInviteUserToServer()
const anyMutationsLoading = useMutationLoading()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const onSubmit = handleSubmit(async (values) => {
  const success = await inviteUser(values)
  if (success) {
    isOpen.value = false
  }
})
</script>
