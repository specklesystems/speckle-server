<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <AutomateFunctionCreateDialogTemplateCard
      v-for="t in templates"
      :key="t.url"
      :template="t"
      :selected="selectedTemplate?.url === t.url"
      @click="selectedTemplate = t"
    />
  </div>
</template>
<script setup lang="ts">
import type { CreatableFunctionTemplate } from '~/lib/automate/helpers/functions'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate on AutomateFunctionTemplate {
    id
    title
    logo
    url
  }
`)

defineProps<{
  templates: CreatableFunctionTemplate[]
}>()

const selectedTemplate = defineModel<CreatableFunctionTemplate>('selectedTemplate')
</script>
