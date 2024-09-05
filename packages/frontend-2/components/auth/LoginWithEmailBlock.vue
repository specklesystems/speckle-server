<template>
  <form method="post" @submit="onSubmit">
    <div class="flex flex-col space-y-2">
      <FormTextInput
        type="email"
        name="email"
        label="E-mail"
        placeholder="Enter your email"
        size="lg"
        color="foundation"
        :rules="emailRules"
        show-label
        :disabled="!!(loading || shouldForceInviteEmail)"
        auto-focus
      />
      <FormTextInput
        type="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        color="foundation"
        size="lg"
        :rules="passwordRules"
        show-label
        :disabled="loading"
      />
    </div>
    <div class="mt-1">
      <CommonTextLink :to="forgottenPasswordRoute">
        Forgot your password?
      </CommonTextLink>
    </div>
    <FormButton
      size="lg"
      submit
      full-width
      class="mt-8 mb-4"
      :disabled="loading || !isMounted"
    >
      Log in
    </FormButton>
  </form>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { forgottenPasswordRoute } from '~~/lib/common/helpers/route'
import { useMounted } from '@vueuse/core'
import { graphql } from '~/lib/common/generated/gql'
import type { AuthLoginWithEmailBlock_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'

type FormValues = { email: string; password: string }

graphql(`
  fragment AuthLoginWithEmailBlock_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    email
    user {
      id
    }
  }
`)

const props = defineProps<{
  challenge: string
  workspaceInvite?: AuthLoginWithEmailBlock_PendingWorkspaceCollaboratorFragment
}>()

const { handleSubmit, setValues } = useForm<FormValues>()

const loading = ref(false)
const emailRules = [isEmail]
const passwordRules = [isRequired]

const isMounted = useMounted()
const { loginWithEmail } = useAuthManager()
const { triggerNotification } = useGlobalToast()

const inviteEmail = computed(() => props.workspaceInvite?.email)
const isInviteForExistingUser = computed(() => !!props.workspaceInvite?.user)
const shouldForceInviteEmail = computed(
  () => !!(inviteEmail.value && isInviteForExistingUser.value)
)

const onSubmit = handleSubmit(async ({ email, password }) => {
  try {
    loading.value = true
    await loginWithEmail({ email, password, challenge: props.challenge })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Login failed',
      description: `${ensureError(e).message}`
    })
  } finally {
    loading.value = false
  }
})

watch(
  shouldForceInviteEmail,
  (shouldForce) => {
    if (shouldForce) {
      setValues({ email: inviteEmail.value || '' })
    }
  },
  { immediate: true }
)
</script>
