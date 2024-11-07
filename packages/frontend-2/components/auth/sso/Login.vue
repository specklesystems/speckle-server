<template>
  <form method="post" @submit="onSubmit">
    <div class="flex flex-col gap-4">
      <h1 class="text-heading-xl text-center mb-8">Speckle SSO login</h1>

      <!-- Email Input -->
      <FormTextInput
        v-model:model-value="email"
        type="email"
        name="email"
        label="Your work email"
        placeholder="Enter your email"
        size="lg"
        color="foundation"
        :rules="[isEmail, isRequired]"
        show-label
        :disabled="loading"
        auto-focus
        @update:model-value="onEmailChange"
      />

      <!-- Workspace Selector -->
      <FormSelectBase
        v-if="availableWorkspaces.length > 1"
        v-model="selectedWorkspace"
        name="workspace"
        :multiple="false"
        label="Select workspace"
        button-style="tinted"
        :items="availableWorkspaces"
        :disabled="loading"
        placeholder="Choose a workspace"
        help="You may need to authenticate separately for each workspace you want to access."
        show-label
      >
        <template #option="{ item }">
          <div class="flex items-center gap-2">
            <NuxtImg v-if="item.logo" :src="item.logo" class="h-6 w-6 rounded-full" />
            <span>{{ item.name }}</span>
          </div>
        </template>
        <template #something-selected="{ value }">
          <div v-if="isWorkspace(value)" class="flex items-center gap-2">
            <NuxtImg v-if="value.logo" :src="value.logo" class="h-6 w-6 rounded-full" />
            <span>{{ value.name }}</span>
          </div>
        </template>
      </FormSelectBase>
    </div>

    <!-- Buttons -->
    <div class="mt-8 space-y-4">
      <FormButton
        size="lg"
        submit
        full-width
        :disabled="loading || !isValid || !selectedWorkspace"
      >
        {{ buttonText }}
      </FormButton>
      <FormButton size="lg" color="subtle" full-width :to="loginRoute">
        Back to login
      </FormButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~/lib/common/helpers/validation'
import { loginRoute } from '~/lib/common/helpers/route'
import { useQuery } from '@vue/apollo-composable'
import { workspaceSsoByEmailQuery } from '~/lib/workspaces/graphql/queries'
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'
import { debounce } from 'lodash'
import type { WorkspaceSsoByEmailQuery } from '~/lib/common/generated/gql/graphql'

type Workspace = WorkspaceSsoByEmailQuery['workspaceSsoByEmail'][number]

const loading = ref(false)
const email = ref('')
const debouncedEmail = ref('')
const selectedWorkspace = ref<WorkspaceSsoByEmailQuery['workspaceSsoByEmail'][number]>()

const { meta, handleSubmit } = useForm()
const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()
const logger = useLogger()

// Query available workspaces when email changes
const { loading: isChecking, result } = useQuery(
  workspaceSsoByEmailQuery,
  () => ({ email: debouncedEmail.value }),
  () => ({ enabled: !!debouncedEmail.value })
)

const availableWorkspaces = computed(() => result.value?.workspaceSsoByEmail || [])
const isValid = computed(() => meta.value.valid && availableWorkspaces.value.length > 0)

const buttonText = computed(() => {
  if (isChecking.value) return 'Checking...'
  if (!isValid.value) return 'Single Sign-On'
  return selectedWorkspace.value
    ? `Sign in to ${selectedWorkspace.value.name}`
    : 'Sign in'
})

function isWorkspace(value: unknown): value is Workspace {
  return (
    value !== null && typeof value === 'object' && 'name' in value && 'slug' in value
  )
}

// Handlers
const onEmailChange = (value: string) => {
  email.value = value
  updateDebouncedEmail(value)
}

const onSubmit = handleSubmit(() => {
  if (!selectedWorkspace.value?.slug) return
  loading.value = true

  try {
    signInOrSignUpWithSso({
      challenge: challenge.value,
      workspaceSlug: selectedWorkspace.value.slug
    })
  } catch (error) {
    logger.error('SSO login failed:', error)
  } finally {
    loading.value = false
  }
})

const updateDebouncedEmail = debounce((value: string) => {
  debouncedEmail.value = value
}, 800)

// Watch for available workspaces and auto-select if only one
watch(
  availableWorkspaces,
  (workspaces) => {
    if (workspaces.length === 1) {
      selectedWorkspace.value = workspaces[0]
    }
  },
  { immediate: true }
)
</script>
