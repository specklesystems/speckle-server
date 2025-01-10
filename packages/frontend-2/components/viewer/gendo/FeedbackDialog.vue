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
        How can we improve the AI rendering experience? Let us know about the quality of
        renders, prompts that you have had success with, or any features that would make
        Gendo more useful for your workflow
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
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { isRequired } from '~/lib/common/helpers/validation'

type FormValues = { feedback: string }

const props = defineProps<{
  renderId?: string
  renderUrl?: string
  renderPrompt?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
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

const onSubmit = handleSubmit(() => {
  if (!feedback.value) return

  isOpen.value = false

  triggerNotification({
    type: ToastNotificationType.Success,
    title: 'Thank you for your feedback!'
  })

  mixpanel.track('Gendo Feedback Sent', {
    message: feedback.value,
    renderId: props.renderId,
    renderUrl: props.renderUrl,
    renderPrompt: props.renderPrompt
  })
})

watch(isOpen, (newVal) => {
  if (newVal) {
    feedback.value = ''
  }
})
</script>
