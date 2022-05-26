<template>
  <v-container fluid class="px-0 py-0" xxxstyle="max-width: 768px">
    <portal v-if="stream && canRenderToolbarPortal" to="toolbar">
      <div class="d-flex align-center">
        <div class="text-truncate">
          <router-link
            v-tooltip="stream.name"
            class="text-decoration-none space-grotesk mx-1"
            :to="`/streams/${stream.id}`"
          >
            <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
            <b>{{ stream.name }}</b>
          </router-link>
        </div>
        <div class="text-truncate flex-shrink-0">
          /
          <v-icon small class="mr-2 mb-1 hidden-xs-only">mdi-account-multiple</v-icon>
          <span class="space-grotesk">Collaborators</span>
        </div>
      </div>
    </portal>
    <v-row justify="center">
      <v-col v-if="stream.role !== 'stream:owner'" cols="12">
        <v-alert type="warning">
          Your permission level ({{ stream.role }}) is not high enough to edit this
          stream's collaborators.
        </v-alert>
      </v-col>

      <v-col v-if="serverInfo" cols="12">
        <v-row>
          <v-col v-if="stream && stream.role === 'stream:owner'" cols="12">
            <section-card :elevation="4">
              <v-progress-linear v-show="loading" indeterminate></v-progress-linear>
              <template slot="header">
                <v-icon small class="mr-2 mb-1">mdi-account-plus</v-icon>
                <span class="d-inline-block">Add contributors</span>
              </template>

              <v-card-text>
                <v-text-field
                  v-model="search"
                  label="Search for a user"
                  clearable
                  persistent-hint
                />
                <div class="caption">You can search by name or email.</div>
                <div v-if="$apollo.loading">Searching.</div>
                <v-list
                  v-if="search && search.length >= 3 && userSearch && userSearch.items"
                  rounded
                  dense
                  one-line
                  class="px-0 mx-0 transparent"
                >
                  <v-list-item
                    v-if="filteredSearchResults.length === 0"
                    class="px-0 mx-0"
                  >
                    <v-list-item-content>
                      <v-list-item-title>No users found.</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item
                    v-if="filteredSearchResults.length === 0"
                    class="px-0 mx-0"
                  >
                    <v-list-item-action>
                      <v-btn color="primary" @click="showStreamInviteDialog">
                        Invite {{ search }}
                      </v-btn>
                    </v-list-item-action>
                  </v-list-item>
                  <v-list-item
                    v-for="item in filteredSearchResults"
                    v-else
                    :key="item.id"
                    @click="addCollab(item)"
                  >
                    <v-list-item-avatar>
                      <user-avatar
                        :id="item.id"
                        :name="item.name"
                        :avatar="item.avatar"
                        :size="25"
                        class="ml-1"
                      ></user-avatar>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.company ? item.company : 'no company info' }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-icon>mdi-plus</v-icon>
                    </v-list-item-action>
                  </v-list-item>
                </v-list>
              </v-card-text>
              <stream-invite-dialog
                ref="streamInviteDialog"
                :stream-id="stream.id"
                :text="search"
              />
            </section-card>
          </v-col>
          <v-col v-for="role in roles" :key="role.name" cols="12" md="4">
            <section-card v-if="role" expandable>
              <template slot="header">
                <span class="text-capitalize">{{ role.name.split(':')[1] }}s</span>
              </template>
              <template slot="actions">
                <v-spacer></v-spacer>
                <v-badge
                  inline
                  :content="getRoleCount(role.name)"
                  :color="`grey ${$vuetify.theme.dark ? 'darken-1' : 'lighten-1'}`"
                ></v-badge>
              </template>
              <v-card-text class="flex-grow-1" style="height: 100px">
                {{ role.description }}
              </v-card-text>
              <v-card-text v-if="role.name === 'stream:reviewer'">
                <div
                  v-for="user in reviewers"
                  :key="user.id"
                  class="d-flex align-center mb-2"
                >
                  <user-role
                    :user="user"
                    :roles="roles"
                    :disabled="stream.role !== 'stream:owner'"
                    @update-user-role="(e) => setUserPermissions(e)"
                    @remove-user="removeUser"
                  />
                </div>
              </v-card-text>
              <v-card-text v-if="role.name === 'stream:contributor'">
                <div
                  v-for="user in contributors"
                  :key="user.id"
                  class="d-flex align-center mb-2"
                >
                  <user-role
                    :user="user"
                    :roles="roles"
                    :disabled="stream.role !== 'stream:owner'"
                    @update-user-role="(e) => setUserPermissions(e)"
                    @remove-user="removeUser"
                  />
                </div>
              </v-card-text>
              <v-card-text v-if="role.name === 'stream:owner'">
                <div
                  v-for="user in owners"
                  :key="user.id"
                  class="d-flex align-center mb-2"
                >
                  <user-role
                    :user="user"
                    :roles="roles"
                    :disabled="stream.role !== 'stream:owner'"
                    @update-user-role="(e) => setUserPermissions(e)"
                    @remove-user="removeUser"
                  />
                </div>
              </v-card-text>
            </section-card>
          </v-col>
        </v-row>
        <v-row v-if="false" align="stretch">
          <v-col v-for="role in roles" :key="role.name" cols="12" sm="4">
            <v-card
              rounded="lg"
              style="height: 100%"
              :class="`${
                !$vuetify.theme.dark ? 'grey lighten-5' : ''
              } d-flex flex-column`"
            >
              <v-toolbar style="flex: none" flat>
                <v-toolbar-title class="text-capitalize">
                  {{ role.name.split(':')[1] }}s
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-badge
                  inline
                  :content="getRoleCount(role.name)"
                  :color="`grey ${$vuetify.theme.dark ? 'darken-1' : 'lighten-1'}`"
                ></v-badge>
              </v-toolbar>
              <v-card-text class="flex-grow-1">{{ role.description }}</v-card-text>
              <v-card-text class="mt-auto">
                <div v-if="role.name === 'stream:reviewer'" class="align-self-end">
                  <user-avatar
                    v-for="user in reviewers"
                    :id="user.id"
                    :key="user.id"
                    :avatar="user.avatar"
                    :name="user.name"
                    :size="30"
                  />
                  <span v-if="reviewers.length === 0">No users with this role.</span>
                </div>
                <div v-if="role.name === 'stream:contributor'">
                  <user-avatar
                    v-for="user in contributors"
                    :id="user.id"
                    :key="user.id"
                    :avatar="user.avatar"
                    :name="user.name"
                    :size="30"
                  />
                  <span v-if="contributors.length === 0">No users with this role.</span>
                </div>
                <div v-if="role.name === 'stream:owner'">
                  <user-avatar
                    v-for="user in owners"
                    :id="user.id"
                    :key="user.id"
                    :avatar="user.avatar"
                    :name="user.name"
                    :size="30"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import gql from 'graphql-tag'
import streamCollaboratorsQuery from '@/graphql/streamCollaborators.gql'
import userSearchQuery from '@/graphql/userSearch.gql'
import { FullServerInfoQuery } from '@/graphql/server'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  name: 'TheCollaborators',
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    UserRole: () => import('@/main/components/stream/UserRole'),
    SectionCard: () => import('@/main/components/common/SectionCard'),
    StreamInviteDialog: () => import('@/main/dialogs/StreamInviteDialog')
  },
  mixins: [
    buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'stream-collaborators', 1)
  ],
  data: () => ({
    search: '',
    selectedUsers: null,
    selectedRole: null,
    userSearch: { items: [] },
    serverInfo: { roles: [] },
    loading: false
  }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamCollaboratorsQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    },
    userSearch: {
      query: userSearchQuery,
      variables() {
        return {
          query: this.search,
          limit: 25
        }
      },
      skip() {
        return !this.search || this.search.length < 3
      },
      debounce: 300,
      // if the same query is input after adding a contributor, it doesn't show the proper results with caching
      // the cause was the error on the filtered search results prop breaking
      // but it still can be reasonable to disable this query caching for any user permission changes
      // happening while the cache is still active
      fetchPolicy: 'no-cache'
    },
    serverInfo: {
      prefetch: true,
      query: FullServerInfoQuery
    }
  },
  computed: {
    roles() {
      if (this.serverInfo.roles.length === 0) return []
      const temp = this.serverInfo.roles.filter((x) => x.resourceTarget === 'streams')
      const ret = [null, null, null]
      // World's most idiotic way of enforcing order
      for (const role of temp) {
        if (role.name === 'stream:owner') {
          ret[0] = role
        } else if (role.name === 'stream:contributor') {
          ret[1] = role
        } else if (role.name === 'stream:reviewer') {
          ret[2] = role
        } else {
          ret.push(role)
        }
      }
      return ret
    },
    collaborators() {
      if (!this.stream) return []
      return this.stream.collaborators.filter((user) => user.id !== this.myId)
    },
    reviewers() {
      if (!this.stream) return []
      return this.stream.collaborators.filter((u) => u.role === 'stream:reviewer')
    },
    contributors() {
      if (!this.stream) return []
      return this.stream.collaborators.filter((u) => u.role === 'stream:contributor')
    },
    owners() {
      if (!this.stream) return []
      return this.stream.collaborators.filter((u) => u.role === 'stream:owner')
    },
    filteredSearchResults() {
      if (!this.userSearch) return null
      const users = []
      for (const u of this.userSearch.items) {
        if (u.id === this.myId) continue
        const indx = this.collaborators.findIndex((eu) => eu.id === u.id)
        if (indx === -1) users.push(u)
      }
      return users
    },
    myId() {
      return localStorage.getItem('uuid')
    }
  },
  methods: {
    getRoleCount(role) {
      if (role === 'stream:owner') return this.owners.length || '0'
      if (role === 'stream:contributor') return this.contributors.length || '0'
      if (role === 'stream:reviewer') return this.reviewers.length || '0'
    },
    async removeUser(user) {
      this.loading = true
      this.$mixpanel.track('Permission Action', { type: 'action', name: 'remove' })
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation streamRevokePermission($params: StreamRevokePermissionInput!) {
              streamRevokePermission(permissionParams: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.stream.id,
              userId: user.id
            }
          }
        })
        const index = this.stream.collaborators.findIndex((u) => u.id === user.id)
        if (index !== -1) {
          this.stream.collaborators.splice(index, 1)
        }
      } catch (e) {
        // console.log(e)
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
      this.$apollo.queries.stream.refetch()
      this.loading = false
    },
    async setUserPermissions(user) {
      // console.log(user)
      this.loading = true
      await this.grantPermissionUser(user)
      this.loading = false
      this.$apollo.queries.stream.refetch()
    },
    async addCollab(user) {
      this.loading = true
      this.search = null
      // the line below is meant to disable the apollo cache? if so, its not doing that
      // rather it breaks the filteredSearchResults computed property
      // which in turn fails silently, without any errors, just not having values
      // TODO: check with Dim
      // this.userSearch.items = null
      user.role = 'stream:contributor'
      await this.grantPermissionUser(user)
      this.stream.collaborators.unshift(user)
      this.loading = false
      this.$apollo.queries.stream.refetch()
    },
    async grantPermissionUser(user) {
      this.$mixpanel.track('Permission Action', { type: 'action', name: 'add' })
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation grantPerm($params: StreamGrantPermissionInput!) {
              streamGrantPermission(permissionParams: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.stream.id,
              userId: user.id,
              role: user.role
            }
          }
        })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
    },
    showStreamInviteDialog() {
      this.$refs.streamInviteDialog.show()
    }
  }
}
</script>
