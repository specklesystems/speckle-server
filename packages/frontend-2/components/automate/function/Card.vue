<template>
  <Component
    :is="noButtons ? NuxtLink : 'div'"
    :class="classes"
    :to="noButtons ? automationFunctionRoute(fn.id) : undefined"
    :external="externalMoreInfo"
    :target="externalMoreInfo ? '_blank' : undefined"
  >
    <div class="px-4 py-2 flex flex-col gap-3">
      <div class="flex gap-3 items-center" :class="{ 'pr-24': hasLabel }">
        <AutomateFunctionLogo :logo="fn.logo" />
        <div class="flex flex-col truncate">
          <div class="normal font-semibold text-foreground truncate">{{ fn.name }}</div>
          <div class="label-light">by {{ fn.creator?.name || 'Deleted User' }}</div>
        </div>
      </div>
      <div class="label-light text-foreground-2 line-clamp-3 h-16">
        {{ plaintextDescription }}
      </div>
      <div v-if="!noButtons" class="flex gap-2">
        <FormButton
          color="secondary"
          class="grow"
          :icon-right="ArrowTopRightOnSquareIcon"
          size="sm"
          :to="automationFunctionRoute(fn.id)"
          :external="externalMoreInfo"
          :target="externalMoreInfo ? '_blank' : undefined"
        >
          More Info
        </FormButton>
        <FormButton
          v-if="showEdit"
          :icon-left="PencilIcon"
          outlined
          class="grow"
          size="sm"
          @click="$emit('edit')"
        >
          Edit Details
        </FormButton>
        <FormButton
          v-else
          :icon-left="BoltIcon"
          outlined
          class="grow"
          size="sm"
          @click="$emit('use')"
        >
          Use
        </FormButton>
      </div>
    </div>
    <div class="absolute top-0 right-0">
      <div
        v-if="hasLabel"
        class="rounded-bl-lg rounded-tr-lg text-xs px-2 py-1 text-foreground"
        :class="{ 'bg-foundation-focus': fn.isFeatured }"
      >
        <template v-if="fn.isFeatured">featured</template>
      </div>
    </div>
  </Component>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { AutomationsFunctionsCard_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  PencilIcon
} from '@heroicons/vue/24/outline'
import { automationFunctionRoute } from '~/lib/common/helpers/route'
import { useMarkdown } from '~/lib/common/composables/markdown'

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

defineEmits<{
  edit: []
  use: []
}>()

const props = defineProps<{
  fn: AutomationsFunctionsCard_AutomateFunctionFragment
  showEdit?: boolean
  noButtons?: boolean
  externalMoreInfo?: boolean
  selected?: boolean
}>()

const NuxtLink = resolveComponent('NuxtLink')
const hasLabel = computed(() => props.fn.isFeatured)
const { html: plaintextDescription } = useMarkdown(
  computed(() => props.fn.description || ''),
  { plaintext: true }
)

const classes = computed(() => {
  const classParts = ['rounded-lg border border-outline-3 bg-foundation relative']

  if (props.selected) {
    classParts.push('ring-2 ring-outline-2')
  } else if (props.noButtons) {
    classParts.push('ring-outline-2 hover:ring-2 cursor-pointer')
  }

  return classParts.join(' ')
})
</script>
