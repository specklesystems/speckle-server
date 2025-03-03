<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="dialogTitle"
    :buttons="dialogButtons"
    :on-submit="onSubmit"
    max-width="md"
    fullscreen="none"
  >
    <div class="flex flex-col gap-2">
      <p class="text-body-xs text-foreground font-medium">
        {{ dialogIntro }}
      </p>
      <FormTextArea
        v-model="feedback"
        name="feedback"
        label="Feedback"
        color="foundation"
      />
      <p v-if="!hideSuppport" class="text-body-xs !leading-4">
        Need help? For support, head over to our
        <FormButton
          target="_blank"
          link
          text
          @click="$openUrl(`https://speckle.community/`)"
        >
          community forum
        </FormButton>
        where we can chat and solve problems together.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { ToastNotificationType, type LayoutDialogButton } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { useZapier } from '~/lib/core/composables/zapier'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useAccountStore } from '~/store/accounts'
import { useHostAppStore } from '~/store/hostApp'

type FormValues = { feedback: string }

const props = defineProps<{
  title?: string
  intro?: string
  hideSuppport?: boolean
  metadata?: Record<string, unknown>
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { trackEvent } = useMixpanel()
const { sendWebhook } = useZapier()
const { handleSubmit } = useForm<FormValues>()
const accountStore = useAccountStore()
const hostApp = useHostAppStore()

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

  trackEvent('Feedback Sent', {
    message: feedback.value,
    feedbackType: 'dui3',
    ...props.metadata
  })

  hostApp.setNotification({
    type: ToastNotificationType.Success,
    title: 'Thank you for your feedback!'
  })

  const userId = accountStore.defaultAccount.accountInfo.userInfo.id ?? ''

  await sendWebhook('https://hooks.zapier.com/hooks/catch/12120532/2m4okri/', {
    userId,
    feedback: [
      `**Action:** User Feedback`,
      `**Type:** dui3`,
      `**User ID:** ${userId}`,
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
