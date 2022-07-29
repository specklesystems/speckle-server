<template>
  <div>
    <v-card outlined class="d-flex align-center pa-2">
      <div class="flex-grow-1">
        <v-chip small class="mr-2">{{ token.id }}</v-chip>
        <b>{{ token.name }}</b>
      </div>
      <div class="caption">
        <b>Created:</b>
        {{ token.createdAt | dateParse() | dateFormat('DD MMM YYYY') }}
        <b>Last Used:</b>
        {{ token.lastUsed | dateParse() | dateFormat('DD MMM YYYY') }}
        <b>Scopes:</b>
        {{ token.scopes }}
      </div>
      <div>
        <v-btn small text color="error" @click="showRevokeConfirm = true">
          <v-icon small class="mr-2">mdi-delete</v-icon>
          delete
        </v-btn>
      </div>
    </v-card>
    <v-dialog v-model="showRevokeConfirm" width="500">
      <v-card>
        <v-card-title>Are you sure?</v-card-title>
        <v-card-text>
          You cannot undo this action. This will permanently delete the
          <b>{{ token.name }}</b>
          token. Any scripts relying on it will stop working.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text color="error" @click="revokeToken">Delete</v-btn>
          <v-btn @click="showRevokeConfirm = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'

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
      this.$mixpanel.track('Token Action', { type: 'action', name: 'delete' })
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
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
    }
  }
}
</script>
