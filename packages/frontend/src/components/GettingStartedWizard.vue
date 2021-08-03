<template>
  <div v-if="quickstart > 0 && !$apollo.loading" class="ma-3">
    <div v-if="user" class="ma-5 headline justify-center text-center">
      Hello {{ user.name.split(' ')[0] }} 👋,
      <br />
      It seems you're new here, let's get you set up!
    </div>
    <v-stepper v-model="quickstart" flat shaped vertical class="rounded-lg quickstart-stepper mt-5">
      <v-btn
        small
        text
        class="white--grey"
        style="position: absolute; top: 5px; right: 5px; z-index: 1002"
        @click="skip"
      >
        Skip
      </v-btn>
      <v-stepper-step :complete="quickstart > 1" step="1">Create your first stream</v-stepper-step>

      <v-stepper-content step="1" class="body-2">
        <p>
          Streams are the
          <b>primary way Speckle organizes data</b>
          . You can see them as a folder, a project or a repository.
        </p>
        <p>
          Streams
          <b>can be shared with others</b>
          and can be made publicly visible on the web. Only the owner of a stream can manage its
          permissions and visibility.
        </p>
        <p>
          In order to use Speckle you first need to create a stream, so
          <b>go ahead and create your first one</b>
          !
        </p>
      </v-stepper-content>

      <v-stepper-step :complete="quickstart > 2" step="2">Install Speckle Manager</v-stepper-step>

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

      <v-stepper-step :complete="quickstart > 3" step="3">Set up Speckle Manager</v-stepper-step>

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
          We're almost done here, and just need to send your first set of data to Speckle. By doing
          so you will also be creating your first
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
            Send Some Data
          </v-btn>
        </p>
      </v-stepper-content>
    </v-stepper>
  </div>
</template>
<script>
import gql from 'graphql-tag'

export default {
  apollo: {
    user: {
      query: gql`
        query {
          user {
            id
            name
            streams {
              totalCount
            }
            commits {
              totalCount
            }
          }
        }
      `,
      skip() {
        return !this.loggedIn
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
    },
    $subscribe: {
      userStreamAdded: {
        query: gql`
          subscription {
            userStreamAdded
          }
        `,
        result() {
          this.$apollo.queries.user.refetch()
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
          this.$apollo.queries.user.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  data: () => ({
    streams: [],
    hasClickedDownload: false,
    refreshFailied: false,
    skipped: false
  }),
  computed: {
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    },
    rootUrl() {
      return window.location.origin
    },
    quickstart() {
      if (!this.user || this.skipped) return 0
      if (this.user.streams.totalCount === 0) return 1
      if (this.user.streams.totalCount > 0 && !this.hasManager && !this.hasClickedDownload) return 2
      if (this.user.streams.totalCount > 0 && !this.hasManager && this.hasClickedDownload) return 3
      if (this.hasManager && this.user.commits.totalCount === 0) return 4
      if (this.user.commits.totalCount > 0) return 0

      return 0
    },
    hasManager() {
      if (!this.authorizedApps) return false
      return this.authorizedApps.findIndex((a) => a.id === 'sdm') !== -1
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
    this.skipped = localStorage.getItem('wizard')
  },
  methods: {
    skip() {
      localStorage.setItem('wizard', 'skipped')
      this.skipped = true
    },
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
    }
  }
}
</script>
<style scoped>
.quickstart-stepper {
  box-shadow: none !important;
}
</style>
