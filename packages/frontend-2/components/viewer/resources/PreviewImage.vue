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
// import { Model } from '~~/lib/common/generated/gql/graphql'
import { usePreviewImageBlob } from '~~/lib/projects/composables/previewImage'

const props = defineProps<{
  previewUrl: string
}>()

const basePreviewUrl = computed(() => props.previewUrl)
const panoramaPreviewUrl = computed(() =>
  new URL(basePreviewUrl.value, '/all').toString()
)
const { previewUrl } = usePreviewImageBlob(basePreviewUrl)
</script>
