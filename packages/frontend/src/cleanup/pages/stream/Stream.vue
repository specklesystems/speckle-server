<template>
  <v-container fluid pa-0 ma-0>
    <portal to="nav">
      <div v-if="!loggedIn" class="px-4 mt-2">
        <v-btn large block color="primary" to="/authn/login">Log In</v-btn>
      </div>
      <stream-nav :stream="stream" />
    </portal>

    <!-- Stream Page App Bar -->
    <stream-toolbar :stream="stream" />
    <!-- Stream Child Routes -->
    <v-container v-if="!error" fluid class="pa-0">
      <transition name="fade">
        <router-view
          v-if="stream"
          :key="$route.path"
          @refetch-branches="refetchBranches"
        ></router-view>
      </transition>
    </v-container>
    <v-container v-else :style="`${!$vuetify.breakpoint.xsOnly ? 'padding-left: 56px' : ''}`">
      <error-placeholder :error-type="error.toLowerCase().includes('not found') ? '404' : 'access'">
        <h2>{{ error }}</h2>
      </error-placeholder>
    </v-container>

    <v-snackbar
      v-model="snackbar"
      rounded="pill"
      :timeout="10000"
      style="z-index: 10000"
      :color="`${$vuetify.theme.dark ? 'primary' : 'primary'}`"
    >
      <template v-if="snackbarInfo.type === 'commit'">
        <span>New commit created!</span>
      </template>
      <template v-if="snackbarInfo.type === 'branch'">
        <span>Branch "{{ snackbarInfo.name }}" created!</span>
      </template>

      <template #action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="goToItemAndCloseSnackbar()">View</v-btn>
        <v-btn color="pink" icon v-bind="attrs" @click="snackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'Stream',
  components: {
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder'),
    StreamNav: () => import('@/cleanup/navigation/StreamNav'),
    StreamToolbar: () => import('@/cleanup/toolbars/StreamToolbar')
  },
  data() {
    return {
      streamNav: true,
      error: '',
      snackbar: false,
      snackbarInfo: {},
      editStreamDialog: false,
      shareStream: false,
      branchMenuOpen: false,
      swapPermsLoading: false
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
            branches {
              totalCount
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
      branchCreated: {
        query: gql`
          subscription($streamId: String!) {
            branchCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result(args) {
          if (!args.data.branchCreated) return
          this.snackbar = true
          this.snackbarInfo = { ...args.data.branchCreated, type: 'branch' }
        },
        skip() {
          return !this.loggedIn
        }
      },
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
          console.log(commitInfo)
          this.snackbar = true
          this.snackbarInfo = { ...commitInfo.data.commitCreated, type: 'commit' }
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    groupedBranches() {
      if (!this.branchQuery) return
      let branches = this.branchQuery.branches.items
      let items = []
      for (let b of branches) {
        if (b.name === 'globals') continue
        let parts = b.name.split('/')
        if (parts.length === 1) {
          items.push({ ...b, displayName: b.name, type: 'item', children: [] })
        } else {
          let existing = items.find((i) => i.name === parts[0] && i.type === 'group')
          if (!existing) {
            existing = { name: parts[0], type: 'group', children: [], expand: false }
            items.push(existing)
          }
          existing.children.push({
            ...b,
            displayName: parts.slice(1).join('/'),
            type: 'item'
          })
          if (this.$route.path.includes(b.name)) existing.expand = true
        }
      }
      let sorted = items.sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return 0
      })

      return [
        ...sorted.filter((it) => it.name === 'main'),
        ...sorted.filter((it) => it.name !== 'main')
      ]
      // return items
    },
    streamUrl() {
      return `${window.location.origin}/streams/${this.$route.params.streamId}`
    },
    parsedDescription() {
      if (!this.stream || !this.stream.description) return 'No description provided.'
      return this.stream.description.replace(
        /\[(.+?)\]\((https?:\/\/[a-zA-Z0-9/.(]+?)\)/g,
        '<a href="$2" class="text-decoration-none" target="_blank">$1</a>'
      )
    },
    sortedBranches() {
      // TODO: group by `/` (for later)
      if (!this.branchQuery) return
      return [
        this.branchQuery.branches.items.find((b) => b.name === 'main'),
        ...this.branchQuery.branches.items.filter((b) => b.name !== 'main' && b.name !== 'globals')
      ]
    },
    branchesTotalCount() {
      if (!this.branchQuery) return 0
      return this.branchQuery.branches.items.filter((b) => b.name !== 'globals').length
    },
    userId() {
      return localStorage.getItem('uuid')
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {
    $route(to) {
      // Ensures branch menu is open when navigating to a branch url
      if (to.name.toLowerCase().includes('branch') && !this.branchMenuOpen)
        this.branchMenuOpen = true
      // closes any share dialog
      this.shareStream = false
      this.snackbar = false
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
    goToItemAndCloseSnackbar() {
      if (this.snackbarInfo.type === 'commit') {
        this.$router.push(`/streams/${this.$route.params.streamId}/commits/${this.snackbarInfo.id}`)
      } else if (this.snackbarInfo.type === 'branch') {
        this.$router.push(
          `/streams/${this.$route.params.streamId}/branches/${this.snackbarInfo.name}`
        )
        this.refetchBranches()
      }
      this.snackbar = false
    },
    showStreamInviteDialog() {
      this.$refs.streamInviteDialog.show()
    },
    async changeVisibility() {
      this.swapPermsLoading = true
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation editDescription($input: StreamUpdateInput!) {
              streamUpdate(stream: $input)
            }
          `,
          variables: {
            input: {
              id: this.$route.params.streamId,
              isPublic: this.stream.isPublic
            }
          }
        })
      } catch (e) {
        console.log(e)
        this.stream.isPublic = !this.stream.isPublic
      }
      this.swapPermsLoading = false
      this.$apollo.queries.stream.refetch()
    },
    refetchBranches() {
      this.$apollo.queries.branchQuery.refetch()
    },
    showNewBranchDialog() {
      this.$refs.branchDialog.show()
    },
    formatDate(d) {
      if (!this.stream) return null
      let date = new Date(d)
      let options = { year: 'numeric', month: 'short', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    }
  }
}
</script>
