<template>
  <v-row no-gutters>
    <v-col>
      <!-- Stream Page Nav Bar  -->
      <stream-nav :stream="stream" />

      <!-- Stream Page App Bar (Toolbar) -->
      <stream-toolbar v-if="stream" :stream="stream" :user="user" />

      <!-- Stream invite banner -->
      <stream-invite-banner :stream-id="streamId" />

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
import { streamQuery } from '@/graphql/streams'
import { mainUserDataQuery } from '@/graphql/user'
import StreamInviteBanner from '@/main/components/stream/StreamInviteBanner.vue'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'

export default {
  name: 'TheStream',
  components: {
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder.vue'),
    StreamNav: () => import('@/main/navigation/StreamNav.vue'),
    StreamToolbar: () => import('@/main/toolbars/StreamToolbar.vue'),
    StreamInviteBanner
  },
  data() {
    return {
      error: '',
      shareStream: false,
      branchMenuOpen: false
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    }
  },
  apollo: {
    stream: {
      query: streamQuery,
      variables() {
        return {
          id: this.streamId
        }
      },
      error(err) {
        this.error =
          err instanceof Error ? err.message.replace('GraphQL error: ', '') : `${err}`
      },
      result(res) {
        if (res.data?.stream) {
          this.error = null
        }
      }
    },
    user: {
      query: mainUserDataQuery,
      skip() {
        return !this.$loggedIn()
      }
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
            streamId: this.streamId
          }
        },
        result({ data }) {
          if (!data.branchCreated) return
          this.$eventHub.$emit('notification', {
            text: `A new branch was created!`,
            action: {
              name: 'View Branch',
              to: `/streams/${this.streamId}/branches/${data.branchCreated.name}`
            }
          })
        },
        skip() {
          return !this.$loggedIn()
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
            streamId: this.streamId
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
              to: `/streams/${this.streamId}/commits/${data.commitCreated.id}`
            }
          })
        },
        skip() {
          return !this.$loggedIn()
        }
      }
    }
  },
  mounted() {
    this.$eventHub.$on(StreamEvents.Refetch, () => {
      this.$apollo.queries.stream.refetch()
    })
  }
}
</script>
