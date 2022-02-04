<template>
  <v-hover v-slot="{ hover }">
    <v-card class="rounded-lg" :elevation="hover ? 10 : 1" style="transition: all 0.2s ease-in-out">
      <router-link :to="`/streams/${stream.id}`">
        <preview-image
          :url="`/preview/${stream.id}`"
          :color="hover"
          :height="previewHeight"
        ></preview-image>
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
          </div>
        </div>
      </v-card-text>
      <v-divider />
      <div class="px-5 py-2 d-flex align-center">
        <collaborators-display
          v-if="stream.collaborators"
          :stream="stream"
          :link-to-collabs="false"
        />
        <div
          :class="`caption text-right flex-grow-1 ${
            stream.role.split(':')[1] === 'owner' ? 'primary--text' : ''
          }`"
        >
          <v-icon
            small
            :class="`mr-1 ${stream.role.split(':')[1] === 'owner' ? 'primary--text' : ''}`"
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
    PreviewImage: () => import('@/main/components/common/PreviewImage'),
    CollaboratorsDisplay: () => import('@/main/components/stream/CollaboratorsDisplay')
  },
  props: {
    stream: { type: Object, default: () => null },
    previewHeight: { type: Number, default: () => 180 },
    showCollabs: { type: Boolean, default: true },
    showDescription: { type: Boolean, default: true }
  }
}
</script>
