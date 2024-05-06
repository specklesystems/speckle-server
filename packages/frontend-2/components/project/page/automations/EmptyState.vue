<template>
  <div class="flex flex-col gap-12">
    <div class="p-4 flex flex-col gap-6 rounded-lg max-w-2xl mx-auto items-center">
      <ProjectPageAutomationsScaleImpactImage />
      <div class="gap-2 flex flex-col text-center">
        <div class="h3 leading-10 text-fancy-gradient">Scale your digital impact</div>
        <div class="text-foreground normal">
          Speckle Automate empowers you to continuously monitor your published models,
          automatically ensuring project data standards, identifying potential design
          faults, and effortlessly creating delivery artifacts.
          <CommonTextLink
            :icon-right="ArrowTopRightOnSquareIcon"
            target="_blank"
            external
            to="https://speckle.systems/blog/automate-with-speckle/"
          >
            Learn more
          </CommonTextLink>
        </div>
      </div>
      <div>
        <FormButton
          v-if="isAutomateEnabled"
          :icon-left="PlusIcon"
          size="lg"
          @click="$emit('new-automation')"
        >
          New Automation
        </FormButton>
        <FormButton
          v-else
          :icon-left="PlusIcon"
          size="lg"
          external
          target="_blank"
          to="https://docs.google.com/forms/d/e/1FAIpQLSc5e4q0gyG8VkGqA3gRzN71c4TDu0P9W0PXeVarFu_8po3qRA/viewform"
        >
          Sign Up for Beta
        </FormButton>
      </div>
    </div>
    <div v-if="isAutomateEnabled" class="flex flex-col gap-9">
      <div class="flex gap-2 flex-col sm:flex-row sm:justify-between sm:items-center">
        <h2 class="h5 font-bold">Featured Functions</h2>
        <FormButton color="secondary" class="shrink-0" :to="automationFunctionsRoute">
          Explore All Functions
        </FormButton>
      </div>
      <AutomateFunctionCardView v-if="functions.length">
        <AutomateFunctionCard
          v-for="fn in functions"
          :key="fn.id"
          :fn="fn"
          @use="() => $emit('new-automation', fn)"
        />
      </AutomateFunctionCardView>
      <CommonGenericEmptyState v-else />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/vue/24/outline'
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
}>()

const functions = computed(() => props.functions?.automateFunctions.items || [])
</script>
