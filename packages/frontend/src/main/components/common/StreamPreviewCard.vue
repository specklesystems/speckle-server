<template>
  <v-hover v-slot="{ hover }">
    <v-card
      class="rounded-lg"
      :elevation="hover ? 10 : 1"
      style="transition: all 0.2s ease-in-out"
    >
      <router-link :to="`/streams/${stream.id}`">
        <preview-image
          :url="`/preview/${stream.id}`"
          :height="previewHeight"
          rotate
        ></preview-image>
        <stream-favorite-btn :user="user" :stream="stream" class="favorite-button" />
      </router-link>
      <v-toolbar class="transparent elevation-0" dense>
        <v-toolbar-title>
          <router-link :to="`/streams/${stream.id}`" class="text-decoration-none">
            <!-- <v-icon small class="primary--text">mdi-folder</v-icon> -->
            {{ stream.name }}
          </router-link>
        </v-toolbar-title>
        <v-spacer />
      </v-toolbar>
      <v-card-text class="mt-0 pt-0">
        <div class="d-flex align-center justify-between caption">
          <div class="mr-2">
            Updated
            <timeago :datetime="stream.updatedAt"></timeago>
          </div>
          <div class="mr-1 text-right flex-grow-1">
            <v-icon x-small class="">mdi-source-branch</v-icon>
            {{ stream.branches.totalCount }}
            <v-icon x-small class="">mdi-source-commit</v-icon>
            {{ stream.commits.totalCount }}
            <v-icon x-small class="">mdi-heart-multiple</v-icon>
            {{ stream.favoritesCount }}
          </div>
        </div>
      </v-card-text>
      <div style="position: absolute; top: 10px; left: 12px">
        <v-chip
          v-if="stream.commentCount !== 0"
          v-tooltip="
            `${stream.commentCount} comment${stream.commentCount === 1 ? '' : 's'}`
          "
          :to="`/streams/${stream.id}/comments`"
          small
          class="caption primary"
          dark
        >
          <v-icon x-small class="mr-1">mdi-comment-outline</v-icon>
          {{ stream.commentCount }}
        </v-chip>
      </div>
      <v-divider />
      <div class="px-5 py-2 d-flex align-center">
        <collaborators-display
          v-if="stream.collaborators"
          :stream="stream"
          :link-to-collabs="false"
        />
        <div
          v-if="stream.role"
          :class="`caption text-right flex-grow-1 ${
            stream.role.split(':')[1] === 'owner' ? 'primary--text' : ''
          }`"
        >
          <v-icon
            small
            :class="`mr-1 ${
              stream.role.split(':')[1] === 'owner' ? 'primary--text' : ''
            }`"
          >
            mdi-account-key-outline
          </v-icon>
          {{ stream.role.split(':')[1] }}
        </div>
      </div>
    </v-card>
  </v-hover>
</template>
<script>
export default {
  components: {
    PreviewImage: () => import('@/main/components/common/PreviewImage.vue'),
    CollaboratorsDisplay: () => import('@/main/components/stream/CollaboratorsDisplay'),
    StreamFavoriteBtn: () =>
      import('@/main/components/stream/favorites/StreamFavoriteBtn.vue')
  },
  props: {
    stream: { type: Object, default: () => null },
    previewHeight: { type: Number, default: () => 180 },
    showCollabs: { type: Boolean, default: true },
    showDescription: { type: Boolean, default: true },
    user: { type: Object, default: () => null }
  }
}
</script>
<style lang="scss" scoped>
.favorite-button {
  $margin: 10px;

  position: absolute;
  top: $margin;
  right: $margin;
}
</style>
