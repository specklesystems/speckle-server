<template>
  <v-row no-gutters>
    <v-col>
      <!-- Stream Page Nav Bar  -->
      <stream-nav :stream="stream" />

      <!-- Stream Page App Bar (Toolbar) -->
      <stream-toolbar v-if="stream" :stream="stream" :user="user" />

      <!-- Stream invite banner -->
      <stream-invite-banner
        v-if="hasInvite && !showInvitePlaceholder"
        :stream-invite="streamInvite"
        :invite-token="inviteToken"
        @invite-used="onInviteClosed"
      />

      <!-- Stream Child Routes -->
      <div v-if="!error">
        <transition name="fade">
          <router-view v-if="stream" :key="$route.path"></router-view>
        </transition>
      </div>
      <div v-else style="width: 100%">
        <error-placeholder v-if="!showInvitePlaceholder" :error-type="errorType">
          <h2>{{ errorMsg }}</h2>
        </error-placeholder>
        <stream-invite-placeholder
          v-else
          :stream-invite="streamInvite"
          :invite-token="inviteToken"
          @invite-used="onInviteClosed"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import gql from 'graphql-tag'
import StreamInviteBanner from '@/main/components/stream/StreamInviteBanner.vue'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import Vue from 'vue'
import { Nullable, MaybeFalsy } from '@/helpers/typeHelpers'
import { ApolloError } from 'vue-apollo-smart-ops'
import {
  useStreamInviteQuery,
  useMainUserDataQuery,
  MainUserDataQuery,
  StreamQuery,
  StreamDocument,
  StreamQueryVariables
} from '@/graphql/generated/graphql'
import type { ApolloQueryResult } from 'apollo-client'
import type { Get } from 'type-fest'
import StreamInvitePlaceholder from '@/main/components/stream/StreamInvitePlaceholder.vue'
import { StreamInviteType } from '@/main/lib/stream/mixins/streamInviteMixin'
import { getInviteTokenFromRoute } from '@/main/lib/auth/services/authService'

// Cause of a limitation of vue-apollo-smart-ops, this needs to be duplicated
type VueThis = Vue & {
  streamId: string
  inviteToken: Nullable<string>
  error: Nullable<Error>
}

export default Vue.extend({
  name: 'TheStream',
  components: {
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder.vue'),
    StreamNav: () => import('@/main/navigation/StreamNav.vue'),
    StreamToolbar: () => import('@/main/toolbars/StreamToolbar.vue'),
    StreamInviteBanner,
    StreamInvitePlaceholder
  },
  data() {
    return {
      error: null as Nullable<ApolloError>,
      user: null as Nullable<Get<MainUserDataQuery, 'user'>>,
      streamInvite: null as Nullable<StreamInviteType>,
      shareStream: false,
      branchMenuOpen: false,
      inviteClosed: false
    }
  },
  computed: {
    inviteToken(): Nullable<string> {
      return getInviteTokenFromRoute(this.$route)
    },
    streamId(): string {
      return this.$route.params.streamId
    },
    errorMsg(): MaybeFalsy<string> {
      return this.error?.message.replace('GraphQL error: ', '')
    },
    errorType(): Nullable<string> {
      const err = this.error
      if (!err) return null

      const isAccess = err.graphQLErrors.some(
        (e) => e.extensions?.['code'] === 'FORBIDDEN'
      )
      if (isAccess) return 'access'

      const isNotFound = err.message.toLowerCase().includes('not found')
      if (isNotFound) return '404'

      return null
    },
    isAccessError(): boolean {
      return this.errorType === 'access'
    },
    showInvitePlaceholder(): boolean {
      return !!(this.hasInvite && this.isAccessError)
    },
    hasInvite(): boolean {
      return !!(this.streamInvite && !this.inviteClosed)
    }
  },
  apollo: {
    streamInvite: useStreamInviteQuery<VueThis>({
      variables() {
        return {
          streamId: this.streamId,
          token: this.inviteToken
        }
      }
    }),
    stream: {
      query: StreamDocument,
      variables(this: VueThis): StreamQueryVariables {
        return {
          id: this.streamId
        }
      },
      error(this: VueThis, err): void {
        this.error = err
      },
      result(this: VueThis, res: ApolloQueryResult<StreamQuery>): void {
        if (res.data?.stream) {
          this.error = null
        }
      }
    },
    user: useMainUserDataQuery(),
    $subscribe: {
      branchCreated: {
        query: gql`
          subscription ($streamId: String!) {
            branchCreated(streamId: $streamId)
          }
        `,
        variables(this: VueThis): Record<string, unknown> {
          return {
            streamId: this.streamId
          }
        },
        result(
          this: VueThis,
          { data }: { data: { branchCreated: Record<string, unknown> } }
        ): void {
          if (!data.branchCreated) return
          this.$eventHub.$emit('notification', {
            text: `A new branch was created!`,
            action: {
              name: 'View Branch',
              to: `/streams/${this.streamId}/branches/${data.branchCreated.name}`
            }
          })
        },
        skip(this: VueThis): boolean {
          return !this.$loggedIn()
        }
      },
      commitCreated: {
        query: gql`
          subscription ($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables(this: VueThis): Record<string, unknown> {
          return {
            streamId: this.streamId
          }
        },
        result(
          this: VueThis,
          { data }: { data: { commitCreated: Record<string, unknown> } }
        ): void {
          if (!data.commitCreated) return
          this.$eventHub.$emit('notification', {
            text: `A new commit was created!`,
            action: {
              name: 'View Commit',
              to: `/streams/${this.streamId}/commits/${data.commitCreated.id}`
            }
          })
        },
        skip(this: VueThis): boolean {
          return !this.$loggedIn()
        }
      }
    }
  },
  mounted() {
    this.$eventHub.$on(StreamEvents.Refetch, () => {
      this.$apollo.queries.stream.refetch()
    })
  },
  methods: {
    onInviteClosed() {
      this.inviteClosed = true
      this.error = null
    }
  }
})
</script>
