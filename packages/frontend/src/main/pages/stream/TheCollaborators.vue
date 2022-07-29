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
    <v-row v-if="stream" justify="center">
      <v-col v-if="serverInfo && stream" cols="12">
        <!-- Add contributors panel -->
        <v-row>
          <v-col v-if="isStreamOwner" cols="12">
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

                <!-- Search results -->
                <v-list
                  v-if="search && search.length >= 3 && userSearch && userSearch.items"
                  rounded
                  dense
                  one-line
                  class="px-0 mx-0 transparent"
                >
                  <!-- No users found -->
                  <template v-if="filteredSearchResults.length === 0">
                    <v-list-item class="px-0 mx-0">
                      <v-list-item-content>
                        <v-list-item-title>No users found.</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item class="px-0 mx-0">
                      <v-list-item-action>
                        <v-btn color="primary" @click="showNonexistantUserInviteDialog">
                          Invite {{ search }}
                        </v-btn>
                      </v-list-item-action>
                    </v-list-item>
                  </template>

                  <!-- Users found -->
                  <basic-user-info-row
                    v-for="user in filteredSearchResults"
                    v-else
                    :key="user.id"
                    :user="user"
                    @click="showUserInviteDialog(user)"
                  >
                    <template #actions>
                      <v-btn color="primary">Invite</v-btn>
                    </template>
                  </basic-user-info-row>
                </v-list>
              </v-card-text>
              <invite-dialog
                :stream-id="stream.id"
                :email="inviteDialogEmail"
                :user="inviteDialogUser"
                :visible.sync="inviteDialogVisible"
                @invite-sent="onInviteSent"
              />
            </section-card>
          </v-col>

          <!-- No permissions warning -->
          <v-col v-if="stream.role !== 'stream:owner'" cols="12">
            <v-alert type="warning" class="mb-0">
              Your permission level ({{ stream.role ? stream.role : 'none' }}) is not
              high enough to edit this stream's collaborators.
            </v-alert>
          </v-col>

          <!-- Current users/invites for each role - owner, contributor, reviewer  -->
          <v-col v-for="role in roles" :key="role.name" cols="12" md="4">
            <stream-role-collaborators
              :role-name="role.name"
              :roles="roles"
              :stream="stream"
              @update-user-role="setUserPermissions"
              @remove-user="removeUser"
              @cancel-invite="cancelInvite"
            />
          </v-col>
        </v-row>
        <!-- Leave stream panel -->
        <v-row v-if="showLeaveStreamPanel">
          <v-col cols="12">
            <leave-stream-panel
              :stream-id="streamId"
              @removed="fullyReloadStreamQueries"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { gql } from '@apollo/client/core'
import { fullServerInfoQuery } from '@/graphql/server'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import BasicUserInfoRow from '@/main/components/user/BasicUserInfoRow.vue'
import SectionCard from '@/main/components/common/SectionCard.vue'
import InviteDialog from '@/main/dialogs/InviteDialog.vue'
import { userSearchQuery } from '@/graphql/user'
import StreamRoleCollaborators from '@/main/components/stream/collaborators/StreamRoleCollaborators.vue'
import {
  StreamWithCollaboratorsDocument,
  CancelStreamInviteDocument,
  UpdateStreamPermissionDocument
} from '@/graphql/generated/graphql'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import { Roles } from '@/helpers/mainConstants'
import LeaveStreamPanel from '@/main/components/stream/collaborators/LeaveStreamPanel.vue'
import { IsLoggedInMixin } from '@/main/lib/core/mixins/isLoggedInMixin'
import { vueWithMixins } from '@/helpers/typeHelpers'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'

