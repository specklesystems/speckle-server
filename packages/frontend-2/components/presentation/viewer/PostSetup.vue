<template>
  <div class="presentation-viewer-post-setup h-full"><slot /></div>
</template>
<script setup lang="ts">
import { usePresentationViewerPostSetup } from '~/lib/presentations/composables/postSetup'

/**
 * The only point of this component is to get around the stupid limitation where a component that injects() also can't provide() the same stuff back...
 */

usePresentationViewerPostSetup()
</script>
