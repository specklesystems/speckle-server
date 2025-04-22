<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete automation"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground">
      Are you sure you want to delete
      <span class="font-semibold">{{ automation.name }}</span>
      from your project?
    </p>
    <p v-if="automationFunction" class="text-body-xs text-foreground">
      You will still be able to use
      <span class="font-semibold">{{ automationFunction.name }}</span>
      in other automations, but all previous runs of this automation will be lost.
    </p>
    <p class="text-body-xs text-foreground">
      Model data will not be changed or deleted. Some automation data may be retained
      for auditing or security purposes.
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageAutomationDeleteDialog_AutomationFragment } from '~/lib/common/generated/gql/graphql'
import { projectRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useDeleteAutomation } from '~/lib/projects/composables/automationManagement'

graphql(`
  fragment ProjectPageAutomationDeleteDialog_Project on Project {
    id
    name
    workspaceId
  }
`)

graphql(`
  fragment ProjectPageAutomationDeleteDialog_Automation on Automation {
    id
    name
    currentRevision {
      functions {
        release {
          function {
            id
            name
          }
        }
      }
    }
  }
`)

const props = defineProps<{
  projectId: string
  automation: ProjectPageAutomationDeleteDialog_AutomationFragment
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const router = useRouter()
const mixpanel = useMixpanel()
const deleteAutomation = useDeleteAutomation()

const handleDelete = async () => {
  const result = await deleteAutomation(props.projectId, props.automation.id)

  if (result) {
    router.push(projectRoute(props.projectId, 'automations'))
    mixpanel.track('Automate Automation Deleted', {
      automationId: props.automation.id
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Delete',
    props: {
      color: 'danger'
    },
    onClick: handleDelete
  }
])

const automationFunction = computed(() => {
  return props.automation.currentRevision?.functions.at(0)?.release?.function
})
</script>
