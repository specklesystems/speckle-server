<template>
  <v-card>
    <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
      <v-toolbar-title>
        Server Users Admin
        <span v-if="users">({{ users.totalCount }} total users)</span>
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
      <!-- <div>sorting here</div> -->
      <h3 v-if="users.totalCount === 0">It's so lonely here.</h3>
      <v-list-item-group v-else color="primary">
        <v-list-item v-for="user in users.items" :key="user.id">
          <v-list-item-avatar>
            <user-avatar-icon
              class="ml-n2"
              :avatar="user.avatar"
              :seed="user.id"
              :size="50"
            ></user-avatar-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              {{ user.name }}
            </v-list-item-title>

            <span class="caption">
              <v-icon x-small>mdi-email-outline</v-icon>
              {{ user.email }}
            </span>
            <span class="caption">
              <v-icon x-small>{{ user.company ? 'mdi-domain' : 'mdi-help-circle' }}</v-icon>
              {{ user.company ? user.company : 'No info company' }}
            </span>
          </v-list-item-content>
          <v-list-item-action>
            <v-select
              v-model="user.role"
              :items="roles"
              label="user role"
              filled
              flat
              @change="changeUserRole(user)"
            ></v-select>
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
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import UserAvatarIcon from '@/components/UserAvatarIcon'
import debounce from 'lodash.debounce'

export default {
  name: 'UserAdmin',
  components: { UserAvatarIcon },
  // beforeRouteUpdate(to, from, next) {
  //   console.debug(to)
  //   console.debug(from)
  //   console.debug(next)
  //   this.currentPage = this.page
  //   next()
  // },
  props: {
    limit: { type: [Number, String], required: false, default: 10 },
    page: { type: [Number, String], required: false, default: 1 },
    q: { type: String, required: false, default: null }
  },
  data() {
    return {
      users: {
        items: [],
        totalCount: 0
      },
      roles: ['server:user', 'server:admin', 'server:archived_user'],
      currentPage: 1,
      searchQuery: null,
      showConfirmDialog: false
    }
  },
  computed: {
    queryLimit: function () {
      return parseInt(this.limit)
    },
    queryOffset: function () {
      return (this.page - 1) * this.queryLimit
    },
    numberOfPages: function () {
      return Math.ceil(this.users.totalCount / this.limit)
    }
  },
  watch: {
    currentPage: function (newPage, _) {
      this.paginateNext(newPage)
    },
    searchQuery: debounce(function (newQuery) {
      this.applySearch(newQuery)
    }, 1000)
  },
  methods: {
    changeUserRole( user ) {

      console.log(user)
    },

    getUserCurrentRole(user) {
      return user.role
    },
    removeAdminRole(userId) {
      this.$apollo.mutate({
        mutation: gql`
          mutation($userId: String!) {
            userRoleChange(userRoleInput: { id: $userId, role: "server:user" })
          }
        `,
        variables: {
          userId
        },
        update: () => {
          this.$apollo.queries.users.refetch()
        },
        error: (err) => {
          console.log(err)
        }
      })
    },
    addAdminRole(userId) {
      this.$apollo.mutate({
        mutation: gql`
          mutation($userId: String!) {
            userRoleChange(userRoleInput: { id: $userId, role: "server:admin" })
          }
        `,
        variables: {
          userId
        },
        update: () => {
          this.$apollo.queries.users.refetch()
        },
        error: (err) => {
          console.log(err)
        }
      })
    },
    paginateNext: function (newPage) {
      this.$router.push(this._prepareRoute(newPage, this.limit, this.searchQuery))
    },
    applySearch: function (searchQuery) {
      this.$router.push(this._prepareRoute(1, this.limit, searchQuery))
    },
    _prepareRoute: function (page, limit, query) {
      let newRoute = `users?page=${page}&limit=${limit}`
      if (query) newRoute = `${newRoute}&q=${query}`
      return newRoute
    },
    _matchCurrentPage: function () {
      this.currentPage = this.page
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
