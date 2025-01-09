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
          <div v-if="isAutomateEnabled" v-tippy="creationDisabledReason">
            <FormButton
              :disabled="!!creationDisabledReason"
              @click="$emit('new-automation')"
            >
              New automation
            </FormButton>
          </div>
          <FormButton
            v-else
            external
            target="_blank"
            to="https://docs.google.com/forms/d/e/1FAIpQLSc5e4q0gyG8VkGqA3gRzN71c4TDu0P9W0PXeVarFu_8po3qRA/viewform"
          >
            Sign up for beta
          </FormButton>
          <FormButton
            target="_blank"
            external
            color="outline"
            to="https://speckle.systems/blog/automate-with-speckle/"
          >
            Learn more
          </FormButton>
        </div>
      </div>
    </div>
    <div v-if="isAutomateEnabled" class="flex flex-col gap-6">
      <div class="flex gap-2 flex-row justify-between items-center">
        <h2 class="text-heading-lg text-foreground">Featured functions</h2>
        <FormButton color="outline" class="shrink-0" :to="automationFunctionsRoute">
          Explore all
        </FormButton>
      </div>
      <AutomateFunctionCardView v-if="functions.length">
        <AutomateFunctionCard
          v-for="fn in functions"
          :key="fn.id"
          :fn="fn"
          no-buttons
        />
      </AutomateFunctionCardView>
      <CommonGenericEmptyState v-else />
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageAutomationsEmptyState_QueryFragment } from '~/lib/common/generated/gql/graphql'
import { automationFunctionsRoute } from '~/lib/common/helpers/route'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'

graphql(`
  fragment ProjectPageAutomationsEmptyState_Query on Query {
    automateFunctions(limit: 9, filter: { featuredFunctionsOnly: true }) {
      items {
        ...AutomationsFunctionsCard_AutomateFunction
        ...AutomateAutomationCreateDialog_AutomateFunction
      }
    }
  }
`)

defineEmits<{
  'new-automation': [fn?: CreateAutomationSelectableFunction]
}>()

const props = defineProps<{
  functions?: ProjectPageAutomationsEmptyState_QueryFragment
  isAutomateEnabled: boolean
  creationDisabledReason?: string
}>()

const functions = computed(() => props.functions?.automateFunctions.items || [])
</script>
