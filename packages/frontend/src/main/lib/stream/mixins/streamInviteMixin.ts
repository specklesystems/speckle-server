import {
  StreamInviteQuery,
  useStreamInviteQuery,
  useStreamInviteMutation,
  StreamInviteDocument
} from '@/graphql/generated/graphql'
import { Nullable, vueWithMixins } from '@/helpers/typeHelpers'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import { IsLoggedInMixin } from '@/main/lib/core/mixins/isLoggedInMixin'
import { Get } from 'type-fest'
import { PropType } from 'vue'

// Cause of a limitation of vue-apollo-smart-ops, this needs to be duplicated
type VueThis = Vue & {
  streamId: string
  inviteId: Nullable<string>
  error: Nullable<Error>
}

/**
 * Mixin for getting the invite to the current stream, if any, and accepting/declining it
 *
 * Extends isLoggedInMixin, so you have access to that as well
 */
export const UsersStreamInviteMixin = vueWithMixins(IsLoggedInMixin).extend({
  props: {
    streamId: {
      type: String,
      required: true
    },
    inviteId: {
      type: String as PropType<Nullable<string>>,
      default: () => null
    }
  },
  data: () => ({
    streamInvite: null as Nullable<Get<StreamInviteQuery, 'streamInvite'>>,
    streamInviteClosed: false
  }),
  apollo: {
    streamInvite: useStreamInviteQuery<VueThis>({
      variables() {
        return {
          streamId: this.streamId,
          inviteId: this.inviteId
        }
      }
    })
  },
  computed: {
    streamInviter(): Nullable<Get<StreamInviteQuery, 'streamInvite.invitedBy'>> {
      return this.streamInvite?.invitedBy
    },
    hasInvite(): boolean {
      return !!(this.streamInvite && !this.streamInviteClosed)
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
      if (!this.streamInvite?.inviteId) return

      const { data, errors } = await useStreamInviteMutation(this, {
        variables: {
          accept,
          streamId: this.streamId,
          inviteId: this.streamInvite.inviteId
        },
        update: (cache, { data }) => {
          // Remove invite from cache
          if (data?.streamInviteUse) {
            cache.writeQuery({
              query: StreamInviteDocument,
              variables: { streamId: this.streamId, inviteId: this.inviteId },
              data: {
                streamInvite: null
              }
            })
          }
        }
      })

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
        this.$emit('invite-used', { accept })
      } else {
        const errMsg = errors?.[0].message || 'An unexpected issue occurred!'
        this.$triggerNotification({
          text: errMsg,
          type: 'error'
        })
      }
    }
  }
})
