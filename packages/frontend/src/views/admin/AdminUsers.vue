<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title>
        Server users
        <span v-if="users">({{ users.items.length }} of {{ users.totalCount }} users)</span>
      </v-toolbar-title>
    </v-toolbar>
    <v-text-field
      v-model="searchQuery"
      class="mx-4 mt-4"
      :prepend-inner-icon="'mdi-magnify'"
      :loading="$apollo.loading"
      label="Search users"
      type="text"
      single-line
      clearable
      rounded
      filled
      dense
    ></v-text-field>
    <v-list v-if="!$apollo.loading" rounded>
      <v-list-item-group v-if="users.totalCount > 0" color="primary">
        <v-list-item v-for="user in users.items" :key="user.id">
          <v-list-item-avatar class="d-flex justify-start" :size="50">
            <user-avatar-icon :avatar="user.avatar" :seed="user.id" :size="50"></user-avatar-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              <router-link class="text-h6" :to="`/profile/${user.id}`" target="_blank">
                {{ user.name }}
              </router-link>
            </v-list-item-title>

            <span class="caption">
              <v-icon x-small>mdi-email-outline</v-icon>
              {{ user.email }}
            </span>
            <span v-if="user.company" class="caption">
              <v-icon x-small>mdi-domain</v-icon>
              {{ user.company }}
            </span>
            <span v-else class="caption">
              <v-icon x-small>mdi-help-circle</v-icon>
              No company info
            </span>
          </v-list-item-content>
          <v-list-item-action class="pt-2">
            <v-select
              :value="user.role"
              :items="availableRoles"
              label="user role"
              @change="changeUserRole(user, ...arguments)"
            ></v-select>
          </v-list-item-action>
          <v-list-item-action>
            <v-btn icon @click="initiateDeleteUser(user)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <div class="text-center">
          <v-pagination
            v-model="currentPage"
            :length="numberOfPages"
            :total-visible="7"
            circle
          ></v-pagination>
        </div>
      </v-list-item-group>
    </v-list>
    <v-skeleton-loader v-else class="mx-auto" type="card"></v-skeleton-loader>
    <v-dialog v-model="showConfirmDialog" persistent max-width="600px">
      <v-card v-if="showConfirmDialog">
        <v-toolbar flat class="mb-6">
          <v-toolbar-title>Confirm user role change</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-alert v-if="newRole === 'server:admin'" type="error">
            Make sure you trust {{ manipulatedUser.name }}!
            <br />
            An admin on the server has access to every resource.
          </v-alert>
          You are changing {{ manipulatedUser.name }}'s server access role from
          {{ roleLookupTable[manipulatedUser.role] }} to {{ roleLookupTable[newRole] }}.
          <br />
          Proceed?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="cancelRoleChange">Cancel</v-btn>
          <v-btn color="primary" text @click="proceedRoleChange">
            Change role to {{ roleLookupTable[newRole] }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showDeleteDialog" persistent max-width="600px">
      <v-card v-if="showDeleteDialog">
        <v-toolbar flat class="mb-6">
          <v-toolbar-title>Confirm user deletion</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-alert type="error">
            Confirm deletion of
            <b>{{ manipulatedUser.name }}</b>
            's account from the server.
            <br />
            Streams, where {{ manipulatedUser.name }} is the only owner, will also be deleted.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" text @click="deleteUser(manipulatedUser)">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import UserAvatarIcon from '@/components/UserAvatarIcon'
import debounce from 'lodash.debounce'

export default {
  name: 'UserAdmin',
  components: { UserAvatarIcon },
  props: {
    limit: { type: [Number, String], required: false, default: 10 },
    page: { type: [Number, String], required: false, default: 1 },
    q: { type: String, required: false, default: null }
  },
  data() {
    return {
      roleLookupTable: {
        'server:user': 'User',
        'server:admin': 'Admin',
        'server:archived-user': 'Archived'
      },
      users: {
        items: [],
        totalCount: 0
      },
      // currentPage: 1,
      // searchQuery: null,
      showConfirmDialog: false,
      showDeleteDialog: false,
      manipulatedUser: null,
      newRole: null
    }
  },
  computed: {
    queryLimit() {
      return parseInt(this.limit)
    },
    currentPage: {
      get() {
        return parseInt(this.page)
      },
      set(newPage) {
        this.paginateNext(newPage)
      }
    },
    searchQuery: {
      get() {
        return this.q
      },
      set: debounce(function (q) {
        this.applySearch(q)
      }, 500)
    },
    queryOffset() {
      return (this.page - 1) * this.queryLimit
    },
    numberOfPages() {
      return Math.ceil(this.users.totalCount / this.limit)
    },
    availableRoles() {
      let roleItems = []
      for (let role in this.roleLookupTable) {
        roleItems.push({ text: this.roleLookupTable[role], value: role })
      }
      return roleItems
    }
  },
  methods: {
    initiateDeleteUser(user) {
      this.showDeleteDialog = true
      this.manipulatedUser = user
    },
    async deleteUser(user) {
      await this.$apollo.mutate({
        mutation: gql`
          mutation($userEmail: String!) {
            adminDeleteUser(userConfirmation: { email: $userEmail })
          }
        `,
        variables: {
          userEmail: user.email
        },
        update: () => {
          this.$apollo.queries.users.refetch()
        },
        error: (err) => {
          console.log(err)
        }
      })
      this.resetManipulatedUser()
      this.showDeleteDialog = false
    },
    changeUserRole(user, args) {
      this.manipulatedUser = user
      this.newRole = args

      this.showConfirmDialog = true
    },
    resetManipulatedUser() {
      this.manipulatedUser = null
      this.newRole = null
    },
    cancelRoleChange() {
      this.showConfirmDialog = false
      this.$apollo.queries.users.refetch()
      this.resetManipulatedUser()
    },
    async proceedRoleChange() {
      await this.updateUserRole(this.manipulatedUser.id, this.newRole)
      this.resetManipulatedUser()
      this.showConfirmDialog = false
    },
    async updateUserRole(userId, newRole) {
      await this.$apollo.mutate({
        mutation: gql`
          mutation($userId: String!, $newRole: String!) {
            userRoleChange(userRoleInput: { id: $userId, role: $newRole })
          }
        `,
        variables: {
          userId,
          newRole
        },
        update: () => {
          this.$apollo.queries.users.refetch()
        },
        error: (err) => {
          console.log(err)
        }
      })
    },
    paginateNext(newPage) {
      this.$router.push(this._prepareRoute(newPage, this.limit, this.searchQuery))
    },
    applySearch(searchQuery) {
      this.$router.push(this._prepareRoute(1, this.limit, searchQuery))
    },
    _prepareRoute(page, limit, query) {
      let newRoute = `users?page=${page}&limit=${limit}`
      if (query) newRoute = `${newRoute}&q=${query}`
      return newRoute
    }
  },
  apollo: {
    users: {
      query: gql`
        query Users($limit: Int, $offset: Int, $query: String) {
          users(limit: $limit, offset: $offset, query: $query) {
            totalCount
            items {
              id
              suuid
              email
              name
              bio
              company
              avatar
              verified
              profiles
              role
              authorizedApps {
                name
              }
            }
          }
        }
      `,
      variables() {
        return {
          limit: this.queryLimit,
          offset: this.queryOffset,
          query: this.q
        }
      }
    }
  }
}
</script>
