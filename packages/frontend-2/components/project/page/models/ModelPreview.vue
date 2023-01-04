<template>
  <div class="w-full h-full">
    <ClientOnly>
      <div
        v-if="previewUrl"
        class="w-full h-full bg-contain bg-no-repeat bg-center"
        :style="{
          backgroundImage: `url('${previewUrl}')`
        }"
      />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ModelPreviewFragment } from '~~/lib/common/generated/gql/graphql'
import { usePreviewImageBlob } from '~~/lib/projects/composables/previewImage'

graphql(`
  fragment ModelPreview on Model {
    previewUrl
  }
`)

const props = defineProps<{
  model: ModelPreviewFragment
}>()

const basePreviewUrl = computed(() => props.model.previewUrl)
const { previewUrl } = usePreviewImageBlob(basePreviewUrl)
</script>
