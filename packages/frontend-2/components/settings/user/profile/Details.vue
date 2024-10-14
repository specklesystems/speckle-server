<template>
  <div class="flex flex-col gap-y-4">
    <SettingsSectionHeader title="Your details" subheading />
    <FormTextInput
      v-model="name"
      color="foundation"
      label="Name"
      name="name"
      placeholder="John Doe"
      show-label
      label-position="left"
      :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
      @change="save()"
    />
    <FormTextInput
      v-model="company"
      color="foundation"
      label="Company"
      name="company"
      placeholder="Example Ltd."
      show-label
      label-position="left"
      :rules="[isStringOfLength({ maxLength: 512 })]"
      @change="save()"
    />
    <hr class="border-outline-2 my-3" />
    <div class="grid md:grid-cols-2">
      <div class="flex flex-col">
        <span class="text-body-xs font-medium text-foreground">Avatar</span>
        <span class="text-body-2xs text-foreground-2 max-w-[230px]">
          Upload your profile avatar image or use your initials.
        </span>
      </div>
      <div class="flex items-center justify-center">
        <SettingsUserProfileEditAvatar :user="user" size="xxl" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { debounce } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  SettingsUserProfileDetails_UserFragment,
  UserUpdateInput
} from '~~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useUpdateUserProfile } from '~~/lib/user/composables/management'

graphql(`
  fragment SettingsUserProfileDetails_User on User {
    id
    name
    company
    ...UserProfileEditDialogAvatar_User
  }
`)

type FormValues = { name: string; company: string }

const props = defineProps<{
  user: SettingsUserProfileDetails_UserFragment
}>()

const { mutate } = useUpdateUserProfile()
const { handleSubmit } = useForm<FormValues>()

const name = ref('')
const company = ref('')

const save = handleSubmit(async () => {
  debouncedSave.cancel()
  const input: UserUpdateInput = {}
  if (name.value !== props.user.name) input.name = name.value
  if (company.value !== props.user.company) input.company = company.value
  if (!Object.values(input).length) return

  await mutate(input)
})
const debouncedSave = debounce(save, 1000)

watch(
  () => props.user,
  (user) => {
    name.value = user.name
    company.value = user.company || ''
  },
  { deep: true, immediate: true }
)
</script>
