<template>
  <div>
    <portal to="toolbar">Server Info and Settings</portal>
    <section-card>
      <v-card-text>Here you can edit your server's basic information.</v-card-text>
    </section-card>
    <div class="my-5"></div>
    <section-card>
      <v-card-text>
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
      </v-card-text>
      <v-card-actions>
        <v-btn block color="primary" :loading="loading" @click="saveEdit">Save</v-btn>
      </v-card-actions>
    </section-card>
  </div>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'ServerInfoAdminCard',
  components: {
    SectionCard: () => import('@/cleanup/components/common/SectionCard')
  },
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
