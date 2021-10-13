<template>
  <v-card>
    <v-toolbar>
      <v-toolbar-title>Server Admin</v-toolbar-title>
    </v-toolbar>
    <template slot="menu">
      <v-slide-x-reverse-transition mode="out-in">
        <v-tooltip v-if="!addUserMode" left color="primary" open-delay="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              rounded
              small
              outlined
              color="primary"
              v-bind="attrs"
              v-on="on"
              class="mr-1"
              @click="addUserMode = true"
            >
              <v-icon small>mdi-plus</v-icon>
              Add
            </v-btn>
          </template>
          Add new admin
        </v-tooltip>
        <div v-else class="d-flex align-center">
          <v-autocomplete
            :search-input.sync="search"
            v-model="selectedSearchItem"
            :items="filteredSearchResults"
            :loading="$apollo.loading"
            autofocus
            label="Search users..."
            dense
            hide-details
            hide-no-data
            item-text="name"
            item-value="id"
            return-object
            chips
            deletable-chips
            class="mr-2"
          >
            <template #item="{ item }">
              <v-list-item-content>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.email }}</v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>
          <v-btn outlined small color="success" elevation="0" class="mr-2">Add</v-btn>
          <v-btn outlined small color="error" elevation="0" @click="addUserMode = false">
            Cancel
          </v-btn>
        </div>
      </v-slide-x-reverse-transition>
    </template>
    <div v-for="admin in adminUsers" :key="admin.id">
      <server-admins-user :admin="admin" />
    </div>
  </v-card>
</template>

<script>
import ServerAdminsUser from '@/components/admin/ServerAdminsUser'
import SearchBar from '@/components/SearchBar'
import userSearchQuery from '@/graphql/userSearch.gql'

export default {
  name: 'ServerAdminsCard',
  components: { SearchBar, ServerAdminsUser },
  props: ['adminUsers'],
  data() {
    return {
      selectedSearchItem: [],
      search: '',
      userSearch: { items: [] },
      addUserMode: false
    }
  },
  apollo: {
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
      debounce: 300
    }
  },
  computed: {
    filteredSearchResults() {
      if (!this.userSearch) return null
      let users = []
      for (let u of this.userSearch.items) {
        if (u.id === this.myId) continue
        users.push(u)
      }
      return users
    },
    myId() {
      return localStorage.getItem('uuid')
    }
  },
  methods: {
    addUser(event, user) {
      console.log('user to add as admin', event, user)
      this.addUserMode = !this.addUserMode
    }
  }
}
</script>
