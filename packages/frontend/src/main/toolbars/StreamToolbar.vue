<template>
  <div v-if="stream">
    <portal to="toolbar">
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
          <stream-favorite-btn :stream="stream" :user="user" />
        </div>
        <div class="d-none d-sm-inline-block text-truncate">
          <v-chip v-if="stream.role" v-tooltip="'Your role'" small class="ml-1">
            <v-icon small left>mdi-account-key-outline</v-icon>
            {{ stream.role.split(':')[1] }}
          </v-chip>
          <span
            v-tooltip="
              `Last updated: ${new Date(stream.updatedAt).toLocaleString()}<br>
          Commits: ${stream.commits.totalCount} <br>
          Branches: ${stream.branches.totalCount}`
            "
            class="caption mx-1"
          >
            Updated
            <timeago :datetime="stream.updatedAt"></timeago>
            <v-icon style="font-size: 11px" class="ml-1">mdi-source-commit</v-icon>
            {{ stream.commits.totalCount }}
            <v-icon style="font-size: 11px" class="ml-1">mdi-source-branch</v-icon>
            {{ stream.branches.totalCount }}
            <v-icon x-small class="">mdi-heart-multiple</v-icon>
            {{ stream.favoritesCount }}
          </span>
        </div>
        <div class="d-none d-sm-inline-block">
          <collaborators-display :stream="stream" />
        </div>
      </div>
    </portal>
    <portal to="actions">
      <v-btn
        v-if="stream"
        v-tooltip="'Share this stream'"
        elevation="0"
        text
        rounded
        class="mr-1"
        @click="shareStream = true"
      >
        <v-icon v-if="!stream.isPublic" x-small class="mr-1 grey--text">mdi-lock</v-icon>
        <v-icon v-else x-small class="mr-1 grey--text">mdi-lock-open</v-icon>
        <v-icon small class="primary--text">mdi-share-variant</v-icon>
      </v-btn>
    </portal>
    <v-dialog v-model="shareStream" max-width="600" :fullscreen="$vuetify.breakpoint.xsOnly">
      <share-stream-dialog
        :stream="stream"
        @close="shareStream = false"
        @visibility-changexxxx="$apollo.queries.stream.refetch()"
      />
    </v-dialog>
  </div>
</template>
<script>
export default {
  components: {
    CollaboratorsDisplay: () => import('@/main/components/stream/CollaboratorsDisplay'),
    ShareStreamDialog: () => import('@/main/dialogs/ShareStream'),
    StreamFavoriteBtn: () => import('@/main/components/stream/favorites/StreamFavoriteBtn.vue')
  },
  props: {
    stream: { type: Object, required: true },
    user: { type: Object, required: true }
  },
  data() {
    return { shareStream: false }
  }
}
</script>
