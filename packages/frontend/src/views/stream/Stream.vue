<template>
  <v-container :fluid="$vuetify.breakpoint.mdAndDown">
    <v-row justify="center">
      <v-col cols="12" sm="12" lg="10" class="pt-10">
        <router-view v-if="stream"></router-view>
        <error-block v-else-if="error" :message="error" />
      </v-col>
    </v-row>
    <v-snackbar :value="!loggedIn" color="primary" :timeout="-1">
      <p class="text-center my-0 title">Log in to see more!</p>
    </v-snackbar>
    <v-snackbar
      v-if="commitSnackbarInfo"
      v-model="commitSnackbar"
      :timeout="5000"
      color="primary"
      absolute
      right
      top
    >
      <b>New commit!</b></br>
      <i>{{ commitSnackbarInfo.message }}</i>
      on
      <i>{{ commitSnackbarInfo.branchName }}</i>
      <template #action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          :to="'/streams/' + $route.params.streamId + '/commits/' + commitSnackbarInfo.id"
          @click="commitSnackbar = false"
        >
          see
        </v-btn>
        <!-- <v-btn icon v-bind="attrs" @click="commitSnackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn> -->
      </template>
    </v-snackbar>
  </v-container>
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
    // editStream() {
    //   this.editStreamDialog = true
    // },
    // manageCollabrators() {
    //   this.dialogShare = true
    // },
    // showStreamInviteDialog() {
    //   this.$refs.streamInviteDialog.show()
    // },
    // editClosed() {
    //   this.editStreamDialog = false
    //   this.$apollo.queries.stream.refetch()
    // }
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
