<template>
  <div class="flex flex-col gap-y-4">
    <SettingsSectionHeader title="Your details" subheading />
    <div class="grid md:grid-cols-2 pt-4">
      <div class="flex h-full items-center justify-center">
        <SettingsUserProfileEditAvatar :user="user" size="xxl" />
      </div>
      <div class="pt-6 md:pt-0">
        <FormTextInput
          v-model="name"
          class="pt-2 pb-1"
          color="foundation"
          label="Name"
          name="name"
          placeholder="John Doe"
          show-label
          :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
          @change="save"
        />
        <hr class="mt-4 mb-2" />
        <FormTextInput
          v-model="company"
          color="foundation"
          label="Company"
          name="company"
          placeholder="Example Ltd."
          show-label
          :rules="[isStringOfLength({ maxLength: 512 })]"
          @change="save"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { debounce } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import type { User, UserUpdateInput } from '~~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useUpdateUserProfile } from '~~/lib/user/composables/management'

graphql(`
  fragment UserProfileEditDialogBio_User on User {
    id
    name
    company
    bio
    ...UserProfileEditDialogAvatar_User
  }
`)

const props = defineProps<{
  user: User
}>()

const { mutate } = useUpdateUserProfile()

const name = ref('')
const company = ref('')
const bio = ref('')

const save = async () => {
  debouncedSave.cancel()
  const input: UserUpdateInput = {}
  if (name.value !== props.user.name) input.name = name.value
  if (company.value !== props.user.company) input.company = company.value
  if (bio.value !== props.user.bio) input.bio = bio.value
  if (!Object.values(input).length) return

  await mutate(input)
}
const debouncedSave = debounce(save, 1000)

watch(
  () => props.user,
  (user) => {
    name.value = user.name
    company.value = user.company || ''
    bio.value = user.bio || ''
  },
  { deep: true, immediate: true }
)

watch(() => [name.value, company.value, bio.value], debouncedSave)
</script>
