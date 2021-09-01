<template>
  <div>
    <v-card title="Users">
      <template slot="menu">
        <span class="caption mr-2">Showing XX of YYY users.</span>
        <v-menu offset-y left class="rounded-circle">
          <template #activator="{ attrs, on }">
            <v-btn v-bind="attrs" v-on="on" icon outlined small color="primary" class="mr-2">
              <v-icon small>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-list class="rounded-circle">
            <v-list-item>Hi</v-list-item>
            <v-list-item>Hi</v-list-item>
            <v-list-item>Hi</v-list-item>
          </v-list>
        </v-menu>

        <v-btn icon outlined small color="primary" class="mr-2">
          <v-icon small>mdi-filter</v-icon>
        </v-btn>
        <v-btn icon outlined small color="primary">
          <v-icon small>mdi-sort</v-icon>
        </v-btn>
      </template>

      <user-list-item v-for="user in users" :key="user.id" :admin="user" :widgets="widgets(user)">
        <v-menu offset-y left rounded>
          <template v-slot:activator="{ attrs, on }">
            <v-btn icon small v-bind="attrs" v-on="on" class="ml-2">
              <v-icon small>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list nav dense>
            <v-tooltip
              left
              max-width="200pt"
              open-delay="500"
              v-for="opt in menuOptions"
              :key="opt.text"
              :disabled="!opt.hint"
            >
              <template v-slot:activator="{ attrs, on }">
                <v-list-item
                  v-bind="attrs"
                  v-on="on"
                  link
                  @click="opt.action ? opt.action(user) : null"
                >
                  <v-list-item-icon class="mr-3">
                    <v-icon
                      small
                      v-text="opt.icon"
                      :class="`${opt.color || 'dark'}--text`"
                    ></v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title
                      v-text="opt.text"
                      :class="`${opt.color || 'dark'}--text`"
                    ></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
              {{ opt.hint }}
            </v-tooltip>
          </v-list>
        </v-menu>
      </user-list-item>

      <div class="text-center subtitle-2 pt-3">
        <v-btn :loading="loading" text width="100%" color="primary" @click="loadMoreUsers">
          Load more
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script>
import UserListItem from '@/components/admin/UserListItem'

export default {
  name: 'AdminUsers',
  components: { UserListItem },
  methods: {
    viewProfile(user) {
      console.log('requesting profile for user with id ', user.id)
    },
    widgets(user) {
      return [
        {
          icon: 'mdi-eye-outline',
          hint: 'Last seen',
          value: '< 1 day',
          type: 'text',
          color: null
        },
        {
          icon: 'mdi-cloud-outline',
          hint: 'Streams',
          value: user.streams.totalCount,
          type: 'number'
        },
        {
          icon: 'mdi-cloud-upload-outline',
          hint: 'Commits',
          value: user.commits.totalCount,
          type: 'number'
        },
        {
          icon: 'mdi-calendar-outline',
          hint: 'Joined in',
          value: 'Feb/21',
          type: 'text'
        },
        {
          icon: 'mdi-decagram-outline',
          hint: 'Badges',
          value: 55
        }
      ]
    },
    loadMoreUsers() {
      console.log('requested more users!')
      this.loading = true
      those
      setTimeout(() => {
        this.loading = false
      }, 700)
    }
  },
  data() {
    return {
      loading: false,
      menuOptions: [
        {
          text: 'View profile',
          icon: 'mdi-account',
          action: this.viewProfile
        },
        {
          text: 'Delete user',
          icon: 'mdi-delete',
          color: 'error',
          hint: "Removes this user's admin privileges. This will not delete the user's account."
        }
      ],
      users:[],
    }
  }
}
</script>

<style scoped></style>
