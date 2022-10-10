<template>
  <div>
    <slot />
  </div>
</template>
<script lang="ts">
import { setupCommitObjectViewer } from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { defineComponent, toRefs } from 'vue'

/**
 * Component's only use is to extend injection scope in portals, where it gets lost
 * https://portal-vue.linusb.org/guide/caveats.html#local-state-lost-when-toggling-disabled
 */

export default defineComponent({
  name: 'CommitObjectViewerScope',
  props: {
    streamId: {
      type: String,
      required: true
    },
    resourceId: {
      type: String,
      required: true
    },
    isEmbed: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    setupCommitObjectViewer(toRefs(props))
  }
})
</script>
