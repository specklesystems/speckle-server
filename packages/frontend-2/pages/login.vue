<template>
  <LayoutPanel class="mx-auto max-w-screen-md">
    <template #header>
      <span class="h5">Log in</span>
    </template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormTextInput type="email" name="email" label="E-mail" />
        <FormTextInput type="password" name="password" label="Password" />
      </div>
    </template>
    <template #footer>
      <FormButton>Submit</FormButton>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'

type FormValues = { email: string; password: string }

const { handleSubmit } = useForm<FormValues>()

const onSubmit = handleSubmit((values) => {
  console.log(values)
})
</script>
