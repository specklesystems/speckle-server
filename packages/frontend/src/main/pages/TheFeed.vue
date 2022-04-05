<template>
  <div>
    <portal to="toolbar">
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
export default {
  name: 'TheFeed',
  components: {
    FeedTimeline: () => import('@/main/components/feed/FeedTimeline.vue'),
    LatestBlogposts: () => import('@/main/components/feed/LatestBlogposts')
  }
}
</script>
