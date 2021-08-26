<template>
  <v-container fluid pa-0 ma-0>
    <!-- Stream Page Navigation Drawer -->
    <v-navigation-drawer
      app
      fixed
      :permanent="streamNav && !$vuetify.breakpoint.smAndDown"
      v-model="streamNav"
      style="left: 56px"
      v-if="!error"
    >
      <!-- Toolbar holds link to stream home page -->
      <v-app-bar style="position: absolute; top: 0; width: 100%; z-index: 90" elevation="0" flat>
        <v-toolbar-title>
          <router-link
            v-if="stream"
            :to="`/streams/${stream.id}`"
            class="text-decoration-none space-grotesk"
            v-tooltip="stream.name"
          >
            <v-icon class="mr-2 primary--text" style="font-size: 20px">mdi-folder</v-icon>
            <b>{{ stream.name }}</b>
          </router-link>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-app-bar-nav-icon @click="streamNav = !streamNav" v-if="streamNav">
          <v-icon v-if="streamNav">mdi-chevron-left</v-icon>
        </v-app-bar-nav-icon>
      </v-app-bar>

      <!-- Top padding hack -->
      <div style="display: block; height: 65px"></div>
      <div class="px-4 mt-2" v-if="!loggedIn" >
        <v-btn large block color="primary" to="/authn/login">Log In</v-btn>
      </div>
      <!-- Various Stream Details -->
      <v-card elevation="0" v-if="stream" class="pa-1 mb-0" color="transparent">
        <v-card-text class="caption">
          {{ stream.description ? stream.description : 'No description provided.' }}
          <router-link
            :to="`/streams/${$route.params.streamId}/settings`"
            class="text-decoration-none"
          >
            Edit
          </router-link>
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
            ></user-avatar>
            <v-btn
              icon
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
              v-if="stream.collaborators.length <= 5"
            >
              <v-avatar>
                <v-icon>mdi-account-plus</v-icon>
              </v-avatar>
            </v-btn>
          </div>

          <!-- Your role: {{ stream.role }} -->
          <v-divider class="my-2"></v-divider>
          <v-chip small class="mr-2">{{ stream.commits.totalCount }} Commits</v-chip>
          <v-chip small class="mr-2">{{ branchesTotalCount }} Branches</v-chip>
        </v-card-text>
      </v-card>

      <!-- Stream menu options -->
      <v-list style="padding-left: 10px" rounded dense class="mt-0 pt-0" v-if="stream">
        <v-list-item link :to="`/streams/${stream.id}`" class="no-overlay">
          <v-list-item-icon>
            <v-icon small>mdi-home</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Steam Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- Branch menu group -->
        <!-- TODO: group by "/", eg. dim/a, dim/b, dim/c should be under a sub-group called "dim". -->
        <v-list-group v-model="branchMenuOpen" class="my-2">
          <template v-slot:activator>
            <v-list-item-icon>
              <v-icon small>mdi-source-branch</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Branches ({{ branchesTotalCount }})</v-list-item-title>
          </template>
          <v-divider class="mb-1"></v-divider>
          <v-list-item
            link
            v-tooltip.bottom="'Create a new branch to help categorise your commits.'"
            v-if="stream.role !== 'stream:reviewer'"
          >
            <v-list-item-icon>
              <v-icon small style="padding-top: 10px">mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>New Branch</v-list-item-title>
              <v-list-item-subtitle class="caption">
                Create a new branch to help categorise your commits.
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <!-- <v-divider class="mb-2"></v-divider> -->
          <v-list-item
            v-for="branch in sortedBranches"
            :key="branch.name"
            link
            :to="`/streams/${stream.id}/branches/${branch.name}`"
          >
            <v-list-item-icon>
              <v-icon small style="padding-top: 10px" v-if="branch.name !== 'main'">
                mdi-source-branch
              </v-icon>
              <v-icon small style="padding-top: 10px" v-else>mdi-star</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
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

        <v-list-item link :to="`/streams/${stream.id}/webhooks`">
          <v-list-item-icon>
            <v-icon small>mdi-webhook</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Webhooks</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link :to="`/streams/${stream.id}/collaborators`">
          <v-list-item-icon>
            <v-icon small>mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Collaborators</v-list-item-title>
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
    <v-app-bar app style="padding-left: 56px" flat v-if="!error">
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
        <v-btn large color="primary" to="/authn/login" v-if="!loggedIn && stream && !streamNav">Log In</v-btn>
        <v-btn elevation="0" v-if="loggedIn && stream">
          <v-icon small class="mr-2">mdi-share-variant</v-icon>
          <v-icon small class="mr-2 hidden-sm-and-down" v-if="!stream.isPublic">mdi-lock</v-icon>
          <v-icon small class="mr-2 hidden-sm-and-down" v-else>mdi-lock-open</v-icon>
          <span class="hidden-sm-and-down">Share</span>
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>

    <!-- Stream Child Routes -->
    <v-container style="padding-left: 56px" fluid pt-0 pr-0 v-if="!error">
      <transition name="fade">
        <router-view v-if="stream"></router-view>
      </transition>
    </v-container>
    <v-container style="padding-left: 56px" v-else>
      <error-placeholder :error-type="error.toLowerCase().includes('not found') ? '404' : 'access'">
        <h2>{{ error }}</h2>
      </error-placeholder>
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
    UserAvatar: () => import('@/components/UserAvatar'),
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder')
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
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    },
    sortedBranches() {
      // TODO: group by `/` (for later)
      if (!this.stream) return
      return [
        this.stream.branches.items.find((b) => b.name === 'main'),
        ...this.stream.branches.items.filter((b) => b.name !== 'main' && b.name !== 'globals')
      ]
    },
    branchesTotalCount() {
      if (!this.stream) return 0
      return this.stream.branches.items.filter((b) => b.name !== 'globals').length
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
    setTimeout(
      function () {
        this.streamNav = !this.$vuetify.breakpoint.smAndDown
      }.bind(this),
      1
    )

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
<style scoped>
.no-overlay.v-list-item--active::before {
  opacity: 0 !important;
}
</style>
