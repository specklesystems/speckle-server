<template>
  <v-card>
    <v-toolbar color="primary" dark flat>
      <v-app-bar-nav-icon style="pointer-events: none">
        <v-icon>mdi-plus-box</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Create a new Stream</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar>
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
      class="px-2"
      @submit.prevent="createStream"
    >
      <v-card-text>
        <v-text-field
          v-model="name"
          :disabled="isLoading"
          :rules="nameRules"
          validate-on-blur
          autofocus
          label="Stream Name (optional)"
        />
        <v-textarea
          v-model="description"
          :disabled="isLoading"
          rows="1"
          row-height="15"
          label="Description (optional)"
        />
        <stream-visibility-toggle
          :disabled="isLoading"
          :is-public.sync="isPublic"
          :is-discoverable.sync="isDiscoverable"
        />
        <p class="mt-5">
          <b>Invite collaborators</b>
        </p>
        <v-text-field
          v-model="search"
          :disabled="isLoading"
          label="Search users..."
          placeholder="Search by name or by email"
        />
        <div v-if="$apollo.loading">Searching.</div>
        <v-list v-if="userSearch && users" one-line>
          <v-list-item v-if="users.length === 0">
            <v-list-item-content>
              <v-list-item-title>No users found.</v-list-item-title>
              <v-list-item-subtitle>Try a different search query.</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-for="item in users" :key="item.id" @click="addCollab(item)">
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
        <v-chip
          v-for="user in collabs"
          :key="user.id"
          close
          class="ma-2"
          @click:close="removeCollab(user)"
        >
          <user-avatar
            :id="user.id"
            :name="user.name"
            :avatar="user.avatar"
            :size="25"
            left
          ></user-avatar>
          <span class="caption">{{ user.name }}</span>
        </v-chip>
      </v-card-text>
      <v-card-actions class="pb-3">
        <v-btn
          color="primary"
          block
          large
          :disabled="!valid || isLoading"
          :loading="isLoading"
          elevation="0"
          type="submit"
        >
          Create Stream
        </v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import { userSearchQuery } from '@/graphql/user'
import { AppLocalStorage } from '@/utils/localStorage'
import StreamVisibilityToggle from '@/main/components/stream/editor/StreamVisibilityToggle.vue'
import UserAvatar from '@/main/components/common/UserAvatar.vue'

export default {
  components: {
    UserAvatar,
    StreamVisibilityToggle
  },
  props: {
    open: {
      type: Boolean,
      default: false
    },
    redirect: {
      type: Boolean,
      default: true
    }
  },
  apollo: {
    userSearch: {
      query: userSearchQuery,
      variables() {
        return {
          query: this.search,
          limit: 10
        }
      },
      skip() {
        return !this.search || this.search.length < 3
      },
      result({ data }) {
        this.users = [...data.userSearch.items]
      },
      debounce: 300
    }
  },
  data() {
    return {
      name: null,
      description: null,
      valid: false,
      search: null,
      nameRules: [],
      isPublic: true,
      isDiscoverable: false,
      collabs: [],
      isLoading: false,
      users: null
    }
  },
  watch: {
    open() {
      this.name = null
      this.search = null
      this.users = null
      this.collabs = []
    }
  },
  mounted() {
    this.nameRules = [
      (v) =>
        !v ||
        (v.length <= 150 && v.length >= 3) ||
        'Stream name must be between 3 and 150 characters.'
      // (v) => (!v && v.length <= 150) || 'Name must be less than 150 characters',
      // (v) => (!v && v.length >= 3) || 'Name must be at least 3 characters'
    ]
  },
  methods: {
    addCollab(user) {
      if (user.id === AppLocalStorage.get('uuid')) return
      const indx = this.collabs.findIndex((u) => u.id === user.id)
      if (indx !== -1) return

      this.collabs.push(user)
      this.search = null
      this.users = null
    },
    removeCollab(user) {
      const indx = this.collabs.findIndex((u) => u.id === user.id)
      this.collabs.splice(indx, 1)
    },
    async createStream() {
      if (!this.$refs.form.validate()) return

      const collabIds = this.collabs.map((c) => c.id)
      this.isLoading = true
      this.$mixpanel.track('Stream Action', { type: 'action', name: 'create' })
      try {
        const res = await this.$apollo.mutate({
          mutation: gql`
            mutation streamCreate($myStream: StreamCreateInput!) {
              streamCreate(stream: $myStream)
            }
          `,
          variables: {
            myStream: {
              name: this.name,
              isPublic: this.isPublic,
              isDiscoverable: this.isDiscoverable,
              description: this.description,
              withContributors: collabIds
            }
          }
        })

        this.$emit('created')
        if (this.redirect)
          this.$router.push({ path: `/streams/${res.data.streamCreate}` })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
