import {
  StreamInviteQuery,
  StreamInviteDocument,
  UserStreamInvitesQuery,
  UserStreamInvitesDocument,
  UseStreamInviteDocument
} from '@/graphql/generated/graphql'
import { MaybeFalsy, Nullable, vueWithMixins } from '@/helpers/typeHelpers'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import { IsLoggedInMixin } from '@/main/lib/core/mixins/isLoggedInMixin'
import type { Get } from 'type-fest'
import { PropType } from 'vue'

export type StreamInviteType = NonNullable<Get<StreamInviteQuery, 'streamInvite'>>

/**
 * Mixin for getting the invite to the current stream, if any, and accepting/declining it
 *
 * Extends isLoggedInMixin, so you have access to that as well
 */
export const UsersStreamInviteMixin = vueWithMixins(IsLoggedInMixin).extend({
  props: {
    streamInvite: {
      type: Object as PropType<StreamInviteType>,
      required: true
    },
    inviteToken: {
      type: String as PropType<Nullable<string>>,
      default: null
    },
    autoAccept: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    streamInviteClosed: false
  }),
  computed: {
    streamId(): string {
      return this.streamInvite.streamId
    },
    inviteId(): string {
      return this.streamInvite.inviteId
    },
    token(): Nullable<string> {
      return this.streamInvite.token || this.inviteToken || null
    },
    streamInviter(): NonNullable<Get<StreamInviteQuery, 'streamInvite.invitedBy'>> {
      return this.streamInvite.invitedBy
    },
    hasInvite(): boolean {
      return !!(this.streamInvite && !this.streamInviteClosed)
    },
    streamName(): string {
      return this.streamInvite.streamName
    },
    linkToStream(): string {
      return `/streams/${this.streamId}`
    }
  },
  methods: {
    acceptInvite() {
      return this.processInvite(true)
    },
    declineInvite() {
      return this.processInvite(false)
    },
    rememberInviteAndRedirectToLogin() {
      this.$loginAndSetRedirect()
    },
    async processInvite(accept: boolean) {
      if (!this.token) return

      const { data, errors } = await this.$apollo
        .mutate({
          mutation: UseStreamInviteDocument,
          variables: {
            accept,
            streamId: this.streamId,
            token: this.token
          },
          update: (cache, { data }) => {
            if (!data?.streamInviteUse) return

            // It's weird that i'm emitting from inside the update handler, but if I invoke the emit
            // at the bottom of `processInvite()`, the event won't be fired because of a race condition
            // between the cache updates below and the queries that rely on the cached invites in the parent
            // component. Basically - I have to do it this way or the event won't be handled
            this.$emit('invite-used', { accept })

            // Remove invite from various cached queries we might have
            // 1. Single stream invite query
            const singleStreamInviteCacheFilter = {
              query: StreamInviteDocument,
              variables: { streamId: this.streamId, token: this.token }
            }
            let singleStreamInviteQueryData: MaybeFalsy<StreamInviteQuery> = undefined
            try {
              singleStreamInviteQueryData = cache.readQuery<StreamInviteQuery>(
                singleStreamInviteCacheFilter
              )
            } catch (err) {
              // suppressed
            }

            if (singleStreamInviteQueryData?.streamInvite) {
              cache.writeQuery({
                ...singleStreamInviteCacheFilter,
                data: {
                  streamInvite: null
                },
                overwrite: true
              })
            }

            // 2. All user's stream invites query
            let allUsersStreamInvitesQueryData: MaybeFalsy<UserStreamInvitesQuery> =
              undefined
            try {
              allUsersStreamInvitesQueryData = cache.readQuery<UserStreamInvitesQuery>({
                query: UserStreamInvitesDocument
              })
            } catch (err) {
              // suppressed
            }

            if (allUsersStreamInvitesQueryData?.streamInvites) {
              const removableInviteIdx =
                allUsersStreamInvitesQueryData.streamInvites.findIndex(
                  (i) => i.inviteId === this.inviteId
                )
              if (removableInviteIdx !== -1) {
                const newInvites = allUsersStreamInvitesQueryData.streamInvites.slice()
                newInvites.splice(removableInviteIdx, 1)

                cache.writeQuery<UserStreamInvitesQuery>({
                  query: UserStreamInvitesDocument,
                  data: {
                    ...allUsersStreamInvitesQueryData,
                    streamInvites: newInvites
                  },
                  overwrite: true
                })
              }
            }
          }
        })
        .catch(convertThrowIntoFetchResult)

      if (data?.streamInviteUse) {
        this.$triggerNotification({
          text: accept
            ? "You've been successfully added as a stream contributor!"
            : "You've declined the invite",
          type: accept ? 'success' : 'primary'
        })

        // Refetch stream operations, if accepted
        if (accept) {
          this.$eventHub.$emit(StreamEvents.Refetch)
        }

        this.streamInviteClosed = true
      } else {
        const errMsg = errors?.[0].message || 'An unexpected issue occurred!'
        this.$triggerNotification({
          text: errMsg,
          type: 'error'
        })
      }
    }
  },
  mounted() {
    if (this.autoAccept) {
      this.acceptInvite()
    }
  }
})
