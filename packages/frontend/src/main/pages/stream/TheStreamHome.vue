<template>
  <div>
    <!-- If stream has data -->
    <v-row v-if="stream && stream.commits.totalCount !== 0">
      <v-col cols="12" xl="7">
        <v-toolbar class="transparent elevation-0">
          <v-toolbar-title>Latest Commit</v-toolbar-title>
        </v-toolbar>
        <commit-preview-card
          :commit="stream.commits.items[0]"
          :preview-height="320"
          :show-stream-and-branch="true"
        />

        <!-- Latest bracnhes -->
        <v-card class="transparent elevation-0 mt-4">
          <v-toolbar class="transparent elevation-0">
            <v-toolbar-title>Latest Branches</v-toolbar-title>
            <v-spacer />
            <v-btn
              small
              depressed
              color="primary"
              @click="$eventHub.$emit('show-new-branch-dialog')"
            >
              New Branch
            </v-btn>
          </v-toolbar>
          <v-row class="mt-0">
            <v-col
              v-for="branch in latestBranches"
              :key="branch.name"
              cols="12"
              :md="latestBranchesColSize"
              :xl="latestBranchesColSize"
              :xxxmd="`${latestBranches.length !== 1 ? '3' : '12'}`"
              :xxxxl="`${latestBranches.length !== 1 ? '3' : '12'}`"
            >
              <v-card
                class="rounded-lg"
                :to="`/streams/${$route.params.streamId}/branches/${branch.name}`"
              >
                <preview-image
                  :height="120"
                  :url="`/preview/${$route.params.streamId}/commits/${branch.commits.items[0].id}`"
                ></preview-image>
                <v-toolbar flat class="transparent">
                  <v-toolbar-title>
                    <v-icon>mdi-source-branch</v-icon>
                    {{ branch.name }}
                  </v-toolbar-title>
                  <v-spacer></v-spacer>
                  <v-badge
                    inline
                    :content="branch.commits.totalCount"
                    :color="`grey ${$vuetify.theme.dark ? 'darken-1' : 'lighten-1'}`"
                  ></v-badge>
                </v-toolbar>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
        <v-card v-if="comments" class="transparent elevation-0 mt-4">
          <v-toolbar v-show="comments.totalCount !== 0" class="transparent elevation-0">
            <v-toolbar-title>Latest Comments</v-toolbar-title>
            <v-spacer />
            <v-btn
              v-show="comments.totalCount !== 0"
              small
              depressed
              color="primary"
              :to="`/streams/${$route.params.streamId}/comments`"
            >
              see all ({{ comments.totalCount }})
            </v-btn>
          </v-toolbar>
          <v-row>
            <v-col
              v-for="c in comments.items"
              :key="c.id"
              cols="12"
              :md="`${comments.items.length !== 1 ? '6' : '12'}`"
              :xl="`${comments.items.length !== 1 ? '6' : '12'}`"
            >
              <comment-list-item :comment="c" :stream="stream" />
            </v-col>
            <v-col v-if="comments.totalCount === 0" class="mt-5">
              <div class="d-flex align-center">
                <a
                  href="https://speckle.systems/tutorials/live-3d-comments-for-distributed-real-time-reviews/"
                  target="_blank"
                >
                  <v-img
                    src="@/assets/comments.gif"
                    max-width="250"
                    class="rounded-xl elevation-5"
                  ></v-img>
                </a>
                <div class="ml-5">
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
        </v-card>
      </v-col>
      <v-col cols="12" xl="5">
        <stream-activity />
        <p class="px-11 pt-10 caption">👆 No more activity to show!</p>
      </v-col>
    </v-row>

    <!-- Stream has no data -->
    <no-data-placeholder v-if="stream && stream.commits.totalCount === 0">
      <h2>This stream has not received any data.</h2>
      <p class="caption">
        Streams are repositories where you can store, version and retrieve various
        design data.
      </p>
    </no-data-placeholder>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
import { COMMENT_FULL_INFO_FRAGMENT } from '@/graphql/comments'

export default {
  name: 'TheStreamHome',
  components: {
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder'),
    PreviewImage: () => import('@/main/components/common/PreviewImage'),
    StreamActivity: () => import('@/main/components/stream/StreamActivity.vue'),
    CommitPreviewCard: () => import('@/main/components/common/CommitPreviewCard'),
    CommentListItem: () => import('@/main/components/comments/CommentListItem.vue')
  },
  data() {
    return {
      clearRendererTrigger: 0,
      selectedBranch: null
    }
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            isPublic
            name
            branches {
              totalCount
              items {
                name
                description
                commits(limit: 1) {
                  totalCount
                  items {
                    id
                    createdAt
                    message
                    referencedObject
                    authorId
                    authorName
                    authorAvatar
                    sourceApplication
                  }
                }
              }
            }
            commits(limit: 1) {
              totalCount
              items {
                id
                authorName
                authorId
                authorAvatar
                sourceApplication
                message
                referencedObject
                createdAt
                branchName
                commentCount
              }
            }
          }
        }
      `,
      variables() {
        return {
          id: this.streamId
        }
      }
    },
    comments: {
      query: gql`
        query ($streamId: String!) {
          comments(streamId: $streamId, limit: 4) {
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
          streamId: this.streamId
        }
      }
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    latestBranches() {
      if (!this.stream) return []
      const branches = this.stream.branches.items
        .filter((br) => br.name !== 'globals' && br.commits.totalCount !== 0)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.commits.items[0].createdAt) -
            new Date(a.commits.items[0].createdAt)
        )
      return branches.slice(0, 4)
    },
    latestBranchesColSize() {
      if (this.latestBranches.length === 1) return 12
      if (this.latestBranches.length === 2) return 6
      if (this.latestBranches.length === 3) return 4
      if (this.latestBranches.length === 4) return 3
      return 12
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {},

  methods: {}
}
</script>
