<template>
  <v-list-item class="px-0">
    <v-list-item-content>
      <v-list-item-title class="mb-2">
        <v-chip small class="mr-2">
          <b class="mr-1">Id:</b>
          {{ app.id }}
        </v-chip>
        <v-chip small class="mr-2" @click="showSecret = true">show secret</v-chip>
        <v-dialog v-model="showSecret" width="500">
          <v-card class="">
            <v-card-title>
              {{ app.name }}
            </v-card-title>
            <v-card-text>
              App secret:
              <code>{{ app.secret }}</code>
            </v-card-text>
          </v-card>
        </v-dialog>
        <b>{{ app.name }}</b>
      </v-list-item-title>
      <v-list-item-subtitle class="caption pl-1">
        {{ app.description }} | Redirects to:
        <a :href="app.redirectUrl" target="_blank">{{ app.redirectUrl }}</a>
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
          <b>{{ app.name }}</b>
          app. Existing users will not be able to use it anymore.
          <v-divider class="my-3"></v-divider>
          <v-btn text color="error" @click="revokeApp">Delete</v-btn>
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
    app: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      showRevokeConfirm: false,
      showSecret: false
    }
  },
  methods: {
    async revokeApp() {
      this.$matomo && this.$matomo.trackPageView('user/app/revoke')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation {
              appDelete(appId: "${this.app.id}")
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
