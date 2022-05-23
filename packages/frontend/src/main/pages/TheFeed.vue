<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">
      <div class="font-weight-bold">Feed</div>
    </portal>
    <v-row>
      <v-col cols="12" lg="12">
        <feed-timeline />
      </v-col>
    </v-row>
    <latest-blogposts />
  </div>
</template>
<script>
import {
  claimPortal,
  unclaimPortal,
  portalsState,
  STANDARD_PORTAL_KEYS
} from '@/main/utils/portalStateManager'

export default {
  name: 'TheFeed',
  components: {
    FeedTimeline: () => import('@/main/components/feed/FeedTimeline.vue'),
    LatestBlogposts: () => import('@/main/components/feed/LatestBlogposts')
  },
  data: () => ({ portalIdentity: 'feed' }),
  computed: {
    canRenderToolbarPortal() {
      return (
        portalsState.currentPortals[STANDARD_PORTAL_KEYS.Toolbar] ===
        this.portalIdentity
      )
    }
  },
  mounted() {
    claimPortal(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity, 0)
  },
  beforeDestroy() {
    unclaimPortal(STANDARD_PORTAL_KEYS.Toolbar, this.portalIdentity)
  }
}
</script>
