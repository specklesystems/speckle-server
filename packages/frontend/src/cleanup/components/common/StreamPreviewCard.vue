<template>
  <v-hover v-slot="{ hover }">
    <v-card
      :to="'/streams/' + stream.id"
      color=""
      :elevation="hover ? 5 : 1"
      style="transition: all 0.2s ease-in-out"
    >
      <preview-image :url="`/preview/${stream.id}`" :color="hover"></preview-image>
      <v-toolbar class="transparent elevation-0" dense>
        <v-toolbar-title>{{ stream.name }}</v-toolbar-title>
        <v-spacer />
      </v-toolbar>
      <v-card-text class="transparent elevation-0 mt-0 pt-0" dense>
        <v-toolbar-title>
          <v-chip v-if="stream.role" small class="mr-1">
            <v-icon small left>mdi-account-key-outline</v-icon>
            {{ stream.role.split(':')[1] }}
          </v-chip>
          <v-chip small class="mr-1">
            Updated
            <timeago :datetime="stream.updatedAt" class="ml-1"></timeago>
          </v-chip>
          <v-chip v-if="stream.branches" small>
            <v-icon small class="mr-2 float-left">mdi-source-branch</v-icon>
            {{ stream.branches.totalCount }}
          </v-chip>
        </v-toolbar-title>
        <div class="mt-3 mb-1 caption text-truncate">
          {{ stream.description || 'No description' }}
        </div>
        <collaborators-display :stream="stream" />
      </v-card-text>
    </v-card>
  </v-hover>
</template>
<script>
export default {
  components: {
    PreviewImage: () => import('@/cleanup/components/common/PreviewImage'),
    CollaboratorsDisplay: () => import('@/cleanup/components/stream/CollaboratorsDisplay')
  },
  props: ['stream']
}
</script>
