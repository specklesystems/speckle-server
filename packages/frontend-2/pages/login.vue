<template>
  <LayoutPanel form class="mx-auto max-w-screen-md" @submit="onSubmit">
    <template #header>
      <span class="h5">Log in</span>
    </template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormTextInput type="email" name="email" label="E-mail" :rules="emailRules" />
        <FormTextInput
          type="password"
          name="password"
          label="Password"
          :rules="passwordRules"
        />
      </div>
    </template>
    <template #footer>
      <FormButton submit>Submit</FormButton>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'

type FormValues = { email: string; password: string }

const { handleSubmit } = useForm<FormValues>()
const emailRules = [isEmail]
const passwordRules = [isRequired]

const onSubmit = handleSubmit((values) => {
  console.log(values)
})
</script>
