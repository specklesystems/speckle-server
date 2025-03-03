<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="dialogTitle"
    :buttons="dialogButtons"
    :on-submit="onSubmit"
    max-width="md"
  >
    <div class="flex flex-col gap-2">
      <p class="text-body-xs text-foreground font-medium">
        {{ dialogIntro }}
      </p>
      <FormTextArea
        v-model="feedback"
        :rules="[isRequired]"
        name="feedback"
        label="Feedback"
        color="foundation"
      />
      <p v-if="!hideSuppport" class="text-body-xs !leading-4">
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
import { defaultZapierWebhookUrl } from '~/lib/common/helpers/route'

type FeedbackType = 'general' | 'gendo'
type FormValues = { feedback: string }

const props = withDefaults(
  defineProps<{
    type?: FeedbackType
    title?: string
    intro?: string
    hideSuppport?: boolean
    metadata?: Record<string, unknown>
  }>(),
  {
    type: 'general'
  }
)

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

const dialogTitle = computed(() => props.title || 'Give us feedback')

const dialogIntro = computed(
  () =>
    props.intro ||
    'How can we improve Speckle? If you have a feature request, please also share how you would use it and why its important to you'
)

const onSubmit = handleSubmit(async () => {
  if (!feedback.value) return

  isOpen.value = false

  triggerNotification({
    type: ToastNotificationType.Success,
    title: 'Thank you for your feedback!'
  })

  mixpanel.track('Feedback Sent', {
    message: feedback.value,
    feedbackType: props.type,
    ...props.metadata
  })

  await sendWebhook(defaultZapierWebhookUrl, {
    feedback: [
      `**Action:** User Feedback`,
      `**Type:** ${props.type}`,
      `**User ID:** ${user.value?.id}`,
      `**Feedback:** ${feedback.value}`
    ].join('\n')
  })
})

watch(isOpen, (newVal) => {
  if (newVal) {
    feedback.value = ''
  }
})
</script>
