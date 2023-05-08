<template>
  <div class="flex flex-col space-y-4">
    <div class="h4 font-bold flex items-center space-x-2">
      <InformationCircleIcon class="w-6 h-6" />
      <span>Bio</span>
    </div>
    <div class="flex flex-col space-y-4">
      <!-- <LazyUserAvatarEditor class="w-6/12 self-center" /> -->
      <UserAvatarEditable class="w-6/12 self-center" :user="user" />
      <FormTextInput
        v-model="name"
        label="Name"
        name="name"
        placeholder="John Doe"
        :custom-icon="UserIcon"
        show-label
        show-required
        :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
        @change="save"
      />
      <FormTextInput
        v-model="company"
        label="Company"
        name="company"
        placeholder="Example Ltd."
        :custom-icon="BriefcaseIcon"
        show-label
        :rules="[isStringOfLength({ maxLength: 512 })]"
        @change="save"
      />
      <FormTextArea
        v-model="bio"
        name="bio"
        label="Bio"
        show-label
        placeholder="Tell everyone a little bit about yourself!"
        :rules="[isStringOfLength({ maxLength: 2048 })]"
        @change="save"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { UserIcon, BriefcaseIcon } from '@heroicons/vue/24/solid'
import { debounce } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import {
  UserProfileEditDialogBio_UserFragment,
  UserUpdateInput
} from '~~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useUpdateUserProfile } from '~~/lib/user/composables/management'

graphql(`
  fragment UserProfileEditDialogBio_User on User {
    id
    name
    company
    bio
    ...UserAvatarEditable_User
  }
`)

const props = defineProps<{
  user: UserProfileEditDialogBio_UserFragment
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
