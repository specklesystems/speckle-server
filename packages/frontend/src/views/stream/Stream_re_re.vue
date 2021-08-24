<template>
  <v-container fluid class="ma-0 pa-0">
    <!-- Stream Page Navigation Drawer -->
    <v-navigation-drawer
      app
      fixed
      :permanent="streamNav && !$vuetify.breakpoint.smAndDown"
      v-model="streamNav"
      style="left: 56px"
      width="320"
    >
      <!-- Toolbar holds link to stream home page -->
      <v-toolbar style="position: absolute; top: 0; width: 100%; z-index: 90" elevation="3">
        <v-toolbar-title>
          <router-link
            v-if="stream"
            :to="`/streams/${stream.id}`"
            class="text-decoration-none space-grotesk"
          >
            <v-icon class="mr-2 primary--text" style="font-size: 20px">mdi-folder</v-icon>
            <b>{{ stream.name }}</b>
          </router-link>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-app-bar-nav-icon @click="streamNav = !streamNav" v-if="streamNav">
          <v-icon v-if="streamNav">mdi-chevron-left</v-icon>
        </v-app-bar-nav-icon>
      </v-toolbar>

      <!-- Top padding hack -->
      <div style="display: block; height: 65px"></div>

      <!-- Various Stream Details -->
      <v-card elevation="0" v-if="stream" class="pa-1 mb-0" color="transparent">
        <v-card-text class="caption">
          {{ stream.description ? stream.description : 'No description provided.' }}
          <v-divider class="my-2"></v-divider>
          <div class="caption">
            <span v-tooltip="formatDate(stream.createdAt)">
              Created
              <timeago :datetime="stream.createdAt"></timeago>
            </span>
            ,
            <span v-tooltip="formatDate(stream.updatedAt)">
              Updated
              <timeago :datetime="stream.updatedAt"></timeago>
            </span>
          </div>
          <v-divider class="my-2"></v-divider>
          <div>
            <!-- 
            Note: the current layout fits either:
            - 5 x (collab avatars) + (manage collabs button), or 
            - 4 x (collab avatars) + ( extra collabs info number ) + (manage collabs button) 
            -->
            <user-avatar
              v-for="collab in stream.collaborators.slice(
                0,
                stream.collaborators.length > 5 ? 4 : 5
              )"
              :id="collab.id"
              :key="collab.id"
              :size="30"
              :avatar="collab.avatar"
              :name="collab.name"
              class="ml-1"
            ></user-avatar>
            <v-btn
              icon
              class="ml-1"
              :to="`/streams/${stream.id}/collaborators`"
              v-tooltip="`${stream.collaborators.length - 4} more collaborators`"
              v-if="stream.collaborators.length > 5"
            >
              <span class="text-subtitle-1">+{{ stream.collaborators.length - 4 }}</span>
            </v-btn>
            <v-btn
              icon
              :to="`/streams/${stream.id}/collaborators`"
              class="ml-2"
              v-tooltip="'Manage collaborators'"
              v-if="stream.role === 'stream:owner'"
            >
              <v-avatar>
                <v-icon>mdi-account-plus</v-icon>
              </v-avatar>
            </v-btn>
          </div>
          
          <!-- Your role: {{ stream.role }} -->
          <v-divider class="my-2"></v-divider>
          <v-chip small class="mr-2">{{ stream.commits.totalCount }} Commits</v-chip>
          <v-chip small class="mr-2">{{ stream.branches.totalCount }} Branches</v-chip>
        </v-card-text>
      </v-card>

      <!-- Stream menu options -->
      <v-list style="padding-left: 10px" rounded class="mt-0 pt-0" v-if="stream">
        
        <!-- Branch menu group -->
        <!-- TODO: group by "/", eg. dim/a, dim/b, dim/c should be under a sub-group called "dim". -->
        <v-list-group v-model="branchMenuOpen">
          <template v-slot:activator>
            <v-list-item-icon>
              <v-icon small>mdi-source-branch</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Branches ({{ stream.branches.totalCount }})</v-list-item-title>
          </template>
          <v-divider class="mb-2"></v-divider>
          <v-list-item
            link
            v-tooltip.bottom="'Create a new branch to help categorise your commits.'"
            class="primary" dark
          >
            <v-list-item-icon>
              <v-icon class="xxxprimary--text">mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="xxxprimary--text text-body-2">New Branch</v-list-item-title>
              <v-list-item-subtitle class="caption">
                Create a new branch to help categorise your commits.
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-divider class="mb-2"></v-divider>
          <v-list-item
            v-for="branch in sortedBranches"
            :key="branch.name"
            link
            :to="`/streams/${stream.id}/branches/${branch.name}`"
          >
            <v-list-item-icon>
              <v-icon small class="mt-1" v-if="branch.name !== 'main'">mdi-source-branch</v-icon>
              <v-icon small class="mt-1" v-else>mdi-star</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="text-body-2">
                {{ branch.name }} ({{ branch.commits.totalCount }})
              </v-list-item-title>
              <v-list-item-subtitle class="caption">
                {{ branch.description ? branch.description : 'no description' }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-divider class="mb-2"></v-divider>
        </v-list-group>

        <!-- Other menu items go here -->
        
        <!--
        <v-list-item link :to="`/streams/${stream.id}/activity`">
          <v-list-item-icon>
            <v-icon small>mdi-clock</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Activity</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        --> 

        <v-list-item link :to="`/streams/${stream.id}/globals`">
          <v-list-item-icon>
            <v-icon small>mdi-earth</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Globals</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <!--
        <v-list-item link>
          <v-list-item-icon>
            <v-icon small>mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Collaborators</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        --> 
        
        <v-list-item link :to="`/streams/${stream.id}/webhooks`">
          <v-list-item-icon>
            <v-icon small>mdi-webhook</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Webhooks</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link :to="`/streams/${stream.id}/settings`">
          <v-list-item-icon>
            <v-icon small>mdi-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Stream Page App Bar -->
    <v-app-bar app style="padding-left: 56px">
      <v-app-bar-nav-icon @click="streamNav = !streamNav" v-if="!streamNav">
        <v-icon v-if="streamNav">mdi-chevron-left</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>
        <router-link
          v-if="stream"
          v-show="!streamNav && !$vuetify.breakpoint.smAndDown"
          class="text-decoration-none space-grotesk"
          :to="`/streams/${stream.id}`"
        >
          <b>{{ stream.name }}</b>
        </router-link>
        <span class="mx-2" v-show="!streamNav && !$vuetify.breakpoint.smAndDown">/</span>
        <portal-target name="streamTitleBar" slim style="display: inline-block">
          <!-- child routes can teleport things here -->
        </portal-target>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <portal-target name="streamActionsBar">
        <!-- child routes can teleport buttons here -->
      </portal-target>
      <v-toolbar-items>
        <v-btn elevation="0" v-if="stream">
          <v-icon small class="mr-2">mdi-share-variant</v-icon>
          <v-icon small class="mr-2 hidden-sm-and-down" v-if="!stream.isPublic">mdi-lock</v-icon>
          <v-icon small class="mr-2 hidden-sm-and-down" v-else>mdi-lock-open</v-icon>
          <span class="hidden-sm-and-down">Share</span>
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>

    <!-- Stream Child Routes -->
    <v-container style="padding-left: 56px" fluid>
      <transition name="fade">
        <router-view v-if="stream"></router-view>
      </transition>
    </v-container>
  </v-container>
</template>

<script>
import ErrorBlock from '@/components/ErrorBlock'
import gql from 'graphql-tag'

export default {
  name: 'Stream',
  components: {
    ErrorBlock,
    UserAvatar: () => import('@/components/UserAvatar')
  },
  data() {
    return {
      streamNav: true,
      error: '',
      commitSnackbar: false,
      commitSnackbarInfo: {},
      editStreamDialog: false,
      dialogShare: false,
      branchMenuOpen: false
    }
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
            role
            createdAt
            updatedAt
            description
            isPublic
            branches {
              totalCount
              items {
                name
                description
                commits {
                  totalCount
                }
              }
            }
            commits {
              totalCount
            }
            collaborators {
              id
              name
              role
              company
              avatar
            }
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      error(err) {
        if (err.message) this.error = err.message.replace('GraphQL error: ', '')
        else this.error = err
      }
    },
    $subscribe: {
      commitCreated: {
        query: gql`
          subscription($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result(commitInfo) {
          if (!commitInfo.data.commitCreated) return
          this.commitSnackbar = true
          this.commitSnackbarInfo = commitInfo.data.commitCreated
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    sortedBranches() {
      // TODO: group by `/` (for later)
      if (!this.stream) return
      return [
        this.stream.branches.items.find((b) => b.name === 'main'),
        ...this.stream.branches.items.filter((b) => b.name !== 'main' && b.name !== 'globals')
      ]
    },
    userId() {
      return localStorage.getItem('uuid')
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {
    $route(to, from) {
      // Ensures branch menu is open when navigating to a branch url
      if (this.$route.name.toLowerCase().includes('branch') && !this.branchMenuOpen)
        this.branchMenuOpen = true
    }
  },
  mounted() {
    // Ensures branch menu is open when navigating directly to a branch url
    this.branchMenuOpen = this.$route.name.toLowerCase().includes('branch')
    // Open stream invite dialog if ?invite=true (used by desktop connectors)
    if (this.$route.query.invite && this.$route.query.invite === 'true') {
      setTimeout(() => {
        this.$refs.streamInviteDialog.show()
      }, 500)
    }
  },
  methods: {
    formatDate(d) {
      if (!this.stream) return null
      let date = new Date(d)
      let options = { year: 'numeric', month: 'short', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    }
  }
}
</script>
<style></style>
