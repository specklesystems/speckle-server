<template>
  <LayoutDialog v-model:open="isOpen" max-width="lg" title="Intro to Speckle">
    <CommonVimeoEmbed
      vimeo-id="1084612464"
      title="Speckle explained in 5 minutes"
      controls
      dark-placeholder="/images/workspace/explainer-video-dark.webp"
      light-placeholder="/images/workspace/explainer-video-light.webp"
      placeholder-alt="Play explainer video"
      @on-play="onPlay"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, CommonVimeoEmbed } from '@speckle/ui-components'
import { useMixpanel } from '~~/lib/core/composables/mp'

const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()

const onPlay = () => {
  mixpanel.track('Getting Started Video Played')
}
</script>
