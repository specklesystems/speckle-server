<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Create Application"
    :buttons="dialogButtons"
    max-height
  >
    <div class="flex flex-col gap-4 text-sm text-foreground">
      <div class="flex flex-col gap-3">
        <h6 class="h6 font-bold text-center">Your new app is ready</h6>
        <div class="grid grid-cols-2 gap-x-6 gap-y-3 py-2 text-sm max-w-xs mx-auto">
          <div class="flex items-center">App Id:</div>
          <div class="w-40">
            <FormClipboardInput
              v-if="props.application?.id"
              :value="props.application?.id"
              @copy="
                triggerNotification({
                  type: ToastNotificationType.Info,
                  title: 'App Id copied to clipboard'
                })
              "
            />
          </div>
          <div class="flex items-center">App Secret:</div>
          <div class="w-40">
            <FormClipboardInput
              v-if="props.application?.secret"
              :value="props.application?.secret"
              @copy="
                triggerNotification({
                  type: ToastNotificationType.Info,
                  title: 'App Secret copied to clipboard'
                })
              "
            />
          </div>
        </div>
      </div>
      <div class="flex gap-4 items-center border-primary border rounded-lg px-4 py-3">
        <ExclamationTriangleIcon class="h-8 w-8 mt-0.5 text-primary" />
        <div class="max-w-md flex flex-col gap-1.5 text-sm">
          <p>
            <strong>Note:</strong>
            To authenticate users inside your app, direct them to
          </p>
          <FormClipboardInput
            v-if="props.application?.secret"
            is-multiline
            :value="`https://latest.speckle.dev/authn/verify/${props.application?.id}/{code_challenge}`"
            @copy="
              triggerNotification({
                type: ToastNotificationType.Info,
                title: 'URL copied to clipboard'
              })
            "
          />
          <p>
            `{code_challenge}` is an OAuth2 plain code challenge that your app needs to
            generate for each authentication request.
          </p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, FormClipboardInput } from '@speckle/ui-components'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { ApplicationItem } from 'lib/developer-settings/helpers/types'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const props = defineProps<{
  application: ApplicationItem | null
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { triggerNotification } = useGlobalToast()

const dialogButtons = [
  {
    text: 'Close',
    props: { color: 'primary', fullWidth: true },
    onClick: () => (isOpen.value = false)
  }
]
</script>
