<template>
  <section class="flex flex-col items-center justify-center py-8 md:py-16">
    <h3 class="text-heading-lg text-foreground">
      Scale your digital impact with Automate. Let's get you started...
    </h3>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-5 mt-4 max-w-5xl">
      <CommonCard
        v-for="emptyStateItem in emptyStateItems"
        :key="emptyStateItem.title"
        :title="emptyStateItem.title"
        :description="emptyStateItem.description"
        :buttons="emptyStateItem.buttons"
      />
    </div>
  </section>
</template>
<script setup lang="ts">
import {
  automateFunctionsRoute,
  workspaceFunctionsRoute
} from '~/lib/common/helpers/route'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mp'

const emit = defineEmits<{
  'new-automation': [fn?: CreateAutomationSelectableFunction]
  'new-function': []
}>()

export type AutomateOnboardingAction =
  | 'create-function'
  | 'view-functions'
  | 'create-automation'

const props = withDefaults(
  defineProps<{
    workspaceSlug?: string
    hiddenActions?: AutomateOnboardingAction[]
    disabledActions?: {
      action: AutomateOnboardingAction
      reason: string
    }[]
  }>(),
  {
    hiddenActions: () => [],
    disabledActions: () => []
  }
)

const router = useRouter()
const mixpanel = useMixpanel()

onMounted(() => {
  mixpanel.track('Automate Onboarding Start')
})

const functionsGalleryRoute = computed(() =>
  props.workspaceSlug
    ? workspaceFunctionsRoute(props.workspaceSlug)
    : automateFunctionsRoute
)

const isVisibleAction = (action: LayoutDialogButton): boolean => {
  return !props.hiddenActions.includes(action.id as AutomateOnboardingAction)
}

const isDisabledAction = (action: AutomateOnboardingAction): boolean => {
  return props.disabledActions.some((entry) => entry.action === action)
}

const getDisabledMessage = (action: AutomateOnboardingAction): string | undefined => {
  return props.disabledActions.find((entry) => entry.action === action)?.reason
}

const emptyStateItems = computed(() => {
  const items: {
    title: string
    description: string
    buttons: LayoutDialogButton[]
  }[] = [
    {
      title: "Capture your team's knowledge",
      description:
        'Turn tacit knowledge and monotonous process into code. Use private functions across projects in your workspace.',
      buttons: [
        {
          id: 'create-function',
          text: 'Create function',
          onClick: () => {
            mixpanel.track('Automate Onboarding Start Create Function')
            emit('new-function')
          },
          disabled: isDisabledAction('create-function')
        },
        {
          id: 'view-functions',
          text: 'View functions',
          onClick: () => {
            router.push(functionsGalleryRoute.value)
          }
        }
      ].filter(isVisibleAction)
    },
    {
      title: 'Automate your workflows',
      description:
        'Continuously ensure project data standards, generate delivery artifacts, and more!',
      buttons: [
        {
          text: 'Create automation',
          onClick: () => {
            mixpanel.track('Automate Onboarding Start Create Automation')
            emit('new-automation')
          },
          disabled: isDisabledAction('create-automation'),
          disabledMessage: getDisabledMessage('create-automation')
        }
      ]
    },
    {
      title: 'Learn more',
      description:
        "Let's chat! Find out how Automate can be customised to support and improve virtually any of your custom workflows.",
      buttons: [
        {
          text: 'Book a demo',
          props: {
            to: 'https://calendar.app.google/kH2EzSSMQktJ6bTZ7',
            external: true
          }
        },
        {
          text: 'View docs',
          props: {
            to: 'https://speckle.guide/automate/',
            external: true
          }
        }
      ]
    }
  ]
  return items
})
</script>
