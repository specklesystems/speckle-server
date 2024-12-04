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
  <!-- <div class="flex flex-col gap-y-6 md:gap-y-8">
    <div class="p-4 flex flex-col gap-y-4 rounded-lg max-w-2xl mx-auto items-center">
      <div class="gap-y-4 flex flex-col items-center">
        <div class="text-heading-lg text-foreground">Scale your digital impact</div>
        <div class="text-body-xs text-foreground-2">
          Speckle Automate empowers you to continuously monitor your published models,
          automatically ensuring project data standards, identifying potential design
          faults, and effortlessly creating delivery artifacts.
        </div>
        <div class="flex gap-x-4">
          <FormButton
            :disabled="!!creationDisabledMessage"
            @click="$emit('new-automation')"
          >
            New automation
          </FormButton>
          <FormButton color="outline" :to="functionsGalleryRoute">
            View functions
          </FormButton>
        </div>
      </div>
    </div>
  </div> -->
</template>
<script setup lang="ts">
import {
  automationFunctionsRoute,
  workspaceFunctionsRoute
} from '~/lib/common/helpers/route'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'

defineEmits<{
  'new-automation': [fn?: CreateAutomationSelectableFunction]
}>()

const props = defineProps<{
  workspaceSlug?: string
  isAutomateEnabled: boolean
  creationDisabledMessage?: string
}>()

const functionsGalleryRoute = computed(() =>
  props.workspaceSlug
    ? workspaceFunctionsRoute(props.workspaceSlug)
    : automationFunctionsRoute
)

const emptyStateItems = computed(() => [
  {
    title: "Capture your team's knowledge",
    description:
      'Turn tacit knowledge and monotonous process into code. Use private functions across projects in your workspace.',
    buttons: [
      {
        text: 'Create function',
        onClick: () => '',
        disabled: false
      },
      {
        text: 'View functions',
        disabled: false
      }
    ]
  },
  {
    title: 'Automate your workflows',
    description:
      'Continuously ensure project data standards, generate delivery artifacts, and more!',
    buttons: [
      {
        text: 'Create automation',
        onClick: () => '',
        disabled: false
      }
    ]
  },
  {
    title: 'Learn more',
    description:
      'Find out how Automate can be customised to support virtually any of your custom workflows.',
    buttons: [
      {
        text: 'View docs',
        onClick: () => '',
        disabled: false
      }
    ]
  }
])
</script>
