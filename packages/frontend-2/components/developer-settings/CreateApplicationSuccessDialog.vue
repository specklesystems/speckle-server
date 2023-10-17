<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Create Application"
    :buttons="dialogButtons"
    max-height
  >
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <div class="flex flex-col gap-3">
        <h6 class="h6 font-bold text-center">Your new app is ready</h6>
        <FormClipboardInput :value="props.application?.id" />
      </div>
      <div
        class="flex gap-4 items-center bg-warning-lighter dark:bg-warning border-warning-darker dark:border-warning-lighter border rounded-lg py-2 pl-4 pr-8"
      >
        <ExclamationTriangleIcon
          class="h-8 w-8 mt-0.5 text-warning-darker dark:text-warning-lighter"
        />
        <div class="text-warning-darker max-w-md">
          <p>
            <strong>Note:</strong>
            To authenticate users inside your app, direct them to
          </p>
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

const props = defineProps<{
  application: ApplicationItem | null
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = [
  {
    text: 'Close',
    props: { color: 'primary', fullWidth: true },
    onClick: () => (isOpen.value = false)
  }
]
</script>
