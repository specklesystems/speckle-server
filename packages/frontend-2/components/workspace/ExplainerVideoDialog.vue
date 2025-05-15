<template>
  <LayoutDialog v-model:open="isOpen" max-width="lg" title="Intro to Speckle">
    <CommonVimeoEmbed
      vimeo-id="76979871"
      title="Speckle explained in 5 minutes"
      controls
      dark-placeholder="/images/workspace/explainer-video-dark.png"
      light-placeholder="/images/workspace/explainer-video-light.png"
      placeholder-alt="Play explainer video"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, CommonVimeoEmbed } from '@speckle/ui-components'

const isOpen = defineModel<boolean>('open', { required: true })
</script>
