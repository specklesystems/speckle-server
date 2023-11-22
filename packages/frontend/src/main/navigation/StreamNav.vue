<template>
  <portal v-if="canRenderNavPortal" to="nav">
    <div v-if="!$loggedIn()" class="px-4 my-2">
      <v-btn small block color="primary" @click="$loginAndSetRedirect()">Sign In</v-btn>
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
        <div class="simple-scrollbar" style="max-height: 100px; overflow-y: auto">
          <span v-if="stream && stream.description">
            {{ stream.description }}
          </span>
          <span v-else class="font-italic">No description provided</span>
        </div>
        <router-link
          v-if="stream.role === streamRoles.Owner"
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
          <v-list-item-title>Branches ({{ totalBranchCount }})</v-list-item-title>
        </template>
        <!-- <v-divider class="mb-1"></v-divider> -->
        <v-list-item
          v-if="stream.role !== streamRoles.Reviewer"
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

        <div v-if="!loading">
          <template v-for="(item, i) in groupedBranches">
            <v-list-item
              v-if="item.type === 'item'"
              :key="i"
              :to="`/streams/${stream.id}/branches/${formatBranchNameForURL(
                item.name
              )}`"
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
                :to="`/streams/${stream.id}/branches/${formatBranchNameForURL(
                  kid.name
                )}`"
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
        @refetch-branches="refetchBranches()"
      />
    </v-dialog>
  </portal>
</template>
<script>
import { computed } from 'vue'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import { StreamEvents } from '@/main/lib/core/helpers/eventHubHelper'
import { useRoute } from '@/main/lib/core/composables/router'
import { useAllStreamBranches } from '@/main/lib/stream/composables/branches'
import { Roles } from '@speckle/shared'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

export default {
  components: {
    NewBranch: () => import('@/main/dialogs/NewBranch')
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Nav], 'stream-nav', 0)],
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  setup() {
    const route = useRoute()
    const streamId = computed(() => route.params.streamId)
    const { localBranches, refetchBranches, totalBranchCount, branchesLoading } =
      useAllStreamBranches(streamId)

    return {
      localBranches,
      refetchBranches,
      totalBranchCount,
      loading: branchesLoading,
      streamRoles: Roles.Stream,
      formatBranchNameForURL
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
      const branches = this.localBranches
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
    },
    sortedBranches() {
      return [
        this.localBranches.items.find((b) => b.name === 'main'),
        ...this.localBranches.items.filter(
          (b) => b.name !== 'main' && b.name !== 'globals'
        )
      ]
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
    this.$eventHub.$on(StreamEvents.RefetchBranches, async () => {
      await this.refetchBranches()
    })
    this.$eventHub.$on('show-new-branch-dialog', () => {
      this.newBranchDialog = true
    })
  }
}
</script>
