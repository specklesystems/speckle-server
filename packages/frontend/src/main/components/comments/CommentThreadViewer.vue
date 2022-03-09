<template>
  <div class="mt-2 pa-1 d-flex align-center" style="width: 300px">
    <div class="">
      <template v-for="(reply, index) in thread">
        <div v-if="index % 3 === 0" :key="index + 'date'" class="d-flex justify-center mouse">
          <div class="d-inline px-2 py-0 caption text-center mb-2 rounded-lg background grey--text">
            {{ new Date(Date.now()).toLocaleString() }}
          </div>
        </div>
        <div
          :key="index"
          :class="`d-flex px-2 py-1 mb-2 align-center rounded-xl elevation-2 ${
            $userId() === reply.authorId ? 'primary white--text' : 'background'
          }`"
        >
          <div :class="`${$userId() === reply.authorId ? 'order-last' : ''}`">
            <user-avatar :id="reply.authorId" :size="30" />
          </div>
          <div :class="`mx-2 px-4 py-2 flex-grow-1 float-left caption`">
            {{ reply.text }}
          </div>
        </div>
      </template>
      <div class="px-0 mb-4">
        <v-textarea
          solo
          hide-details
          auto-grow
          rows="1"
          placeholder="Reply"
          class="rounded-xl mb-2 caption"
          append-icon="mdi-send"
          @click:append="addReply"
        ></v-textarea>
      </div>
    </div>
  </div>
</template>
<script>
import gql from 'graphql-tag'
export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    comment: { type: Object, default: () => null }
  },
  apollo: {
    barf: {
      query: gql`
        query($streamId: String!, $id: String!) {
          comment(streamId: $streamId, id: $id) {
            id
            replies(limit: 1000) {
              totalCount
              cursor
              items {
                id
                text
                authorId
                createdAt
              }
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.comment.id
        }
      },
      skip() {
        return !this.comment.expanded
      },
      // result({ data }) {
      //   console.log('data')
      //   console.log(data)
      // },
      update: (data) => {
        console.log(data)
        return data.comment
      }
    }
  },
  data: function () {
    return {
      replyText: null
    }
  },
  computed: {
    thread() {
      // TODO: add the replies in here too
      return [this.comment]
    }
  },
  methods: {
    async addReply() {
      if (!this.commentText || this.commentText.length < 5) {
        this.$eventHub.$emit('notification', {
          text: `Reply must be at least 5 characters.`
        })
        return
      }

      let commentInput = {
        streamId: this.$route.params.streamId,
        resources: [{ resourceId: this.comment.id, resourceType: 'comment' }],
        text: this.replyText
      }

      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commentCreate($input: CommentCreateInput!) {
              commentCreate(input: $input)
            }
          `,
          variables: { input: commentInput }
        })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }

      setTimeout(() => {
        this.$emit('reply-added') // needed for layout reshuffle in parent
      }, 100)
    }
  }
}
</script>
<style scoped>
.no-mouse {
  pointer-events: none;
}
.mouse {
  pointer-events: auto;
}
</style>
