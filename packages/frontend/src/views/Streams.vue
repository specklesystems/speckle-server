<template>
  <v-container :fluid="$vuetify.breakpoint.mdAndDown">
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <div class="mt-5 mx-5">
          <div class="d-flex flex-column">
            <v-btn large rounded color="primary" class="mb-2" block @click="newStreamDialog = true">
              <v-icon small class="mr-1">mdi-plus-box</v-icon>
              new stream
            </v-btn>
            <v-btn large rounded outlined color="primary" block @click="showServerInviteDialog">
              <v-icon small class="mr-2">mdi-email-send</v-icon>
              Send an invite
            </v-btn>
          </div>
          <server-invite-dialog ref="serverInviteDialog" />
          <v-dialog v-model="newStreamDialog" max-width="500">
            <stream-new-dialog
              :open="newStreamDialog"
              :redirect="streams.items.length > 0"
              @created="newStreamDialog = false"
            />
          </v-dialog>
        </div>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="10">
        <v-row>
          <v-col v-if="$apollo.loading">
            <v-card elevation="0" color="transparent">
              <div v-if="$apollo.loading" class="my-5">
                <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
              </div>
            </v-card>
          </v-col>

          <v-col v-else-if="streams && streams.items && streams.items.length > 0">
            <v-card v-if="user" class="my-5" flat>
              <v-card-text class="body-1">
                <span>
                  You have
                  <v-icon small>mdi-compare-vertical</v-icon>
                  <b>{{ user.streams.totalCount }}</b>
                  streams and
                  <v-icon small>mdi-source-commit</v-icon>
                  <b>{{ user.commits.totalCount }}</b>
                  commits.
                </span>
              </v-card-text>
            </v-card>

            <v-row>
              <v-col
                v-for="(stream, i) in streams.items"
                :key="i"
                cols="12"
                sm="12"
                md="12"
                lg="6"
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
          <v-col v-if="quickstart > 0">
            <div v-if="quickstart === 1" class="ma-5 headline">
              Hello 👋
              <br />
              It seems you're new here, let's get you set up:
            </div>
            <v-stepper
              v-model="quickstart"
              flat
              shaped
              vertical
              class="rounded-lg quickstart-stepper mt-5"
            >
              <v-stepper-step :complete="quickstart > 1" step="1">
                Create your first stream
              </v-stepper-step>

              <v-stepper-content step="1" class="body-2">
                <p>
                  Streams are the
                  <b>primary way Speckle organizes data</b>
                  . You can see them as a folder, a project or a repository.
                </p>
                <p>
                  Streams
                  <b>can be shared with others</b>
                  and can be made publicly visible on the web. Only the owner of a stream can manage
                  its permissions and visibility.
                </p>
                <p>
                  In order to use Speckle you first need to create a stream, so
                  <b>go ahead and create your first one</b>
                  !
                </p>
              </v-stepper-content>

              <v-stepper-step :complete="quickstart > 2" step="2">
                Install Speckle Manager
              </v-stepper-step>

              <v-stepper-content step="2" class="body-2">
                <p>
                  Speckle Manager is a free
                  <b>desktop application</b>
                  that lets you install connectors for some of the most popular design and analysis
                  software.
                </p>
                <p>
                  The connectors
                  <b>exchange</b>
                  geometry and BIM data with Speckle, so that you can access it wherever you want!
                </p>
                <v-btn elevation="10" class="my-5" rounded color="primary" @click="downloadManager">
                  <v-icon small class="mr-4">mdi-download</v-icon>
                  Download Manager
                </v-btn>
              </v-stepper-content>

              <v-stepper-step :complete="quickstart > 3" step="3">
                Set up Speckle Manager
              </v-stepper-step>

              <v-stepper-content step="3">
                <p>
                  With Speckle Manager installed,
                  <b>log into your account</b>
                  and then
                  <b>install the connectors</b>
                  for the software that you use.
                </p>
                <p>
                  <v-btn
                    elevation="10"
                    rounded
                    color="primary"
                    target="_blank"
                    @click="refreshApplications"
                  >
                    Done
                  </v-btn>
                </p>

                <p v-if="refreshFailied" class="red--text caption">
                  Please install Manager and log into your account to continue.
                </p>

                <p class="caption">Having issues logging in Manager? Try with the button below:</p>
                <v-btn small text rounded color="primary" @click="addAccount">
                  <v-icon small class="mr-4">mdi-account-plus</v-icon>
                  Add account to manager
                </v-btn>
              </v-stepper-content>

              <v-stepper-step step="4">Send data to Speckle</v-stepper-step>
              <v-stepper-content step="4">
                <p>Great progress 🥳!</p>
                <p>
                  We're almost done here, and just need to send your first set of data to Speckle.
                  By doing so you will also be creating your first
                  <b>commit.</b>
                </p>
                <p>
                  Commits are
                  <b>snapshots or versions of your data in time.</b>
                  Every time you send to Speckle, a new commit is created for you.
                </p>
                <p>Send data to Speckle now by using one of our connetors!</p>
                <p>
                  <v-btn
                    elevation="10"
                    class="my-5"
                    rounded
                    color="primary"
                    href="https://speckle.guide/user/connectors.html"
                    target="_blank"
                  >
                    How to use connectors
                  </v-btn>
                </p>
              </v-stepper-content>
            </v-stepper>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import ListItemStream from '../components/ListItemStream'
