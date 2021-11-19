<template>
  <v-container
    :class="`${$vuetify.breakpoint.xsOnly ? 'pl-2' : ''}`"
    :style="`${!$vuetify.breakpoint.xsOnly ? 'padding-left: 56px' : ''}`"
    fluid
    pt-4
    pr-0
  >
    <v-navigation-drawer
      v-model="streamNav"
      app
      fixed
      :permanent="streamNav && !$vuetify.breakpoint.smAndDown"
      :style="`${!$vuetify.breakpoint.xsOnly ? 'left: 56px' : ''}`"
    >
      <main-nav-actions :open-new-stream="newStreamDialog" />

      <div v-if="user">
        <v-list dense class="py-0">
          <v-subheader class="caption ml-2">Your stats:</v-subheader>
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
          class="py-0"
        >
          <v-subheader class="ml-2">Your latest commits:</v-subheader>
          <v-list-item
            v-for="(commit, i) in userCommits.commits.items"
            v-if="commit"
            :key="i"
            v-tooltip="`In stream '${commit.streamName}'`"
            :to="`streams/${commit.streamId}/${
              commit.branchName === 'globals' ? 'globals' : 'commits'
            }/${commit.id}`"
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
                on
                <v-icon style="font-size: 10px">mdi-source-branch</v-icon>
                {{ commit.branchName }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </v-navigation-drawer>

    <v-app-bar app :style="`${!$vuetify.breakpoint.xsOnly ? 'padding-left: 56px' : ''}`" flat>
      <v-app-bar-nav-icon @click="streamNav = !streamNav"></v-app-bar-nav-icon>
      <v-toolbar-title class="space-grotesk pl-0">
        <v-icon class="mb-1 hidden-xs-only">mdi-folder</v-icon>
        Streams
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items v-if="$vuetify.breakpoint.smAndDown" style="margin-right: -18px">
        <v-btn color="primary" depressed @click="newStreamDialog++">
          <v-icon>mdi-plus-box</v-icon>
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>

    <!-- <getting-started-wizard /> -->

    <v-row class="pl-2 pr-4" no-gutters>
      <v-col v-if="$apollo.loading">
        <v-row>
          <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="6" lg="4" xl="4">
            <v-skeleton-loader type="card, list-item-two-line" class="ma-2"></v-skeleton-loader>
          </v-col>
        </v-row>
        <div v-if="$apollo.loading" class="my-5"></div>
      </v-col>

      <v-col v-else-if="streams && streams.items && streams.items.length > 0" cols="12">
        <v-row :class="`${$vuetify.breakpoint.xsOnly ? '' : 'pl-2'}`">
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
        <no-data-placeholder v-if="user">
          <h2>Welcome {{ user.name.split(' ')[0] }}!</h2>
          <p class="caption">
            Once you will create a stream and start sending some data, your activity will show up
            here.
          </p>

          <template #actions>
            <v-list rounded class="transparent">
              <v-list-item link class="primary mb-4" dark @click="newStreamDialog++">
                <v-list-item-icon>
                  <v-icon>mdi-plus-box</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Create a new stream!</v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    Streams are like folders, or data repositories.
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </template>
        </no-data-placeholder>
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
    MainNavActions: () => import('@/components/MainNavActions'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder')
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
            commits(limit: 7) {
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
    newStreamDialog: 0
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
