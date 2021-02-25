<template>
  <v-list-item class="px-0">
    <v-list-item-content>
      <v-list-item-title>
        <v-chip small class="mr-2">{{ token.id }}</v-chip>
        <b>{{ token.name }}</b>
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        <b>Created:</b>
        {{ token.createdAt | dateParse() | dateFormat('DD MMM YYYY') }}
        <b>Last Used:</b>
        {{ token.lastUsed | dateParse() | dateFormat('DD MMM YYYY') }}
        <b>Scopes:</b>
        {{ token.scopes }}
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <v-btn small text color="error" @click="showRevokeConfirm = true">
        <v-icon small class="mr-2">mdi-delete</v-icon>
        delete
      </v-btn>
    </v-list-item-action>

    <v-dialog v-model="showRevokeConfirm" width="500">
      <v-card class="pa-0 transparent">
        <v-alert type="info" class="ma-0">
          <h3>Are you sure?</h3>
          You cannot undo this action. This will permanently delete the
          <b>{{ token.name }}</b>
          token. Any scripts relying on it will stop working.
          <v-divider class="my-3"></v-divider>
          <v-btn text color="error" @click="revokeToken">Delete</v-btn>
          <v-btn @click="showRevokeConfirm = false">Cancel</v-btn>
        </v-alert>
      </v-card>
    </v-dialog>
  </v-list-item>
</template>
<script>
import gql from 'graphql-tag'

export default {
  components: {},
  props: {
    token: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      showRevokeConfirm: false
    }
  },
  methods: {
    async revokeToken() {
      this.$matomo && this.$matomo.trackPageView('user/token/revoke')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation {
              apiTokenRevoke(token: "${this.token.id}")
            }
          `
        })
        this.$emit('deleted')
        this.showRevokeConfirm = false
      } catch (e) {
        console.log(e)
      }
    }
  }
}
</script>
