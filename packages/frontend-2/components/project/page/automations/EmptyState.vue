<template>
  <div class="flex flex-col gap-12">
    <div class="p-4 flex flex-col gap-6 rounded-lg max-w-2xl mx-auto items-center">
      <ProjectPageAutomationsScaleImpactImage />
      <div class="gap-2 flex flex-col text-center">
        <div class="text-heading-2xl text-fancy-gradient">
          Scale your digital impact
        </div>
        <div class="text-foreground text-body-sm">
          Speckle Automate empowers you to continuously monitor your published models,
          automatically ensuring project data standards, identifying potential design
          faults, and effortlessly creating delivery artifacts.
          <FormButton
            :icon-right="ArrowTopRightOnSquareIcon"
            target="_blank"
            external
            color="outline"
            class="mx-auto my-2"
            to="https://speckle.systems/blog/automate-with-speckle/"
          >
            Learn more
          </FormButton>
        </div>
      </div>
      <div>
        <div v-if="isAutomateEnabled" v-tippy="disableCreateMessage">
          <FormButton
            :icon-left="PlusIcon"
            size="lg"
            :disabled="!!disableCreateMessage"
            @click="$emit('new-automation')"
          >
            New automation
          </FormButton>
        </div>
        <FormButton
          v-else
          :icon-left="PlusIcon"
          size="lg"
          external
          target="_blank"
          to="https://docs.google.com/forms/d/e/1FAIpQLSc5e4q0gyG8VkGqA3gRzN71c4TDu0P9W0PXeVarFu_8po3qRA/viewform"
        >
          Sign up for beta
        </FormButton>
      </div>
    </div>
    <div v-if="isAutomateEnabled" class="flex flex-col gap-9">
      <div class="flex gap-2 flex-col sm:flex-row sm:justify-between sm:items-center">
        <h2 class="text-heading-xl">Featured functions</h2>
        <div class="flex items-center gap-2">
          <FormButton color="outline" class="shrink-0" :to="automationFunctionsRoute">
            Explore all functions
          </FormButton>
        </div>
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
import { ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageAutomationsEmptyState_QueryFragment } from '~/lib/common/generated/gql/graphql'
import { automationFunctionsRoute } from '~/lib/common/helpers/route'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'

graphql(`
  fragment ProjectPageAutomationsEmptyState_Query on Query {
    automateFunctions(limit: 9) {
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
  disableCreateMessage?: string
}>()

const functions = computed(() => props.functions?.automateFunctions.items || [])
</script>
