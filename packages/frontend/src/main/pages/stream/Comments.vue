<template>
  <div class="">
    <portal to="toolbar">
      <div v-if="!$apollo.loading" class="d-flex align-center">
        <div class="text-truncate flex-shrink-1">
          <router-link
            v-tooltip="stream.name"
            class="text-decoration-none space-grotesk mx-1"
            :to="`/streams/${stream.id}`"
          >
            <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
            <b class="d-none d-sm-inline">{{ stream.name }}</b>
          </router-link>
          /
        </div>
        <div class="text-truncate flex-shrink-0 mx-2">
          <v-icon small class="mr-1" style="font-size: 13px">mdi-comment-outline</v-icon>
          Comments
          <span class="caption">{{ localComments.length }}</span>
        </div>

        <!-- <div class="d-md-inline-block">
          <v-btn-toggle tile color="primary" group mandatory>
            <v-btn small icon disabled><v-icon small>mdi-filter</v-icon></v-btn>
            <v-btn small text @click="showArchivedComments = false">Active</v-btn>
            <v-btn small text @click="showArchivedComments = true">Archived</v-btn>
          </v-btn-toggle>
        </div> -->
      </div>
    </portal>
    <v-row>
      <v-col cols="12" class="mb-0">
        <p class="mb-0 mt-2">All this stream's comments are listed below.</p>
      </v-col>
      <v-col v-for="c in localComments" :key="c.id" cols="12" sm="6">
        <comment-list-item :comment="c" />
      </v-col>
      <v-col cols="12" sm="6" class="align-center">
        <infinite-loading spinner="waveDots" @infinite="infiniteHandler">
          <div slot="no-more" class="caption py-10 mt-5">
            You've reached the end - no more comments.
          </div>
          <div slot="no-results" class="caption py-10 mt-5">
            You've reached the end - no more comments.
          </div>
        </infinite-loading>
      </v-col>
    </v-row>
    <!-- TODO: infinite loading -->
  </div>
</template>
<script>
import gql from 'graphql-tag'

export default {
  name: 'Comments',
  components: {
    CommentListItem: () => import('@/main/components/comments/CommentListItem.vue'),
    InfiniteLoading: () => import('vue-infinite-loading')
  },
  data() {
    return {
      localComments: [],
      showArchivedComments: false,
      commentFilter: 1,
      cursor: null
    }
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
          }
        }
      `,
      variables() {
        return { id: this.$route.params.streamId }
      }
    },
    comments: {
      query: gql`
        query(
          $streamId: String!
          $resources: [ResourceIdentifierInput]!
          $archived: Boolean!
          $cursor: String
        ) {
          comments(
            streamId: $streamId
            resources: $resources
            limit: 2
            archived: $archived
            cursor: $cursor
          ) {
            totalCount
            cursor
            items {
              id
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          archived: this.showArchivedComments,
          resources: [
            {
              resourceType: 'stream',
              resourceId: this.$route.params.streamId
            }
          ]
        }
      },
      result({ data }) {
        this.cursor = data.comments.cursor
        for (let c of data.comments.items) {
          if (this.localComments.findIndex((lc) => c.id === lc.id) === -1)
            this.localComments.push({ ...c })
        }
      }
    }
  },
  methods: {
    async infiniteHandler($state) {
      let res = await this.$apollo.queries.comments.refetch({
        cursor: this.cursor ? this.cursor : null,
        streamId: this.$route.params.streamId,
        archived: this.showArchivedComments,
        resources: [
          {
            resourceType: 'stream',
            resourceId: this.$route.params.streamId
          }
        ]
      })
      this.cursor = res.data.comments.cursor
      if (res.data.comments.items.length === 0) $state.complete()
      else $state.loaded()

      return
    }
  }
}
</script>
<style scoped></style>
