<template>
  <v-card title="Users">
    <h2 class="ma-4">Users</h2>
    <v-text-field
      v-model="searchQuery"
      class="mx-4"
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
      <h3 v-if="!users.totalCount.length === 0">It's so lonely here.</h3>
      <v-list-item-group v-else color="primary">
        <v-list-item v-for="user in users.items" :key="user.id">
          <div class="my-1 d-flex flex-row flex-grow-1 justify-space-between align-center">
            <user-avatar-icon
              class="ml-n2"
              :avatar="user.avatar"
              :seed="user.id"
              :size="50"
            ></user-avatar-icon>
            <div class="px-4 d-flex flex-column justify-center">
              <h4 class="subtitle-2">{{ user.name }}</h4>
              <span class="caption">
                <v-icon x-small>mdi-email-outline</v-icon>
                {{ user.email }}
              </span>
              <span class="caption">
                <v-icon x-small>mdi-domain</v-icon>
                {{ user.company }}
              </span>
            </div>
            <div class="d-flex flex-grow-1 justify-end">
              <v-chip
                v-if="user.role === 'server:admin'"
                class="ma-2"
                color="primary"
                @click="removeAdminRole(user.id)"
              >
                Admin
              </v-chip>
              <v-chip v-else class="ma-2" @click="addAdminRole(user.id)">User</v-chip>
              <v-icon large>mdi-menu-down</v-icon>
            </div>
          </div>
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
      currentPage: 1,
      searchQuery: null
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
    removeAdminRole(userId) {
      this.$apollo.mutate({
        mutation: gql`
          mutation ($userId: String!) {
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
          mutation ($userId: String!) {
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
