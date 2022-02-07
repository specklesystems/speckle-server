<template>
  <div>
    <portal to="toolbar">
      <div class="font-weight-bold">Feed</div>
    </portal>
    <v-row>
      <v-col cols="12" lg="12">
        <timeline />
      </v-col>
    </v-row>
    <latest-blogposts></latest-blogposts>
  </div>
</template>
<script>
export default {
  components: {
    Timeline: () => import('@/main/components/feed/Timeline'),
    LatestBlogposts: () => import('@/main/components/feed/LatestBlogposts')
  }
}
</script>
