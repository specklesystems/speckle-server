<template>
  <Component
    :is="noButtons ? NuxtLink : 'div'"
    :class="classes"
    :to="noButtons ? automationFunctionRoute(fn.id) : undefined"
    :external="externalMoreInfo"
    :target="externalMoreInfo ? '_blank' : undefined"
  >
    <div
      class="px-4 py-4 flex flex-col gap-3 rounded-lg border border-outline-3 bg-foundation relative"
    >
      <div class="flex gap-3 items-center" :class="{ 'w-4/5': hasLabel }">
        <AutomateFunctionLogo :logo="fn.logo" />
        <div class="flex flex-col truncate">
          <div class="normal font-semibold text-foreground truncate hover:underline">
            <RouterLink
              :to="automationFunctionRoute(fn.id)"
              :target="externalMoreInfo ? '_blank' : undefined"
            >
              {{ fn.name }}
            </RouterLink>
          </div>
          <div class="label-light flex items-center space-x-1">
            <span>by</span>
            <CommonTextLink external :to="fn.repo.url" size="sm">
              {{ fn.repo.owner }}
            </CommonTextLink>
          </div>
        </div>
      </div>
      <div class="label-light text-foreground-2 line-clamp-3 h-16 whitespace-normal">
        {{ plaintextDescription }}
      </div>
      <div v-if="!noButtons" class="flex flex-col sm:flex-row sm:self-end gap-2">
        <template v-if="showEdit">
          <FormButton
            :icon-left="PencilIcon"
            full-width
            outlined
            @click="$emit('edit')"
          >
            Edit Details
          </FormButton>
        </template>
        <template v-else>
          <FormButton
            text
            :to="automationFunctionRoute(fn.id)"
            :external="externalMoreInfo"
            :target="externalMoreInfo ? '_blank' : undefined"
          >
            Learn More
          </FormButton>
          <FormButton :icon-left="BoltIcon" @click="$emit('use')">Use</FormButton>
        </template>
      </div>
      <div class="absolute top-0 right-0">
        <div
          v-if="hasLabel"
          class="rounded-bl-lg rounded-tr-[7px] text-xs px-2 py-1"
          :class="{
            'bg-foundation-focus text-foreground': fn.isFeatured,
            'bg-warning text-foreground-on-primary': isOutdated
          }"
        >
          <template v-if="isOutdated">Outdated</template>
          <template v-else-if="fn.isFeatured">Featured</template>
        </div>
      </div>
    </div>
  </Component>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { AutomationsFunctionsCard_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'
import { BoltIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { automationFunctionRoute } from '~/lib/common/helpers/route'
import { useMarkdown } from '~/lib/common/composables/markdown'

graphql(`
  fragment AutomationsFunctionsCard_AutomateFunction on AutomateFunction {
    id
    name
    isFeatured
    description
    logo
    repo {
      id
      url
      owner
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
  isOutdated?: boolean
}>()

const NuxtLink = resolveComponent('NuxtLink')
const hasLabel = computed(() => props.fn.isFeatured || props.isOutdated)
const { html: plaintextDescription } = useMarkdown(
  computed(() => props.fn.description || ''),
  { plaintext: true }
)

const classes = computed(() => {
  const classParts = ['rounded-lg']

  if (props.selected) {
    classParts.push('ring-2 ring-primary')
  } else if (props.noButtons) {
    classParts.push('ring-outline-2 hover:ring-2 cursor-pointer')
  }

  return classParts.join(' ')
})
</script>
