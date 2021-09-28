<template>
  <div id="admin-settings">
    <v-card v-if="serverInfo" rounded="lg">
      <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
        <v-toolbar-title>{{ serverInfo.name }}</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <div key="viewPanel">
          <div v-for="(value, name) in serverDetails" :key="name" class="d-flex align-center mb-2">
            <div class="flex-grow-1">
              <div v-if="value.type == 'boolean'">
                <p class="mt-2">{{ value.label }}</p>
                <v-switch
                  v-model="serverModifications[name]"
                  inset
                  persistent-hint
                  class="pa-1 ma-1 caption"
                >
                  <template #label>
                    <span class="caption">{{ value.hint }}</span>
                  </template>
                </v-switch>
              </div>
              <v-text-field
                v-else
                v-model="serverModifications[name]"
                persistent-hint
                :hint="value.hint"
                class="ma-0 body-2"
              ></v-text-field>
            </div>
          </div>
          <p class="mt-2">{{ defaultGlobals.label }}</p>
          <div class="flex-grow-1">
            <v-textarea
              v-model="defaultGlobalsString"
              persistent-hint
              :hint="defaultGlobals.hint"
              :rules="rules.checkGlobals()"
              class="ma-0 body-2"
              rows="2"
            ></v-textarea>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn block color="primary" :loading="loading" @click="saveEdit">Save</v-btn>
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
        },
        createDefaultGlobals: {
          label: 'Add default globals on stream creation',
          hint:
            'Whether to automatically add the specified set of globals to all streams created on this server',
          type: 'boolean'
        }
      },
      defaultGlobals: {
        label: 'Default globals',
        hint:
          'A json string containing a set of default globals and their default values, to be added to all streams on this server on stream creation'
      },
      rules: {
        checkGlobals() {
          return [
            (v) => {
              try {
                JSON.parse(v)
              } catch (e) {
                return 'Invalid JSON string'
              }
              return true
            }
          ]
        }
      },
      errors: []
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
            createDefaultGlobals
            defaultGlobals
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
  computed: {
    defaultGlobalsString: {
      set: function (value) {
        this.serverModifications.defaultGlobals = JSON.parse(value)
      },
      get: function () {
        return JSON.stringify(this.serverModifications.defaultGlobals)
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
    },
    validateDefaultGlobals: function () {
      const re = /[./]/
      let result =
        !re.test(this.serverModifications.defaultGlobals) ||
        'The name cannot contain invalid characters: "." or "/"'
      if (entries[index].valid === true) entries[index].valid = result
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
