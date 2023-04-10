<template>
  <div class="flex flex-col space-y-4">
    <div class="h4 font-bold flex items-center space-x-2">
      <InformationCircleIcon class="w-6 h-6" />
      <span>Bio</span>
    </div>
    <div class="flex flex-col space-y-4">
      <FormTextInput
        v-model="name"
        label="Name"
        name="name"
        placeholder="John Doe"
        :custom-icon="UserIcon"
        show-label
        show-required
        :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
      />
      <FormTextInput
        v-model="company"
        label="Company"
        name="company"
        placeholder="Example Ltd."
        :custom-icon="BriefcaseIcon"
        show-label
        :rules="[isStringOfLength({ maxLength: 512 })]"
      />
      <FormTextArea
        name="bio"
        label="Bio"
        show-label
        placeholder="Tell everyone a little bit about yourself!"
        :rules="[isStringOfLength({ maxLength: 2048 })]"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { UserIcon, BriefcaseIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { UserProfileEditDialogBio_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'

graphql(`
  fragment UserProfileEditDialogBio_User on User {
    id
    name
    company
    bio
  }
`)

const props = defineProps<{
  user: UserProfileEditDialogBio_UserFragment
}>()

const name = ref('')
const company = ref('')
const bio = ref('')

watch(
  () => props.user,
  (user) => {
    name.value = user.name
    company.value = user.company || ''
    bio.value = user.bio || ''
  },
  { deep: true, immediate: true }
)
</script>
