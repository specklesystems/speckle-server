<template>
  <div id="admin-settings">
  <v-card rounded="lg" v-if="serverInfo">
    <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
      <v-toolbar-title>{{ serverInfo.name }}</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <div key="viewPanel">
        <div class="d-flex align-center mb-2" v-for="(value, name) in serverDetails" :key="name">
          <div class="flex-grow-1">
            <div v-if="value.type == 'boolean'">
              <p class="mt-2">{{value.label}}</p>
              <v-switch
                inset
                persistent-hint
                v-model="serverModifications[name]"
                class="pa-1 ma-1 caption"
              >
                <template v-slot:label>
                  <span class="caption">{{ value.hint }}</span>
                </template>
              </v-switch>
            </div>
            <v-text-field
              persistent-hint
              v-else
              :hint="value.hint"
              v-model="serverModifications[name]"
              class="ma-0 body-2"
            ></v-text-field>
          </div>
        </div>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn block color="primary" @click="saveEdit" :loading="loading">Save</v-btn>
    </v-card-actions>
  </v-card>
  </div>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'ServerInfoAdminCard',
  components: {},
  data() {
    return {
      edit: false,
      loading: false,
      serverModifications: {},
      serverDetails: {
        name: {
          label: 'Name',
          hint: "This server's public name"
        },
        description: {
          label: 'Description',
          hint: 'A short description of this server'
        },
        company: {
          label: 'Company',
          hint: 'The owner of this server'
        },
        adminContact: {
          label: 'Admin contact',
          hint: 'The administrator of this server'
        },
        termsOfService: {
          label: 'Terms of service',
          hint: 'Url pointing to the terms of service page'
        },
        inviteOnly: {
          label: 'Invite-Only mode',
          hint: 'Only users with an invitation will be able to join',
          type: 'boolean'
        }
      }
    }
  },
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            description
            adminContact
            termsOfService
            inviteOnly
          }
        }
      `,
      update(data) {
        delete data.serverInfo.__typename
        this.serverModifications = Object.assign({}, data.serverInfo)
        return data.serverInfo
      }
    }
  },
  methods: {
    async saveEdit() {
      this.loading = true
      await this.$apollo.mutate({
        mutation: gql`
          mutation($info: ServerInfoUpdateInput!) {
            serverInfoUpdate(info: $info)
          }
        `,
        variables: {
          info: this.serverModifications
        }
      })
      await this.$apollo.queries['serverInfo'].refetch()
      this.loading = false
    }
  }
}
</script>

<style scoped lang="scss">
#admin-settings {
  .v-card:not(:last-child) {
    margin-bottom: 1em;
  }
}
</style>
