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
        :auto-accept="shouldAutoAcceptInvite"
        @invite-used="onInviteClosed"
      />

      <!-- Stream Child Routes -->
      <div v-if="!error">
        <transition name="fade">
          <router-view v-if="stream" :key="$route.path"></router-view>
        </transition>
      </div>
      <div v-else style="width: 100%">
        <stream-invite-placeholder
          v-if="showInvitePlaceholder"
          :stream-invite="streamInvite"
          :invite-token="inviteToken"
          :auto-accept="shouldAutoAcceptInvite"
          @invite-used="onInviteClosed"
        />
        <error-placeholder v-else :error-type="errorType">
          <template #default>
            <h2>{{ errorMsg }}</h2>
          </template>
          <template v-if="allowRequestAccess" #actions>
            <rounded-button-list>
              <rounded-button-list-item
                type="primary"
                icon="mdi-lock-outline"
                @click="onRequestAccess"
              >
                <span v-if="hasStreamAccessRequest">Access Request sent</span>
                <span v-else>Request Access to Stream</span>

                <template #subtitle>
                  <span v-if="hasStreamAccessRequest">
                    You will get a confirmation email once it's been approved
                  </span>
                  <span v-else>Request Access from the stream owners</span>
                </template>
              </rounded-button-list-item>
              <rounded-button-list-item
                type="secondary"
                icon="mdi-home-outline"
                @click="onBackToStreams"
              >
                Back to your Streams
              </rounded-button-list-item>
            </rounded-button-list>
          </template>
        </error-placeholder>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { gql } from '@apollo/client/core'
import StreamInviteBanner from '@/main/components/stream/StreamInviteBanner.vue'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import Vue, { defineComponent, computed } from 'vue'
import { Nullable, MaybeFalsy } from '@/helpers/typeHelpers'
import {
  StreamInviteDocument,
  MainUserDataDocument,
  MainUserDataQuery,
  StreamQuery,
  StreamQueryVariables,
  StreamDocument,
  CreateStreamAccessRequestDocument,
  GetStreamAccessRequestDocument
} from '@/graphql/generated/graphql'
import type { ApolloQueryResult, ApolloError } from '@apollo/client/core'
import type { Get } from 'type-fest'
import StreamInvitePlaceholder from '@/main/components/stream/StreamInvitePlaceholder.vue'
import { StreamInviteType } from '@/main/lib/stream/mixins/streamInviteMixin'
import { getInviteTokenFromRoute } from '@/main/lib/auth/services/authService'
import RoundedButtonList from '@/main/components/common/layout/RoundedButtonList.vue'
import RoundedButtonListItem from '@/main/components/common/layout/rounded-button-list/RoundedButtonListItem.vue'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { useIsLoggedIn } from '@/main/lib/core/composables/core'
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from '@/main/lib/core/composables/router'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

// Cause of a limitation of Vue Apollo Options API TS types, this needs to be duplicated
// (the better option is to just use the Composition API)
type VueThis = Vue & {
  streamId: string
  inviteToken: Nullable<string>
  error: Nullable<Error>
  isLoggedIn: boolean
}

export default defineComponent({
  name: 'TheStream',
  components: {
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder.vue'),
    StreamNav: () => import('@/main/navigation/StreamNav.vue'),
    StreamToolbar: () => import('@/main/toolbars/StreamToolbar.vue'),
    StreamInviteBanner,
    StreamInvitePlaceholder,
    RoundedButtonList,
    RoundedButtonListItem
  },
  setup() {
    const route = useRoute()
    const streamId = computed(() => route.params.streamId)

    const { isLoggedIn } = useIsLoggedIn()

    const { result: streamAccessRequestResult } = useQuery(
      GetStreamAccessRequestDocument,
      () => ({ streamId: streamId.value })
    )
    const hasStreamAccessRequest = computed(
      () => !!streamAccessRequestResult.value?.streamAccessRequest?.id
    )

    return {
      isLoggedIn,
      streamId,
      hasStreamAccessRequest
    }
  },
  data() {
    return {
      error: null as Nullable<ApolloError>,
      user: null as Nullable<Get<MainUserDataQuery, 'activeUser'>>,
      streamInvite: null as Nullable<StreamInviteType>,
      shareStream: false,
      branchMenuOpen: false,
      inviteClosed: false,
      stream: null as Nullable<StreamQuery>
    }
  },
  computed: {
    inviteToken(): Nullable<string> {
      return getInviteTokenFromRoute(this.$route)
    },
    shouldAutoAcceptInvite(): boolean {
      return this.$route.query.accept === 'true'
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
    allowRequestAccess(): boolean {
      return !!(this.isAccessError && this.isLoggedIn)
    },
    hasInvite(): boolean {
      return !!(this.streamInvite && !this.inviteClosed)
    }
  },
  apollo: {
    streamInvite: {
      query: StreamInviteDocument,
      variables(this: VueThis) {
        return {
          streamId: this.streamId,
          token: this.inviteToken
        }
      }
    },
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
    user: {
      query: MainUserDataDocument,
      update: (data) => data.activeUser
    },
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
          const branchName = data.branchCreated.name as string
          const streamId = data.branchCreated.streamId
          this.$eventHub.$emit('notification', {
            text: `A new branch was created!`,
            action: {
              name: 'View Branch',
              to: `/streams/${streamId}/branches/${formatBranchNameForURL(branchName)}`
            }
          })
        },
        skip(this: VueThis): boolean {
          return !this.isLoggedIn || !this.streamId
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
          const commitId = data.commitCreated.id
          const streamId = data.commitCreated.streamId

          this.$eventHub.$emit('notification', {
            text: `A new commit was created!`,
            action: {
              name: 'View Commit',
              to: `/streams/${streamId}/commits/${commitId}`
            }
          })
        },
        skip(this: VueThis): boolean {
          return !this.isLoggedIn || !this.streamId
        }
      }
    } as never // for some reason Vue Apollo Options API being used for subscriptions breaks all types in this SFC
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
    },
    onBackToStreams() {
      this.$router.push('/streams')
    },
    async onRequestAccess() {
      if (this.hasStreamAccessRequest) return

      const { data, errors } = await this.$apollo
        .mutate({
          mutation: CreateStreamAccessRequestDocument,
          variables: {
            streamId: this.streamId
          },
          update: (cache, { data }) => {
            if (!data?.streamAccessRequestCreate.id) return

            // Update GetStreamAccessRequest query
            const newReq = data.streamAccessRequestCreate
            cache.writeQuery({
              query: GetStreamAccessRequestDocument,
              variables: { streamId: this.streamId },
              data: { streamAccessRequest: { ...newReq } },
              overwrite: true
            })
          }
        })
        .catch(convertThrowIntoFetchResult)

      if (data?.streamAccessRequestCreate.id) {
        this.$triggerNotification({
          text: 'A stream access request has been submitted'
        })
      } else {
        this.$triggerNotification({
          text: getFirstErrorMessage(errors),
          type: 'error'
        })
      }
    }
  }
})
</script>
