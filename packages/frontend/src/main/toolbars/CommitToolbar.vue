<template>
  <portal v-if="canRenderToolbarPortal" to="toolbar">
    <div class="d-flex align-center">
      <!-- <div class="text-truncate flex-shrink-0">
        <router-link v-tooltip="'all streams'" to="/streams" class="text-decoration-none mx-1">
          <v-icon small class="primary--text mb-1">mdi-folder-multiple</v-icon>
        </router-link>
      </div> -->
      <div class="text-truncate flex-shrink-0 flex-lg-shrink-1">
        <router-link
          v-tooltip="stream.name"
          class="text-decoration-none space-grotesk mx-1"
          :to="`/streams/${stream.id}`"
        >
          <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
          <b class="d-none d-lg-inline">{{ stream.name }}</b>
        </router-link>
      </div>
      <div class="text-truncate flex-shrink-0 mx-1">
        /
        <router-link
          v-tooltip="'Branch'"
          :to="`/streams/${stream.id}/branches/${stream.commit.branchName}`"
          class="text-decoration-none space-grotesk font-weight-bold"
        >
          <v-icon small class="mx-1 primary--text" style="font-size: 13px">
            mdi-source-branch
          </v-icon>
          <b class="d-none d-sm-inline">{{ stream.commit.branchName }}</b>
        </router-link>
      </div>
      <div class="text-truncate flex-grow-1">
        /
        <router-link
          v-tooltip="stream.commit.message"
          class="text-decoration-none space-grotesk mx-1"
          :to="`/streams/${stream.id}/commits/${stream.commit.id}`"
        >
          <v-icon small class="mb-1">mdi-source-commit</v-icon>
          {{ stream.commit.message }}
        </router-link>
      </div>
      <div class="text-truncate flex-shrink-0 hidden-xs-only">
        <!-- <user-avatar
          :id="stream.commit.authorId"
          :avatar="stream.commit.authorAvatar"
          :name="stream.commit.authorName"
          :size="20"
        /> -->
        <!-- <span class="caption mr-1">
          <timeago :datetime="stream.commit.createdAt"></timeago>
        </span> -->
        <!-- <source-app-avatar :application-name="stream.commit.sourceApplication" /> -->
        <commit-received-receipts
          :commit-id="stream.commit.id"
          :stream-id="stream.id"
        />
        <v-btn
          v-if="
            stream &&
            stream.role !== 'stream:reviewer' &&
            (stream.commit.authorId === $userId() || stream.role === 'stream:owner')
          "
          v-tooltip="'Edit commit'"
          text
          elevation="0"
          color="primary"
          small
          rounded
          :fab="$vuetify.breakpoint.mdAndDown"
          dark
          @click="$emit('edit-commit')"
        >
          <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">
            mdi-pencil
          </v-icon>
          <span class="hidden-md-and-down">Edit</span>
        </v-btn>
      </div>
      <div class="text-truncate flex-shrink-0 hidden-sm-and-up">
        <v-btn icon @click="showCommitInfo = true">
          <v-icon small>mdi-information</v-icon>
        </v-btn>
        <v-dialog v-model="showCommitInfo">
          <v-card>
            <v-toolbar flat>
              <v-app-bar-nav-icon style="pointer-events: none">
                <v-icon>mdi-pencil</v-icon>
              </v-app-bar-nav-icon>
              <v-toolbar-title>Commit Info</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="showCommitInfo = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text class="mt-2">
              <div class="pa-2">Commit message: {{ stream.commit.message }}</div>
              <v-divider />
              <div class="pa-2">
                Author: {{ stream.commit.authorName }}
                <user-avatar
                  :id="stream.commit.authorId"
                  :avatar="stream.commit.authorAvatar"
                  :name="stream.commit.authorName"
                  :size="20"
                />
              </div>
              <v-divider />
              <div class="pa-2">
                Created
                <timeago :datetime="stream.commit.createdAt"></timeago>
                ( {{ new Date(stream.commit.createdAt).toLocaleString() }})
              </div>
              <v-divider />
              <div class="pa-2">
                Source app:
                <source-app-avatar
                  :application-name="stream.commit.sourceApplication"
                />
              </div>
              <v-divider />
              <div class="pa-2">
                <commit-received-receipts
                  :commit-id="stream.commit.id"
                  :stream-id="stream.id"
                />
              </div>
              <div class="pa-2">
                <v-btn
                  v-if="
                    stream &&
                    stream.role !== 'stream:reviewer' &&
                    stream.commit.authorId === $userId()
                  "
                  v-tooltip="'Edit commit'"
                  elevation="0"
                  color="primary"
                  small
                  rounded
                  block
                  :fab="$vuetify.breakpoint.mdAndDown"
                  dark
                  @click="$emit('edit-commit')"
                >
                  <v-icon
                    small
                    :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`"
                  >
                    mdi-pencil
                  </v-icon>
                  <span>Edit Message/Delete</span>
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>
      </div>
    </div>
  </portal>
</template>
<script>
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

export default {
  components: {
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar'),
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    CommitReceivedReceipts: () =>
      import('@/main/components/common/CommitReceivedReceipts')
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'stream-commit', 1)],
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  setup: () => ({ formatBranchNameForURL }),
  data() {
    return { showCommitInfo: false }
  }
}
</script>
