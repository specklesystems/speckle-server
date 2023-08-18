<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">Server Info and Settings</portal>
    <section-card>
      <v-card-text>Here you can edit your server's basic information.</v-card-text>
    </section-card>
    <div class="my-5"></div>
    <section-card>
      <v-card-text>
        <div
          v-for="(value, name) in serverDetails"
          :key="name"
          class="d-flex align-center mb-2"
        >
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
import { gql } from '@apollo/client/core'
import { mainServerInfoQuery } from '@/graphql/server'
import pick from 'lodash/pick'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  name: 'ServerSettings',
  components: {
    SectionCard: () => import('@/main/components/common/SectionCard')
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'admin-settings', 1)],
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
        guestModeEnabled: {
          label: 'Guest mode',
          hint: "Enable the 'Guest' server role, which allows users to only contribute to streams that they're invited to",
          type: 'boolean'
        }
      }
    }
  },
  apollo: {
    serverInfo: {
      query: mainServerInfoQuery,
      result({ data }) {
        const newModifications = Object.assign({}, data.serverInfo)
        delete newModifications.__typename

        this.serverModifications = newModifications
      }
    }
  },
  methods: {
    async saveEdit() {
      this.loading = true
      const changes = pick(this.serverModifications, Object.keys(this.serverDetails))
      await this.$apollo.mutate({
        mutation: gql`
          mutation ($info: ServerInfoUpdateInput!) {
            serverInfoUpdate(info: $info)
          }
        `,
        variables: {
          info: changes
        },
        update: (cache) => {
          cache.writeQuery({
            query: mainServerInfoQuery,
            data: {
              serverInfo: {
                ...this.serverInfo,
                ...changes
              }
            }
          })
        }
      })
      // await this.$apollo.queries['serverInfo'].refetch()
      this.loading = false
    }
  }
}
</script>
