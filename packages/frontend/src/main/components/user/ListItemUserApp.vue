<template>
  <v-card outlined class="d-flex align-center pa-2">
    <v-list-item-content>
      <v-list-item-title class="mb-2">
        <v-chip small class="mr-2">
          <b class="mr-1">Id:</b>
          {{ app.id }}
        </v-chip>
        <b>{{ app.name }}</b>
      </v-list-item-title>
      <v-list-item-subtitle class="caption pl-1">
        {{ app.description }} | Redirects to:
        <a :href="app.redirectUrl" target="_blank">{{ app.redirectUrl }}</a>
      </v-list-item-subtitle>
    </v-list-item-content>
    <div>
      <v-btn small text @click="showSecret = true">
        <v-icon small class="mr-2">mdi-key</v-icon>
        reveal secret
      </v-btn>
      <v-btn small text color="primary" @click="appDialog = true">
        <v-icon small class="mr-2">mdi-cog-outline</v-icon>
        edit
      </v-btn>
      <v-btn small text color="error" @click="showRevokeConfirm = true">
        <v-icon small class="mr-2">mdi-delete</v-icon>
        delete
      </v-btn>
    </div>
    <v-dialog v-model="appDialog" width="500">
      <app-edit-dialog
        :app-id="app.id"
        :app-name="app.name"
        :app-secret="app.secret"
        :app-url="app.redirectUrl"
        :app-description="app.description"
        :app-scopes="appScopesList"
        :app-dialog="appDialog"
        @app-edited="emitEdits()"
        @close="appDialog = false"
      />
    </v-dialog>
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
    <v-dialog v-model="showRevokeConfirm" width="500">
      <v-card class="pa-0 transparent">
        <v-alert type="info" class="ma-0">
          <h3>Are you sure?</h3>
          You cannot undo this action. This will permanently delete the
          <b>{{ app.name }}</b>
          app. Existing users will not be able to use it anymore.
          <v-divider class="my-3"></v-divider>
          <v-btn text color="error" @click="deleteApp">Delete</v-btn>
          <v-btn text @click="showRevokeConfirm = false">Cancel</v-btn>
        </v-alert>
      </v-card>
    </v-dialog>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import AppEditDialog from '@/main/components/user/AppEditDialog'

export default {
  components: { AppEditDialog },
  props: {
    app: {
      type: Object,
      default: () => {}
    }
  },
  apollo: {
    appScopes: {
      query: gql`
        query ($id: String!) {
          app(id: $id) {
            id
            name
            secret
            scopes {
              name
            }
          }
        }
      `,
      variables() {
        return { id: this.app.id }
      },
      update: (data) => data.app.scopes,
      skip() {
        return !this.app.id
      }
    }
  },
  data() {
    return {
      showRevokeConfirm: false,
      showSecret: false,
      appDialog: false,
      appScopesList: []
    }
  },
  watch: {
    appScopes(val) {
      const scopeList = []
      val.forEach((obj) => {
        scopeList.push(obj.name)
      })
      this.appScopesList = [...scopeList]
    }
  },
  methods: {
    async deleteApp() {
      this.$mixpanel.track('App Action', { type: 'action', name: 'delete' })
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
    },
    emitEdits() {
      this.$emit('app-edited')
    }
  }
}
</script>
