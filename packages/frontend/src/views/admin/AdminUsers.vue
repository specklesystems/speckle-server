<template>
  <v-card title="Users">
    <h2>Users</h2>
    <div>search bar here</div>
    <v-list v-if="!$apollo.loading" rounded>
      <!-- <div>sorting here</div> -->
      <v-list-item-group color="primary">
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
              <v-chip v-if="user.role === 'server:admin'" class="ma-2" color="primary">
                Admin
              </v-chip>
              <v-chip v-else class="ma-2">User</v-chip>
              <v-icon large>mdi-menu-down</v-icon>
            </div>
          </div>
        </v-list-item>
      </v-list-item-group>
      <div class="text-center">
        <v-pagination
          v-model="currentPage"
          :length="numberOfPages"
          :total-visible="7"
          circle
        ></v-pagination>
      </div>
    </v-list>
    <v-skeleton-loader v-else class="mx-auto" type="card"></v-skeleton-loader>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import UserAvatarIcon from '@/components/UserAvatarIcon'

export default {
  name: 'UserAdmin',
  components: { UserAvatarIcon },
  props: {
    limit: { type: [Number, String], required: false, default: 10 },
    page: { type: [Number, String], required: false, default: 0 }
  },
  data() {
    return {
      // loading: false,
      // currentPage: 0,
      users: {
        items: []
      },
      currentPage: 1
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
    currentPage: function (newPage, oldPage) {
      this.paginateNext(newPage, oldPage)
    }
  },
  methods: {
    paginateNext: function (newPage, oldPage) {
      console.log(newPage, oldPage)
      this.$router.push(`users?page=${newPage}&limit=${this.queryLimit}`)
    }
  },
  apollo: {
    users: {
      query: gql`
        query Users($limit: Int, $offset: Int) {
          users(limit: $limit, offset: $offset) {
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
          offset: this.queryOffset
        }
      }
    }
  }
}
</script>
