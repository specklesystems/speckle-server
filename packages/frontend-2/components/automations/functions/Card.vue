<template>
  <div class="rounded-lg border border-outline-3 bg-foundation relative">
    <div class="px-4 py-2 flex flex-col gap-3">
      <div class="flex gap-3 items-center" :class="{ 'pr-24': hasLabel }">
        <div
          class="bg-foundation-focus text-primary font-bold h-10 w-10 rounded-full shrink-0 flex justify-center text-center items-center overflow-hidden"
        >
          <img v-if="logo" :src="logo" alt="Function logo" class="h-10 w-10" />
          <span v-else>λ</span>
        </div>
        <div class="flex flex-col truncate">
          <div class="normal font-semibold text-foreground truncate">{{ fn.name }}</div>
          <div class="label-light">by {{ fn.creator.name }}</div>
        </div>
      </div>
      <div class="label-light text-foreground-2 line-clamp-3 h-16">
        {{ fn.description }}
      </div>
      <div class="flex gap-2">
        <FormButton
          color="secondary"
          class="grow"
          :icon-right="ArrowTopRightOnSquareIcon"
          size="sm"
        >
          More Info
        </FormButton>
        <FormButton :icon-left="BoltIcon" outlined class="grow" size="sm">
          Use
        </FormButton>
      </div>
    </div>
    <div class="absolute top-0 right-0">
      <div
        v-if="hasLabel"
        class="rounded-bl-lg text-xs px-2 py-1 text-foreground"
        :class="{ 'bg-foundation-focus': fn.isFeatured }"
      >
        <template v-if="fn.isFeatured">featured</template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { cleanFunctionLogo } from '~/lib/automations/helpers/functions'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomationsFunctionsCard_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'
import { ArrowTopRightOnSquareIcon, BoltIcon } from '@heroicons/vue/24/outline'
import { FormButton } from '@speckle/ui-components'

graphql(`
  fragment AutomationsFunctionsCard_AutomateFunction on AutomateFunction {
    id
    name
    isFeatured
    description
    logo
    creator {
      id
      name
    }
  }
`)

const props = defineProps<{
  fn: AutomationsFunctionsCard_AutomateFunctionFragment
}>()

const logo = computed(() => cleanFunctionLogo(props.fn.logo))
const hasLabel = computed(() => props.fn.isFeatured)
</script>
