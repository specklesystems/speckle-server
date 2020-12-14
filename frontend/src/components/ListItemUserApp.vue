<template>
  <v-list-item class="px-0">
    <v-list-item-content>
      <v-list-item-title>
        <v-chip small class="mr-2">{{ app.id }}</v-chip>
        <b>{{ app.name }}</b>
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        {{ app.description }} | Redirects to: {{ app.redirectUrl }}
        <!-- <b>Created:</b>
        {{ token.createdAt | dateParse() | dateFormat("DD MMM YYYY") }}
        <b>Last Used:</b>
        {{ token.lastUsed | dateParse() | dateFormat("DD MMM YYYY") }} -->
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <v-btn small text disabled @click="">
        <v-icon small class="mr-2">mdi-pencil</v-icon>
        edit
      </v-btn>
    </v-list-item-action>
    <v-list-item-action>
      <v-btn small text color="error" @click="showRevokeConfirm = true">
        <v-icon small class="mr-2">mdi-delete</v-icon>
        delete
      </v-btn>
    </v-list-item-action>
    <v-dialog v-model="showRevokeConfirm" width="500">
      <v-card class="pa-3">
        <v-card-title>Are you sure?</v-card-title>
        <v-card-text>
          You cannot undo this action. This will permanently delete the <b>{{ app.name }}</b> app.
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="revokeApp">Delete</v-btn>
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
    app: {
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
    async revokeApp() {
      // try {
      //   await this.$apollo.mutate({
      //     mutation: gql`
      //       mutation {
      //         apiTokenRevoke(token: "${this.token.id}")
      //       }
      //     `
      //   })
      //   this.$emit("deleted")
      //   this.showRevokeConfirm = false
      // } catch (e) {
      //   console.log(e)
      // }
    }
  }
}
</script>
