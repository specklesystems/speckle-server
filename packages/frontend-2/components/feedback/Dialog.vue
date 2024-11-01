<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Give us feedback"
    :buttons="dialogButtons"
    :on-submit="onSubmit"
    max-width="md"
  >
    <div class="flex flex-col gap-2">
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
      />
      <p class="text-body-xs !leading-4">
        Need help? For support, head over to our
        <FormButton to="https://speckle.community/" target="_blank" link text>
          community forum
        </FormButton>
        where we can chat and solve problems together.
      </p>
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
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

type FormValues = { feedback: string }

const isOpen = defineModel<boolean>('open', { required: true })

const { activeUser: user } = useActiveUser()
const mixpanel = useMixpanel()
const { sendWebhook } = useZapier()
const { triggerNotification } = useGlobalToast()
const { handleSubmit } = useForm<FormValues>()

const feedback = ref('')

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Send',
    props: { color: 'primary' },
    submit: true,
    id: 'sendFeedback'
  }
])

const onSubmit = handleSubmit(async () => {
  if (!feedback.value) return

  isOpen.value = false

  triggerNotification({
    type: ToastNotificationType.Success,
    title: 'Thank you for your feedback!'
  })

  mixpanel.track('Feedback Sent', {
    message: feedback.value
  })

  await sendWebhook('https://hooks.zapier.com/hooks/catch/12120532/2m4okri/', {
    userId: user.value?.id ?? '',
    feedback: feedback.value
  })
})

watch(isOpen, (newVal) => {
  if (newVal) {
    feedback.value = ''
  }
})
</script>
