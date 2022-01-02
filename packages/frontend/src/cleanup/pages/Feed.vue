<template>
  <div>
    <portal to="toolbar">
      <div class="font-weight-bold">Feed</div>
    </portal>
    <v-row>
      <v-col cols="12" lg="8">
        <section-card expandable :elevation="1">
          <template slot="header">Hello</template>
          <v-card-text>Test</v-card-text>
        </section-card>
      </v-col>
      <v-col cols="12" lg="4" style="position: sticky; top: 64px">
        <latest-blogposts></latest-blogposts>
      </v-col>
    </v-row>
  </div>
</template>
<script>
export default {
  components: {
    SectionCard: () => import('@/cleanup/components/common/SectionCard'),
    InfiniteLoading: () => import('vue-infinite-loading'),
    LatestBlogposts: () => import('@/cleanup/components/feed/LatestBlogposts')
  }
}
</script>
