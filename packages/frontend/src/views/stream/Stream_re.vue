<template>
  <div>
    <v-app-bar app elevate-on-scroll>
      <v-toolbar-title class="space-grotesk"><router-link :to="`/streams/${stream.id}`" class="text-decoration-none">{{stream.name}}</router-link></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-md-and-down">
        <v-btn small elevation="0">
          <v-icon small class="mr-1">mdi-source-commit</v-icon>
          Commits
        </v-btn>
        <v-btn small elevation="0" :to="`/streams/${stream.id}/branches`" v-tooltip="'Use branches to keep track of commits.'">
          <v-icon small class="mr-1">mdi-source-branch</v-icon>
          Branches
        </v-btn>
        <v-btn small elevation="0" :to="`/streams/${stream.id}/globals`" v-tooltip="'Set/edit project code, location, and other global variables.'">
          <v-icon small class="mr-1">mdi-source-branch</v-icon>
          Globals
        </v-btn>
        <v-btn small elevation="0" :to="`/streams/${stream.id}/collaborators`" v-tooltip="'Manage access & sharing for this stream.'">
          <v-icon small class="mr-1">mdi-account-group</v-icon>
          Collaborators
        </v-btn>
        <v-btn small elevation="0" :to="`/streams/${stream.id}/webhooks`">
          <v-icon small class="mr-1">mdi-webhook</v-icon>
          Webhooks
        </v-btn>
        <v-btn small elevation="0" :to="`/streams/${stream.id}/settings`" v-tooltip="'Edit stream name & other settings.'">
          <v-icon small class="mr-1">mdi-cog-outline</v-icon>
        </v-btn>
      </v-toolbar-items>
      <v-app-bar-nav-icon class="hidden-lg-and-up"></v-app-bar-nav-icon>
    </v-app-bar>
    <v-container fluid class="pa-0">
      <router-view v-if="stream"></router-view>
    </v-container>
  </div>
</template>

<script>
import ErrorBlock from '@/components/ErrorBlock'
import gql from 'graphql-tag'

export default {
  name: 'Stream',
  components: {
    ErrorBlock
  },
  data() {
    return {
      error: '',
      commitSnackbar: false,
      commitSnackbarInfo: {},
      editStreamDialog: false,
      dialogShare: false
    }
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
        return {
          id: this.$route.params.streamId
        }
      },
      error(err) {
        if (err.message) this.error = err.message.replace('GraphQL error: ', '')
        else this.error = err
      }
    },
    $subscribe: {
      commitCreated: {
        query: gql`
          subscription($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result(commitInfo) {
          if (!commitInfo.data.commitCreated) return
          this.commitSnackbar = true
          this.commitSnackbarInfo = commitInfo.data.commitCreated
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    userId() {
      return localStorage.getItem('uuid')
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  mounted() {
    //open stream invite dialog if ?invite=true
    //used by desktop connectors
    if (this.$route.query.invite && this.$route.query.invite === 'true') {
      setTimeout(() => {
        this.$refs.streamInviteDialog.show()
      }, 500)
    }
  },
  methods: {
  }
}
</script>
<style>
.v-breadcrumbs {
  padding: 0 !important;
  margin-bottom: 25px;
}
.v-breadcrumbs li {
  font-size: inherit !important;
  font-weight: inherit !important;
}
</style>
