<template>
  <div>
    <v-row v-if="stream && stream.commits.totalCount !== 0" no-gutters>
      <v-col cols="12">
        <v-card :to="`/streams/${$route.params.streamId}/commits/${stream.commits.items[0].id}`">
          <preview-image
            :height="320"
            :url="`/preview/${$route.params.streamId}/commits/${stream.commits.items[0].id}`"
          ></preview-image>
          <list-item-commit
            :commit="stream.commits.items[0]"
            :stream-id="$route.params.streamId"
            transparent
            class="elevation-0"
          ></list-item-commit>
        </v-card>
        <v-list class="pa-0 ma-0"></v-list>
      </v-col>
      <v-col cols="12" style="height: 20px"></v-col>
      <v-col
        cols="12"
        :xl="loggedIn ? 4 : 12"
        class="pa-0 ma-0"
        :order="`${$vuetify.breakpoint.xlOnly ? 'last' : ''}`"
      >
        <v-card class="transparent elevation-0">
          <v-toolbar class="transparent elevation-0">
            <v-toolbar-title>Latest Active Branches</v-toolbar-title>
          </v-toolbar>
          <v-card-title class="caption" style="margin-top: -30px">
            The stream's last three updated branches
          </v-card-title>
          <v-row class="mt-0">
            <v-col
              v-for="branch in latestBranches"
              :key="branch.name"
              cols="12"
              sm="4"
              md="4"
              :xl="loggedIn ? 12 : 4"
            >
              <v-card :to="`/streams/${$route.params.streamId}/branches/${branch.name}`">
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
                <!-- <list-item-commit
                  :commit="branch.commits.items[0]"
                  :stream-id="$route.params.streamId"
                ></list-item-commit> -->
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col v-if="loggedIn" cols="12" xl="8">
        <v-card class="transparent elevation-0">
          <v-toolbar class="transparent elevation-0">
            <v-toolbar-title>Stream Feed</v-toolbar-title>
            <v-spacer />
          </v-toolbar>
          <v-card-title class="caption" style="margin-top: -30px">Recent activity log</v-card-title>
        </v-card>
        <div xxstyle="margin-top: -42px" class="mr-0">
          <stream-activity></stream-activity>
        </div>
      </v-col>
    </v-row>

    <no-data-placeholder v-if="stream && stream.commits.totalCount === 0">
      <h2>This stream has not received any data.</h2>
      <p class="caption">
        Streams are repositories where you can store, version and retrieve various design data.
      </p>
    </no-data-placeholder>
  </div>
</template>
<script>
import gql from 'graphql-tag'

export default {
  name: 'Details',
  components: {
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    ListItemCommit: () => import('@/cleanup/components/stream/ListItemCommit'),
    PreviewImage: () => import('@/components/PreviewImage'),
    StreamActivity: () => import('@/views/stream/Activity')
  },
  data() {
    return {
      clearRendererTrigger: 0,
      error: '',
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
              }
            }
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      error(err) {
        if (err.message) this.error = err.message.replace('GraphQL error: ', '')
        else this.error = err
      }
    },
    // $subscribe: {
    //   streamUpdated: {
    //     query: gql`
    //       subscription($streamId: String!) {
    //         streamUpdated(streamId: $streamId)
    //       }
    //     `,
    //     variables() {
    //       return {
    //         streamId: this.$route.params.streamId
    //       }
    //     },
    //     result() {
    //       this.$apollo.queries.stream.refetch()
    //     },
    //     skip() {
    //       return !this.loggedIn
    //     }
    //   },
    //   branchCreated: {
    //     query: gql`
    //       subscription($streamId: String!) {
    //         branchCreated(streamId: $streamId)
    //       }
    //     `,
    //     variables() {
    //       return {
    //         streamId: this.$route.params.streamId
    //       }
    //     },
    //     result() {
    //       this.$apollo.queries.stream.refetch()
    //     },
    //     skip() {
    //       return !this.loggedIn
    //     }
    //   },
    //   branchDeleted: {
    //     query: gql`
    //       subscription($streamId: String!) {
    //         branchDeleted(streamId: $streamId)
    //       }
    //     `,
    //     variables() {
    //       return {
    //         streamId: this.$route.params.streamId
    //       }
    //     },
    //     result() {
    //       this.$apollo.queries.stream.refetch()
    //     },
    //     skip() {
    //       return !this.loggedIn
    //     }
    //   },
    //   commitCreated: {
    //     query: gql`
    //       subscription($streamId: String!) {
    //         commitCreated(streamId: $streamId)
    //       }
    //     `,
    //     variables() {
    //       return {
    //         streamId: this.$route.params.streamId
    //       }
    //     },
    //     result() {
    //       this.$apollo.queries.stream.refetch()
    //     },
    //     skip() {
    //       return !this.loggedIn
    //     }
    //   }
    // }
  },
  computed: {
    latestBranches() {
      if (!this.stream) return []
      let branches = this.stream.branches.items
        .filter((br) => br.name !== 'globals' && br.commits.totalCount !== 0)
        .slice()
        .sort(
          (a, b) => new Date(b.commits.items[0].createdAt) - new Date(a.commits.items[0].createdAt)
        )
      return branches.slice(0, 3)
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {},

  methods: {}
}
</script>
