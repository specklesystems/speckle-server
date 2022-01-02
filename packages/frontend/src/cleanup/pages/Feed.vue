<template>
  <v-container fluid>
    <portal to="toolbar">
      <div class="font-weight-bold">Feed</div>
    </portal>
    <v-row class="px-1">
      <v-col cols="12" lg="8">Test</v-col>
      <v-col cols="12" lg="4" style="position: sticky; top: 64px">
        <latest-blogposts></latest-blogposts>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    LatestBlogposts: () => import('@/cleanup/components/feed/LatestBlogposts')
  }
}
</script>
