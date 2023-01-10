<template>
  <section-card expandable class="my-2" dense :elevation="2">
    <template #header>Access Tokens</template>
    <template #actions>
      <v-spacer />
      <v-btn small color="primary" @click="tokenDialog = true">new token</v-btn>
    </template>
    <v-card rounded="lg">
      <v-card-text>
        Personal Access Tokens can be used to access the Speckle API on this server;
        they function like ordinary OAuth access tokens. Use them in your scripts or
        apps!
        <b>
          Treat them like a password: do not post them anywhere where they could be
          accessed by others (e.g., public repos).
        </b>
      </v-card-text>
      <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
      <v-card-text v-if="tokens && tokens.length != 0">
        <v-row dense>
          <v-col v-for="token in tokens" :key="token.id" cols="12">
            <list-item-token :key="token.id" :token="token" @deleted="refreshList" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text v-else>You have no api tokens.</v-card-text>

      <v-dialog v-model="tokenDialog" width="500">
        <token-dialog @token-added="refreshList" @close="tokenDialog = false" />
      </v-dialog>
    </v-card>
  </section-card>
</template>
<script>
import { gql } from '@apollo/client/core'

export default {
  components: {
    ListItemToken: () => import('@/main/components/user/ListItemPersonalAccessToken'),
    TokenDialog: () => import('@/main/components/user/TokenDialog'),
    SectionCard: () => import('@/main/components/common/SectionCard')
  },
  data() {
    return {
      tokenDialog: false
    }
  },
  apollo: {
    tokens: {
      query: gql`
        query {
          activeUser {
            id
            apiTokens {
              id
              name
              lastUsed
              lastChars
              createdAt
              scopes
            }
          }
        }
      `,
      update: (data) => data.activeUser.apiTokens
    }
  },
  methods: {
    refreshList() {
      this.$apollo.queries.tokens.refetch()
    }
  }
}
</script>
