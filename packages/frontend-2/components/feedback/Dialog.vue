<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Give us feedback"
    :buttons="dialogButtons"
    max-width="md"
  >
    <div class="flex flex-col gap-4">
      <p class="text-body-xs text-foreground font-medium">
        How can we improve Speckle? If you have a feature request, please also share how
        you would use it and why it's important to you
      </p>
      <FormTextArea
        v-model="feedback"
        :rules="[isRequired]"
        name="feedback"
        label="Feedback"
        color="foundation"
        placeholder="What if..."
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useZapier } from '~/lib/core/composables/zapier'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { isRequired } from '~/lib/common/helpers/validation'

type FormValues = { feedback: string }

const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const { sendWebhook } = useZapier()
const { triggerNotification } = useGlobalToast()
const { handleSubmit } = useForm<FormValues>()

const feedback = ref('')

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Send',
    props: { color: 'primary' },
    onClick: () => {
      onSubmit()
    }
  }
])

const onSubmit = handleSubmit(async () => {
  if (!feedback.value) return

  try {
    const response = await sendWebhook(
      'https://hooks.zapier.com/hooks/catch/12120532/2m4okri/',
      {
        feedback: feedback.value
      }
    )

    if (response.ok) {
      isOpen.value = false
      mixpanel.track('Feedback Sent', {
        feedback: feedback.value
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Thank you for your feedback!'
      })
    }
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to send feedback. Please try again.'
    })
  }
})
</script>
