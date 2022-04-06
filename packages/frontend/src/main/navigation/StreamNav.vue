<template>
  <portal to="nav">
    <div v-if="!loggedIn" class="px-4 my-2">
      <v-btn small block color="primary" to="/authn/login">Sign In</v-btn>
    </div>
    <v-list
      v-if="stream"
      :key="`super-unclick-me`"
      style="padding-left: 10px"
      nav
      dense
      class="mt-0 pt-0"
      expand
    >
      <v-list-item link :to="`/streams`" exact class="">
        <v-list-item-icon>
          <v-icon small class>mdi-arrow-left-drop-circle</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title class="font-weight-bold">Streams</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <div class="caption px-3 my-4">
        <perfect-scrollbar
          style="max-height: 100px"
          :options="{ suppressScrollX: true }"
        >
          <span v-if="stream && stream.description">
            {{ stream.description }}
          </span>
          <span v-else class="font-italic">No description provided</span>
        </perfect-scrollbar>
        <router-link
          v-if="stream.role === 'stream:owner'"
          :to="`/streams/${$route.params.streamId}/settings`"
          class="text-decoration-none"
        >
          Edit
        </router-link>
      </div>
      <v-subheader>STREAM MENU</v-subheader>
      <v-list-item link exact :to="`/streams/${stream.id}`">
        <v-list-item-icon>
          <v-icon small>mdi-home</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Stream Home</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!-- Branch menu group -->
      <v-list-group v-model="branchMenuOpen" class="my-2">
        <template #activator>
          <v-list-item-icon>
            <v-icon small>mdi-source-branch</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Branches ({{ branchesTotalCount }})</v-list-item-title>
        </template>
        <!-- <v-divider class="mb-1"></v-divider> -->
        <v-list-item
          v-if="stream.role !== 'stream:reviewer'"
          v-tooltip.bottom="'Create a new branch to help categorise your commits.'"
          link
          @click="newBranchDialog = true"
        >
          <v-list-item-icon>
            <v-icon small style="padding-top: 10px" class="primary--text">
              mdi-plus-box
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>New Branch</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Create a new branch to help categorise your commits.
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <div v-if="!$apollo.queries.branchQuery.loading">
          <template v-for="(item, i) in groupedBranches">
            <v-list-item
              v-if="item.type === 'item'"
              :key="i"
              :to="`/streams/${stream.id}/branches/${item.name}`"
              exact
            >
              <v-list-item-icon>
                <v-icon v-if="item.name !== 'main'" small style="padding-top: 10px">
                  mdi-source-branch
                </v-icon>
                <v-icon v-else small style="padding-top: 10px" class="primary--text">
                  mdi-star
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.displayName }} ({{ item.commits.totalCount }})
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  {{ item.description ? item.description : 'no description' }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-group
              v-else
              :key="i"
              sub-group
              :value="item.expand"
              prepend-icon=""
              :group="item.name"
            >
              <template #activator>
                <v-list-item style="overflow: visible">
                  <v-list-item-icon style="position: relative; left: -26px">
                    <v-icon style="padding-top: 10px">
                      {{ item.expand ? 'mdi-chevron-down' : 'mdi-chevron-down' }}
                    </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content style="position: relative; left: -8px">
                    <v-list-item-title>{{ item.name }}</v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      {{ item.children.length }} branches
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </template>
              <v-list-item
                v-for="(kid, j) in item.children"
                :key="j"
                :to="`/streams/${stream.id}/branches/${kid.name}`"
                exact
              >
                <v-list-item-icon>
                  <v-icon small style="padding-top: 10px">mdi-source-branch</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ kid.displayName }} ({{ kid.commits.totalCount }})
                  </v-list-item-title>
                  <v-list-item-subtitle class="caption">
                    {{ kid.description ? kid.description : 'no description' }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-group>
          </template>
        </div>

        <v-skeleton-loader v-else type="list-item-two-line" />
        <v-divider class="mb-2" />
      </v-list-group>

      <!-- Comments  -->
      <v-list-item link exact :to="`/streams/${stream.id}/comments`">
        <v-list-item-icon>
          <v-icon small>mdi-comment-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Comments</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!-- Other menu items go here -->

      <v-list-item link :to="`/streams/${stream.id}/globals`">
        <v-list-item-icon>
          <v-icon small>mdi-earth</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Globals</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <portal-target name="stream-globals-nav" />

      <v-list-item link :to="`/streams/${stream.id}/uploads`">
        <v-list-item-icon>
          <v-icon small>mdi-arrow-up</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Import File</v-list-item-title>
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
    <v-dialog
      v-model="newBranchDialog"
      max-width="500"
      :fullscreen="$vuetify.breakpoint.xsOnly"
    >
      <new-branch
        @close="newBranchDialog = false"
        @refetch-branches="$apollo.queries.branchQuery.refetch()"
      />
    </v-dialog>
  </portal>
</template>
<script>
import gql from 'graphql-tag'
export default {
  components: {
    NewBranch: () => import('@/main/dialogs/NewBranch')
  },
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  apollo: {
    branchQuery: {
      query: gql`
        query Stream($id: String!) {
          branchQuery: stream(id: $id) {
            id
            branches {
              totalCount
              items {
                name
                description
                author {
                  id
                  name
                }
                commits {
                  totalCount
                }
              }
            }
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update: (data) => {
        // console.log(data.branchQuery.branches.items)
        return data.branchQuery
      }
    }
  },
  data() {
    return {
      branchMenuOpen: false,
      newBranchDialog: false
    }
  },
  computed: {
    groupedBranches() {
      if (!this.branchQuery) return
      const branches = this.branchQuery.branches.items
      const items = []
      for (const b of branches) {
        if (b.name === 'globals') continue
        const parts = b.name.split('/')
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
      const sorted = items.sort((a, b) => {
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
    sortedBranches() {
      // TODO: group by `/` (for later)
      if (!this.branchQuery) return
      return [
        this.branchQuery.branches.items.find((b) => b.name === 'main'),
        ...this.branchQuery.branches.items.filter(
          (b) => b.name !== 'main' && b.name !== 'globals'
        )
      ]
    },
    branchesTotalCount() {
      if (!this.branchQuery) return 0
      return this.branchQuery.branches.items.filter((b) => b.name !== 'globals').length
    },
    loggedIn() {
      return localStorage.getItem('uuid') !== null
    }
  },
  watch: {
    $route() {
      if (!this.branchMenuOpen)
        this.branchMenuOpen = this.$route.name.toLowerCase().includes('branch')
    }
  },
  mounted() {
    this.branchMenuOpen = this.$route.name.toLowerCase().includes('branch')
    this.$eventHub.$on('branch-refresh', () => {
      this.$apollo.queries.branchQuery.refetch()
    })
  }
}
</script>
