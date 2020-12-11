<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title>
        <v-chip small class="mr-2">{{ token.id }}</v-chip>
        <b>{{ token.name }}</b>
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        <b>Created:</b>
        {{ token.createdAt | dateParse() | dateFormat("DD MMM YYYY") }}
        <b>Last Used:</b>
        {{ token.lastUsed | dateParse() | dateFormat("DD MMM YYYY") }}
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <v-btn small icon @click="showRevokeConfirm = true">
        <v-icon color="error">mdi-delete</v-icon>
      </v-btn>
    </v-list-item-action>
    <v-dialog v-model="showRevokeConfirm" width="500">
      <v-card class="pa-3">
        <v-card-title>Are you sure?</v-card-title>
        <v-card-text>
          You cannot undo this action. This will permanently delete this token.
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="revokeToken">Delete</v-btn>
          <v-btn @click="showRevokeConfirm = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-list-item>
</template>
<script>
import gql from "graphql-tag"

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
