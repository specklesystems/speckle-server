<template>
  <div>
    <button
      v-show="!showNewModelCard"
      class="group flex w-full rounded-md items-center text-primary text-xs px-2 py-1 transition bg-primary-muted hover:bg-primary hover:text-foreground-on-primary"
      @click="showNewModelCard = true"
    >
      +
      <span class="font-bold ml-1">NEW</span>
    </button>
    <div
      v-if="showNewModelCard"
      class="w-full py-2 xxh-28 px-1 flex items-center rounded-lg xxxshadow xxxhover:shadow-xl transition-all"
    >
      <form
        class="flex items-center justify-between w-full space-x-2"
        @submit="onSubmit"
      >
        <div class="flex-grow">
          <FormTextInput
            name="model name"
            placeholder="name"
            auto-focus
            :rules="nameRules"
          />
          <!-- <div class="text-xs text-foreground-2 ml-2 mt-1">
            Use '/' to create nested models.
          </div> -->
        </div>
        <div class="space-x-2">
          <FormButton submit>Save</FormButton>
          <FormButton outlined color="danger" @click="showNewModelCard = false">
            Cancel
          </FormButton>
        </div>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isStringOfLength } from '~~/lib/common/helpers/validation'
import { ensureError } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { PlusIcon } from '@heroicons/vue/24/solid'

type FormValues = { name: string }
const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()

const loading = ref(false)
const nameRules = [isStringOfLength({ minLength: 3, maxLength: 1000 })]

const onSubmit = handleSubmit(async (formValues) => {
  try {
    loading.value = true
    console.log(formValues)
    await true // TODO
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Registration failed',
      description: `${ensureError(e).message}`
    })
  } finally {
    loading.value = false
  }
})

const showNewModelCard = ref(false)
</script>
