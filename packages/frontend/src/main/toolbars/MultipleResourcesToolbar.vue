<template>
  <prioritized-portal
    to="toolbar"
    identity="stream-commit-multiple-resources"
    :priority="1"
  >
    <div class="d-flex align-center">
      <div class="text-truncate flex-shrink-0 flex-lg-shrink-1">
        <router-link
          v-tooltip="stream.name"
          class="text-decoration-none space-grotesk mx-1"
          :to="`/streams/${stream.id}`"
        >
          <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
          <b class="d-none d-lg-inline">{{ stream.name }}</b>
        </router-link>
      </div>
      <div class="text-truncate flex-grow-1 mx-1">
        /
        <div class="d-inline-block flex-grow-1 text-decoration-none space-grotesk">
          <v-icon small class="mr-1 primary--text" style="font-size: 13px">
            mdi-hexagon-multiple
          </v-icon>
          Multiple Resources
        </div>
      </div>
    </div>
  </prioritized-portal>
</template>
<script>
import PrioritizedPortal from '@/main/components/common/utility/PrioritizedPortal.vue'

export default {
  components: {
    PrioritizedPortal
  },
  props: {
    stream: {
      type: Object,
      default: () => null
    },
    resources: {
      type: Array,
      default: () => []
    }
  }
}
</script>
