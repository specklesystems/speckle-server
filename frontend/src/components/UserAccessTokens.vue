<template>
  <v-card color="background2" class="elevation-0 mt-3">
    <v-card-title>Personal Access Tokens</v-card-title>
    <v-card-text>
      Personal Access Tokens can be used to access the Speckle API on this
      server; they function like ordinary OAuth access tokens. Use them in your
      scripts or apps!
      <b>
        Treat them like a password: do not post them anywhere where they could
        be accessed by others (e.g., public repos).
      </b>
    </v-card-text>
    <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
    <v-card-text v-if="tokens">
      <v-list three-line>
        <list-item-token
          v-for="token in tokens"
          :key="token.id"
          :token="token"
          @deleted="refreshList"
        />
      </v-list>
    </v-card-text>
    <v-card-text>
      <v-btn @click="tokenDialog = true">new token</v-btn>
      <v-dialog v-model="tokenDialog" persistent width="500">
        <token-dialog @token-added="refreshList" @close="tokenDialog = false" />
      </v-dialog>
    </v-card-text>
  </v-card>
</template>
<script>
import gql from "graphql-tag"
import ListItemToken from "./ListItemPersonalAccessToken"
import TokenDialog from "./dialogs/TokenDialog"

export default {
  components: { ListItemToken, TokenDialog },
  data() {
    return {
      tokenDialog: false
    }
  },
  apollo: {
    tokens: {
      query: gql`
        query {
          user {
            id
            apiTokens {
              id
              name
              lastUsed
              lastChars
              createdAt
            }
          }
        }
      `,
      update: (data) => data.user.apiTokens
    }
  },
  methods: {
    refreshList() {
      this.$apollo.queries.tokens.refetch()
    }
  }
}
</script>