export default vueWithMixins(IsLoggedInMixin).extend({
  // @vue/component
  name: 'TheCollaborators',
  components: {
    SectionCard,
    InviteDialog,
    BasicUserInfoRow,
    StreamRoleCollaborators,
    LeaveStreamPanel
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
    loading: false,
    inviteDialogVisible: false,
    inviteDialogEmail: '',
    inviteDialogUser: null
  }),
  apollo: {
    stream: {
      query: StreamWithCollaboratorsDocument,
      // Custom error policy so that a failing pendingCollaborators resolver (due to access rights)
      // doesn't kill the entire query
      errorPolicy: 'all',
      prefetch: true,
      variables() {
        return {
          id: this.streamId
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
      query: fullServerInfoQuery
    }
  },
  computed: {
    showLeaveStreamPanel() {
      if (!this.isLoggedIn) return false
      if (!this.stream?.role) return false
      if (this.isStreamOwner && this.owners.length <= 1) return false

      return true
    },
    isStreamOwner() {
      return this.stream?.role === Roles.Stream.Owner
    },
    streamId() {
      return this.$route.params.streamId
    },
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
  mounted() {
    this.$eventHub.$on(StreamEvents.RefetchCollaborators, () => {
      this.$apollo.queries.stream.refetch()
    })
  },
  methods: {
    async cancelInvite({ inviteId }) {
      const { streamId } = this

      this.loading = true
      const { data, errors } = await this.$apollo
        .mutate({
          mutation: CancelStreamInviteDocument,
          variables: {
            streamId,
            inviteId
          },
          update(store, result) {
            if (!result.data?.streamInviteCancel) return

            // Read current stream info
            const cachedData = store.readQuery({
              query: StreamWithCollaboratorsDocument,
              variables: { id: streamId }
            })
            const pendingCollaborators = cachedData?.stream?.pendingCollaborators
            if (!pendingCollaborators) return

            // Remove collaborator
            const newPendingCollaborators = pendingCollaborators.filter(
              (c) => c.inviteId !== inviteId
            )
            const newData = {
              stream: {
                ...cachedData.stream,
                pendingCollaborators: newPendingCollaborators
              }
            }

            store.writeQuery({
              query: StreamWithCollaboratorsDocument,
              variables: { id: streamId },
              data: newData
            })
          }
        })
        .catch(convertThrowIntoFetchResult)

      if (!data?.streamInviteCancel) {
        const gqlError = errors?.[0]
        const errMsg = gqlError
          ? gqlError.message
          : 'Unexpected error while canceling invite'
        this.$triggerNotification({
          text: errMsg,
          type: 'error'
        })
      }

      this.loading = false
    },
    onInviteSent() {
      // Reload contributors only
      this.$eventHub.$emit(StreamEvents.RefetchCollaborators)

      // Clear search field
      this.search = ''
    },
    fullyReloadStreamQueries() {
      // Refetch all stream info
      this.$eventHub.$emit(StreamEvents.RefetchCollaborators)
      this.$eventHub.$emit(StreamEvents.Refetch)
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

      this.fullyReloadStreamQueries()
      this.loading = false
    },
    async setUserPermissions({ user, role }) {
      this.loading = true
      await this.updateUserPermission(user.id, role.name)
      this.loading = false

      // refetch stream
      this.fullyReloadStreamQueries()
    },
    async updateUserPermission(userId, role) {
      this.$mixpanel.track('Permission Action', { type: 'action', name: 'update' })
      const { data, errors } = await this.$apollo
        .mutate({
          mutation: UpdateStreamPermissionDocument,
          variables: {
            params: {
              streamId: this.stream.id,
              userId,
              role
            }
          }
        })
        .catch(convertThrowIntoFetchResult)

      if (!data?.streamUpdatePermission) {
        const errMsg = errors?.[0]?.message || 'An unexpected issue occurred'
        this.$triggerNotification({
          text: errMsg,
          type: 'error'
        })
      }
    },
    showNonexistantUserInviteDialog() {
      this.inviteDialogUser = null
      this.inviteDialogEmail = this.search
      this.inviteDialogVisible = true
    },
    showUserInviteDialog(user) {
      this.inviteDialogUser = user
      this.inviteDialogEmail = null
      this.inviteDialogVisible = true
    }
  }
})
</script>
