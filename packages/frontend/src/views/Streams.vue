<template>
  <v-container style="padding-left: 56px" fluid pt-4 pr-0>
    <v-navigation-drawer
      app
      fixed
      :permanent="streamNav && !$vuetify.breakpoint.smAndDown"
      v-model="streamNav"
      style="left: 56px"
    >
      <main-nav-actions :open-new-stream="streamNewDialog" />

      <div v-if="user">
        <!--         <v-subheader class="caption">Filter:</v-subheader>
        <v-list dense rounded>
          <v-list-item link>
            <v-list-item-icon>
              <v-icon small class="">mdi-key</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-subtitle class="caption">Owner</v-list-item-subtitle class="caption">
            </v-list-item-content>
          </v-list-item>
          <v-list-item link>
            <v-list-item-icon>
              <v-icon small class="">mdi-account</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-subtitle class="caption">Contributor</v-list-item-subtitle class="caption">
            </v-list-item-content>
          </v-list-item>
          <v-list-item link>
            <v-list-item-icon>
              <v-icon small class="">mdi-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-subtitle class="caption">Reviewer</v-list-item-subtitle class="caption">
            </v-list-item-content>
          </v-list-item>
        </v-list> -->

        <v-subheader class="caption">Your stats:</v-subheader>
        <v-list dense>
          <v-list-item>
            <v-list-item-icon>
              <v-icon small class="">mdi-folder-multiple</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
                <b>{{ user.streams.totalCount }}</b>
                total streams
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-icon>
              <v-icon small class="">mdi-source-commit</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
                <b>{{ user.commits.totalCount }}</b>
                total commits
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-list
          v-if="userCommits && userCommits.commits.items.length !== 0"
          color="transparent"
          dense
        >
          <v-subheader class="mt-3 ml-2">Your latest commits:</v-subheader>
          <v-list-item
            v-for="(commit, i) in userCommits.commits.items"
            :key="i"
            :to="`streams/${commit.streamId}/${ commit.branchName === 'globals' ? 'globals' : 'commits' }/${commit.id}`"
            v-if="commit"
            v-tooltip="`In stream '${commit.streamName}'`"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ commit.message }}
              </v-list-item-title>
              <v-list-item-subtitle class="caption">
                <i>
                  Updated
                  <timeago :datetime="commit.createdAt"></timeago>
                </i>
                on <v-icon style="font-size: 10px;">mdi-source-branch</v-icon>{{commit.branchName}}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

      </div>
    </v-navigation-drawer>

    <v-app-bar app style="padding-left: 56px" flat>
      <v-app-bar-nav-icon @click="streamNav = !streamNav" v-show="!streamNav"></v-app-bar-nav-icon>
      <v-toolbar-title class="space-grotesk">
        <v-icon class="mb-1">mdi-folder</v-icon>
        Streams
      </v-toolbar-title>
      <v-spacer v-if="!streamNav"></v-spacer>
      <v-toolbar-items v-if="!streamNav">
        <v-btn color="primary" @click="streamNewDialog++">
          <v-icon>mdi-plus-box</v-icon>
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>

    <!-- <getting-started-wizard /> -->

    <v-row class="px-4" no-gutters>
      <v-col cols="12"></v-col>
      <v-col v-if="$apollo.loading">
        <v-row>
          <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="6" lg="4" xl="4">
            <v-skeleton-loader type="card, list-item-two-line" class="ma-2"></v-skeleton-loader>
          </v-col>
        </v-row>
        <div v-if="$apollo.loading" class="my-5"></div>
      </v-col>

      <v-col cols="12" v-else-if="streams && streams.items && streams.items.length > 0">
        <v-row>
          <v-col
            v-for="(stream, i) in streams.items"
            :key="i"
            cols="12"
            sm="6"
            md="6"
            lg="4"
            xl="4"
          >
            <list-item-stream :stream="stream"></list-item-stream>
          </v-col>
          <infinite-loading
            v-if="streams.items.length < streams.totalCount"
            @infinite="infiniteHandler"
          >
            <div slot="no-more">These are all your streams!</div>
            <div slot="no-results">There are no streams to load</div>
          </infinite-loading>
        </v-row>
      </v-col>
      <v-col v-else cols="12">
        <div class="ma-5 headline justify-center text-center">
          😿
          <br />
          Your don't have any streams!

          <br />
          <span class="subtitle-2 font-italic">
            Create one now with the big blue button to the side.
          </span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import gql from 'graphql-tag'
import streamsQuery from '../graphql/streams.gql'
import userQuery from '../graphql/user.gql'

export default {
  name: 'Streams',
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    ListItemStream: () => import('@/components/ListItemStream'),
    GettingStartedWizard: () => import('@/components/GettingStartedWizard'),
    MainNavActions: () => import('@/components/MainNavActions')
  },
  apollo: {
    streams: {
      prefetch: true,
      query: streamsQuery,
      fetchPolicy: 'cache-and-network' //https://www.apollographql.com/docs/react/data/queries/
    },
    user: {
      query: userQuery,
      skip() {
        return !this.loggedIn
      }
    },
    userCommits: {
      query: gql`
        query {
          userCommits: user {
            id
            commits {
              totalCount
              items {
                id
                message
                sourceApplication
                streamId
                streamName
                branchName
                createdAt
              }
            }
          }
        }
      `,
      skip() {
        return !this.loggedIn
      }
    },
    $subscribe: {
      userStreamAdded: {
        query: gql`
          subscription {
            userStreamAdded
          }
        `,
        result() {
          this.$apollo.queries.streams.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      },
      userStreamRemoved: {
        query: gql`
          subscription {
            userStreamRemoved
          }
        `,
        result() {
          this.$apollo.queries.streams.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  data: () => ({
    streams: [],
    streamNav: true,
    streamNewDialog: 0
  }),
  computed: {
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {
    streams(val) {
      if (val.items.length === 0 && !localStorage.getItem('onboarding')) {
        this.$router.push('/onboarding')
      }
    }
  },
  mounted() {
    setTimeout(
      function () {
        this.streamNav = !this.$vuetify.breakpoint.smAndDown
      }.bind(this),
      100
    )
  },
  methods: {
    showServerInviteDialog() {
      this.$refs.serverInviteDialog.show()
    },

    infiniteHandler($state) {
      this.$apollo.queries.streams.fetchMore({
        variables: {
          cursor: this.streams.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.streams.items

          //set vue-infinite state
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          return {
            streams: {
              __typename: previousResult.streams.__typename,
              totalCount: fetchMoreResult.streams.totalCount,
              cursor: fetchMoreResult.streams.cursor,
              // Merging the new streams
              items: [...previousResult.streams.items, ...newItems]
            }
          }
        }
      })
    }
  }
}
</script>
<style scoped>
.recent-commits a {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
}

.recent-commits a:hover {
  text-decoration: underline;
}
</style>
