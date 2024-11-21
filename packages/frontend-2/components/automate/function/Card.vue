<template>
  <Component
    :is="noButtons ? NuxtLink : 'div'"
    :class="classes"
    :to="noButtons ? automationFunctionRoute(fn.id) : undefined"
    :external="externalMoreInfo"
    :target="externalMoreInfo ? '_blank' : undefined"
    class="rounded-lg border border-outline-3 bg-foundation overflow-hidden"
  >
    <div class="px-4 py-4 flex flex-col gap-3 relative h-full">
      <div class="flex gap-3 items-center" :class="{ 'w-4/5': hasLabel }">
        <AutomateFunctionLogo :logo="fn.logo" />
        <div class="flex flex-col truncate">
          <div
            :class="[
              'text-heading-sm text-foreground truncate',
              noButtons ? '' : 'hover:underline'
            ]"
          >
            <Component
              :is="noButtons ? 'div' : NuxtLink"
              :to="automationFunctionRoute(fn.id)"
              :target="externalMoreInfo ? '_blank' : undefined"
              class="truncate"
            >
              {{ fn.name }}
            </Component>
          </div>
          <div class="text-body-2xs flex items-center text-foreground-2 space-x-0.5">
            <span>by</span>
            <Component :is="noButtons ? 'div' : NuxtLink" :to="fn.repo.url" external>
              {{ fn.repo.owner }}
            </Component>
          </div>
        </div>
      </div>
      <div class="text-body-xs text-foreground-2 line-clamp-3 h-18">
        {{ plaintextDescription }}
      </div>
      <div v-if="!noButtons" class="flex flex-col sm:flex-row gap-x-1">
        <template v-if="showEdit">
          <FormButton
            :icon-left="PencilIcon"
            full-width
            color="outline"
            @click="$emit('edit')"
          >
            Edit Details
          </FormButton>
        </template>
        <template v-else>
          <FormButton
            :icon-left="selected ? CheckIcon : undefined"
            @click="$emit('use')"
          >
            {{ selected ? 'Selected' : 'Select' }}
          </FormButton>
          <FormButton
            color="subtle"
            :to="automationFunctionRoute(fn.id)"
            :external="externalMoreInfo"
            :target="externalMoreInfo ? '_blank' : undefined"
          >
            Learn more
          </FormButton>
        </template>
      </div>
      <div class="absolute top-0 right-0">
        <div
          v-if="hasLabel"
          class="rounded-bl-md rounded-tr-lg font-medium text-body-3xs px-2 py-1"
          :class="{
            'bg-info-lighter text-outline-4': fn.isFeatured,
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
import { CheckIcon, PencilIcon } from '@heroicons/vue/24/outline'
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
    classParts.push('border-primary')
  } else if (props.noButtons) {
    classParts.push('hover:border-outline-5 cursor-pointer')
  }

  return classParts.join(' ')
})
</script>
