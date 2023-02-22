<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">
      <div class="font-weight-bold">Feed</div>
    </portal>
    <v-row>
      <v-col cols="12" class="d-flex">
        <feed-timeline class="flex-grow-1" />
        <latest-blogposts class="d-none d-lg-block ml-6" />
      </v-col>
    </v-row>
  </div>
</template>
<script>
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import FeedTimeline from '@/main/components/feed/FeedTimeline.vue'
import LatestBlogposts from '@/main/components/feed/LatestBlogposts.vue'

export default {
  name: 'TheFeed',
  components: {
    FeedTimeline,
    LatestBlogposts
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'feed', 0)]
}
</script>
