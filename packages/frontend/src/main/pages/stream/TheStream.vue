<template>
  <v-row no-gutters>
    <v-col>
      <!-- Stream Page Nav Bar  -->
      <stream-nav :stream="stream" />

      <!-- Stream Page App Bar (Toolbar) -->
      <stream-toolbar :stream="stream" :user="user" />

      <!-- Stream Child Routes -->
      <div v-if="!error">
        <transition name="fade">
          <router-view v-if="stream" :key="$route.path"></router-view>
        </transition>
      </div>
      <div v-else style="width: 100%">
        <error-placeholder
          :error-type="error.toLowerCase().includes('not found') ? '404' : 'access'"
        >
          <h2>{{ error }}</h2>
        </error-placeholder>
      </div>
    </v-col>
  </v-row>
</template>

<script>
import gql from 'graphql-tag'
import { StreamQuery } from '@/graphql/streams'
import { MainUserDataQuery } from '@/graphql/user'

export default {
  name: 'TheStream',
  components: {
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder.vue'),
    StreamNav: () => import('@/main/navigation/StreamNav.vue'),
    StreamToolbar: () => import('@/main/toolbars/StreamToolbar.vue')
  },
  data() {
    return {
      error: '',
      shareStream: false,
      branchMenuOpen: false
    }
  },
  apollo: {
    stream: {
      query: StreamQuery,
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
    user: {
      query: MainUserDataQuery
    },
    $subscribe: {
      branchCreated: {
        query: gql`
          subscription ($streamId: String!) {
            branchCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result({ data }) {
          if (!data.branchCreated) return
          this.$eventHub.$emit('notification', {
            text: `A new branch was created!`,
            action: {
              name: 'View Branch',
              to: `/streams/${this.$route.params.streamId}/branches/${data.branchCreated.name}`
            }
          })
        },
        skip() {
          return !this.loggedIn
        }
      },
      commitCreated: {
        query: gql`
          subscription ($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result({ data }) {
          if (!data.commitCreated) return
          this.snackbar = true
          this.snackbarInfo = { ...data.commitCreated, type: 'commit' }

          this.$eventHub.$emit('notification', {
            text: `A new commit was created!`,
            action: {
              name: 'View Commit',
              to: `/streams/${this.$route.params.streamId}/commits/${data.commitCreated.id}`
            }
          })
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  mounted() {
    // Open stream invite dialog if ?invite=true (used by desktop connectors)
    if (this.$route.query.invite && this.$route.query.invite === 'true') {
      console.log('todo - invite popup')
      setTimeout(() => {
        this.$refs.streamInviteDialog.show()
      }, 500)
    }
  },
  methods: {}
}
</script>
