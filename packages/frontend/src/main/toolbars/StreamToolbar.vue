<template>
  <div v-if="stream">
    <portal v-if="canRenderToolbarPortal" to="toolbar">
      <div class="d-flex align-center">
        <div class="text-truncate">
          <router-link
            v-tooltip="stream.name"
            class="text-decoration-none space-grotesk mx-1"
            :to="`/streams/${stream.id}`"
          >
            <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
            <b>{{ stream.name }}</b>
          </router-link>
        </div>
        <div class="d-none d-sm-inline-block text-truncate">
          <v-chip v-if="stream.role" v-tooltip="'Your role'" small class="ml-1">
            <v-icon small left>mdi-account-key-outline</v-icon>
            {{ stream.role.split(':')[1] }}
          </v-chip>
          <span
            v-tooltip="{
              html: true,
              content: `Last updated: ${new Date(stream.updatedAt).toLocaleString()}<br>
                Commits: ${stream.commits.totalCount} <br>
                Branches: ${stream.branches.totalCount}`
            }"
            class="caption mx-2"
          >
            <!-- <v-icon style="font-size: 11px" class="ml-1">mdi-source-commit</v-icon>
            {{ stream.commits.totalCount }}
            <v-icon style="font-size: 11px" class="ml-1">mdi-source-branch</v-icon>
            {{ stream.branches.totalCount }} -->
            <v-icon x-small class="">mdi-heart-multiple</v-icon>
            {{ stream.favoritesCount }}
          </span>
        </div>
        <div class="d-none d-sm-inline-block">
          <collaborators-display :stream="stream" />
        </div>
      </div>
    </portal>
    <portal v-if="canRenderActionsPortal" to="actions">
      <span v-if="user" style="position: relative; right: -5px">
        <stream-favorite-btn :stream="stream" :user="user" />
      </span>
      <v-btn
        v-if="stream"
        v-tooltip="'Share this stream/commit'"
        xxxelevation="0"
        rounded
        class="mr-2 ml-2 px-0 primary"
        @click="shareStream = true"
      >
        <v-icon v-if="!stream.isPublic" small class="mr-1">mdi-lock</v-icon>
        <v-icon small>mdi-share-variant</v-icon>
      </v-btn>
    </portal>
    <share-stream-dialog
      :show.sync="shareStream"
      :stream-id="stream.id"
      :branch-name="$route.params.branchName"
      :resource-id="$route.params.resourceId"
    />
  </div>
</template>
<script>
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  components: {
    CollaboratorsDisplay: () => import('@/main/components/stream/CollaboratorsDisplay'),
    ShareStreamDialog: () => import('@/main/dialogs/ShareStreamDialog.vue'),
    StreamFavoriteBtn: () =>
      import('@/main/components/stream/favorites/StreamFavoriteBtn.vue')
  },
  mixins: [
    buildPortalStateMixin(
      [STANDARD_PORTAL_KEYS.Actions, STANDARD_PORTAL_KEYS.Toolbar],
      'stream-main',
      0
    )
  ],
  props: {
    stream: { type: Object, required: true },
    user: { type: Object, default: () => null }
  },
  data() {
    return { shareStream: false, portalIdentity: 'stream-main' }
  }
}
</script>