import StreamNewDialog from '../components/dialogs/StreamNewDialog'
import streamsQuery from '../graphql/streams.gql'
import userQuery from '../graphql/user.gql'
import InfiniteLoading from 'vue-infinite-loading'
import ServerInviteDialog from '../components/dialogs/ServerInviteDialog.vue'
import gql from 'graphql-tag'

export default {
  name: 'Streams',
  components: {
    ListItemStream,
    StreamNewDialog,
    InfiniteLoading,
    ServerInviteDialog
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
    },
    authorizedApps: {
      query: gql`
        query {
          user {
            id
            authorizedApps {
              id
            }
          }
        }
      `,
      update: (data) => data.user.authorizedApps
    }
  },
  data: () => ({
    activeTab: 'streams',
    streams: [],
    newStreamDialog: false,
    hasClickedDownload: false,
    refreshFailied: false
  }),
  computed: {
    quickstart() {
      if (!this.user) return 0
      if (this.streams.totalCount === 0) return 1
      if (this.streams.totalCount > 0 && !this.hasManager && !this.hasClickedDownload) return 2
      if (this.streams.totalCount > 0 && !this.hasManager && this.hasClickedDownload) return 3
      if (this.hasManager && this.user.commits.totalCount === 0) return 4
      if (this.user.commits.totalCount > 0) return 0

      return 0
    },
    hasManager() {
      if (!this.authorizedApps) return false
      return this.authorizedApps.findIndex((a) => a.id === 'sdm') !== -1
    },
    recentActivity() {
      let activity = []

      if (this.streams && this.streams.items) {
        this.streams.items.forEach((x) =>
          x.commits.items.forEach((y) => {
            y.streamName = x.name
            y.streamId = x.id
            activity.push(y)
          })
        )
        activity.push(...this.streams.items)
      }

      activity.sort(this.compareUpdates)
      return activity
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    },
    rootUrl() {
      return window.location.origin
    }
  },
  watch: {
    streams(val) {
      if (val.items.length === 0 && !localStorage.getItem('onboarding')) {
        this.$router.push('/onboarding')
      }
    }
  },
  methods: {
    downloadManager() {
      this.hasClickedDownload = true
      this.$matomo && this.$matomo.trackPageView(`onboarding/managerdownload`)
      this.$matomo && this.$matomo.trackEvent('onboarding', 'managerdownload')
      window.open('https://releases.speckle.dev/manager/SpeckleManager%20Setup.exe', '_blank')
    },
    addAccount() {
      this.$matomo && this.$matomo.trackPageView(`onboarding/accountadd`)
      this.$matomo && this.$matomo.trackEvent('onboarding', 'accountadd')
      window.open(`speckle://accounts?add_server_account=${this.rootUrl}`, '_blank')
    },
    async refreshApplications() {
      await this.$apollo.queries.authorizedApps.refetch()
      if (!this.hasManager) {
        this.refreshFailied = true
      } else this.refreshFailied = false
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
    },
    compareUpdates(a, b) {
      if (a.createdAt < b.createdAt) {
        return 1
      }
      if (a.createdAt > b.createdAt) {
        return -1
      }
      return 0
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
<style scoped>
.quickstart-stepper {
  box-shadow: none !important;
}
</style>
