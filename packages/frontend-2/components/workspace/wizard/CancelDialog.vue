<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Cancel workspace creation"
    :buttons="dialogButtons"
    max-width="md"
  >
    <div class="flex flex-col gap-2">
      <p class="text-body-xs text-foreground font-medium">
        If you cancel, you will lose all progress.
        <br />
        Do you want to continue?
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspacesRoute } from '~/lib/common/helpers/route'

const props = defineProps<{
  workspaceId?: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const router = useRouter()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Confirm',
    props: { color: 'primary' },
    onClick: onConfirm
  }
])

const onConfirm = () => {
  isOpen.value = false
  router.push(workspacesRoute)
  mixpanel.track('Workspace Creation Canceled', {
    ...(props.workspaceId && {
      // eslint-disable-next-line camelcase
      workspace_id: props.workspaceId
    })
  })
}
</script>
