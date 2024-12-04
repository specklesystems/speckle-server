<template>
  <div class="flex flex-col gap-y-6 md:gap-y-8">
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
  </div>
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
</script>
