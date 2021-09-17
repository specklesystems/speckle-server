<template>
  <v-card title="Users">
    <!-- <v-data-iterator -->
    <!-- :headers="headers" -->
    <!-- :items="users.items" -->
    <!-- :loading="this.$apollo.queries.users.loading" -->
    <!-- :server-items-length="users.totalCount" -->
    <!-- row -->
    <!-- wrap -->
    <!-- > -->
    <!-- <template #default="{ items, isExpanded, expand }"> -->
    <!-- <v-card v-for="user in items" :key="user.id"> -->
    <!-- <div>{{ user.name }}</div> -->
    <!-- </v-card> -->
    <!-- </template> -->
    <!-- </v-data-iterator> -->
    <!-- <server-admins-card :admin-users="users.items"></server-admins-card> -->
    <!-- <v-data-table
      :headers="headers"
      :items="users.items"
      :loading="this.$apollo.queries.users.loading"
      :server-items-length="users.totalCount"
    > -->
    <!-- <template v-slot:item. -->
    <!-- </v-data-table> -->
    <v-list rounded>
      <v-subheader>Users</v-subheader>
      <div>search bar here</div>
      <div>sorting here</div>
      <v-list-item-group color="primary">
        <v-list-item v-for="user in users.items" :key="user.id">
          <div class="my-1 d-flex flex-row flex-grow-1 justify-space-between align-center">
            <!-- <v-list-item-title v-text="user.name"></v-list-item-title> -->
            <!-- <user-avatar :id="user.id" :avatar="user.avatar" :name="user.name"></user-avatar> -->
            <user-avatar-icon
              class="ml-n2"
              :avatar="user.avatar"
              :seed="user.id"
              :size="'50'"
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
    </v-list>
  </v-card>
</template>

<script>
import gql from 'graphql-tag'
import ServerAdminsCard from '@/components/admin/ServerAdminsCard'
import UserAvatar from '@/components/UserAvatar'
import UserAvatarIcon from '@/components/UserAvatarIcon'

export default {
  name: 'UserAdmin',
  components: { ServerAdminsCard, UserAvatar, UserAvatarIcon },
  data() {
    return {
      // loading: false,
      // usersPerPage: 30,
      // currentPage: 0,
      headers: [
        { text: 'Avatar', value: 'avatar', sortable: false },
        { text: 'Name', value: 'name' },
        { text: 'Email', value: 'email' },
        { text: 'Admin', value: 'role' }
      ],
      users: {
        items: []
      }
    }
  },
  apollo: {
    users: {
      prefetch: true,
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
      `
    }
  }
}
</script>

<style>
</style>