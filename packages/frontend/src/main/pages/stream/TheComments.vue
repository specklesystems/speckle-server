<template>
  <div class="">
    <portal v-if="canRenderToolbarPortal" to="toolbar">
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
          <v-icon small class="mr-1" style="font-size: 13px">
            mdi-comment-outline
          </v-icon>
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
    <v-row v-if="localComments.length === 0">
      <v-col cols="12">
        <div class="d-flex flex-column text-center justify-center mt-10">
          <div class="d-flex justify-center">
            <a
              href="https://speckle.systems/tutorials/live-3d-comments-for-distributed-real-time-reviews/"
              target="_blank"
            >
              <v-img
                src="@/assets/comments.gif"
                max-width="450"
                class="rounded-xl elevation-5"
              ></v-img>
            </a>
          </div>
          <div class="ml-5 mt-10">
            <span class="caption">There are no comments in this stream yet.</span>
            <br />
            <a
              href="https://speckle.systems/tutorials/live-3d-comments-for-distributed-real-time-reviews/"
              target="_blank"
              class="font-weight-bold text-decoration-none"
            >
              Read more about Speckle's Live 3D Comments for Distributed Real Time
              Reviews!
            </a>
          </div>
        </div>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12" class="mb-0">
        <p class="mb-0 mt-2">All this stream's comments are listed below.</p>
      </v-col>
      <v-col v-for="c in localComments" :key="c.id" cols="12" md="6">
        <comment-list-item
          v-if="c"
          :comment="c"
          :stream="stream"
          @deleted="handleDeletion"
        />
      </v-col>
      <v-col cols="12" class="align-center">
        <infinite-loading
          :key="localComments[0].id"
          spinner="waveDots"
          @infinite="infiniteHandler"
        >
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
import { gql } from '@apollo/client/core'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import { COMMENT_FULL_INFO_FRAGMENT } from '@/graphql/comments'

export default {
  name: 'TheComments',
  components: {
    CommentListItem: () => import('@/main/components/comments/CommentListItem.vue'),
    InfiniteLoading: () => import('vue-infinite-loading')
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'stream-comments', 1)],
  data() {
    return {
      localComments: [],
      showArchivedComments: false,
      commentFilter: 1,
      cursor: null
    }
  },
  mounted() {
    this.$apollo.queries.comments.refetch()
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
            role
          }
        }
      `,
      variables() {
        return { id: this.$route.params.streamId }
      }
    },
    comments: {
      query: gql`
        query ($streamId: String!, $archived: Boolean!, $cursor: String) {
          comments(
            streamId: $streamId
            limit: 10
            archived: $archived
            cursor: $cursor
          ) {
            totalCount
            cursor
            items {
              ...CommentFullInfo
            }
          }
        }

        ${COMMENT_FULL_INFO_FRAGMENT}
      `,
      fetchPolicy: 'no-cache',
      variables() {
        return {
          streamId: this.$route.params.streamId,
          archived: this.showArchivedComments
        }
      },
      subscribeToMore: {
        document: gql`
          subscription ($streamId: String!) {
            commentActivity(streamId: $streamId) {
              type
              comment {
                ...CommentFullInfo
              }
            }
          }
          ${COMMENT_FULL_INFO_FRAGMENT}
        `,
        variables() {
          return { streamId: this.$route.params.streamId }
        },
        updateQuery(_, { subscriptionData }) {
          const { comment } = subscriptionData.data.commentActivity
          if (this.localComments.findIndex((lc) => comment.id === lc.id) === -1) {
            this.localComments.push(comment)
          }
        },
        skip() {
          return !this.$loggedIn()
        }
      },
      result({ data }) {
        if (!data) return
        this.cursor = data.comments.cursor
        for (const c of data.comments.items) {
          if (this.localComments.findIndex((lc) => c.id === lc.id) === -1)
            this.localComments.push({ ...c })
        }
      }
    }
  },
  methods: {
    handleDeletion(comment) {
      this.$store.commit('setCommentSelection', { comment: null })
      const indx = this.localComments.findIndex((lc) => lc.id === comment.id)
      this.localComments.splice(indx, 1)
    },
    async infiniteHandler($state) {
      const res = await this.$apollo.queries.comments.refetch({
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
