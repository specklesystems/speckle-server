<template>
  <v-card class="my-2">
    <v-card-text>{{ comment }}</v-card-text>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  props: {
    comment: { type: Object, default: () => null }
  },
  apollo: {
    commentDetails: {
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
      update(data) {
        console.log(data)
      }
    }
  }
}
</script>
