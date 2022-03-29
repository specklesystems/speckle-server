<template>
  <v-row class="align-center px-4">
    <v-col cols="3" class="text-truncate">
      <v-icon v-tooltip="`${stream.isPublic ? 'Public' : 'Private'} stream`" small>
        {{ stream.isPublic ? 'mdi-lock-open-variant-outline' : 'mdi-lock-outline' }}
      </v-icon>
      <router-link
        class="text-decoration-none space-grotesk mx-1"
        :to="`/streams/${stream.id}`"
        target="_blank"
      >
        {{ stream.name }}
      </router-link>
    </v-col>
    <v-col cols="2" class="caption text-truncate">
      Updated
      <b><timeago :datetime="stream.updatedAt"></timeago></b>
      <br />
      <span class="grey--text">
        ({{ new Date(stream.updatedAt).toLocaleString() }})
      </span>
    </v-col>
    <v-col cols="2" class="caption text-truncate">
      Created
      <b><timeago :datetime="stream.createdAt"></timeago></b>
      <br />
      <span class="grey--text">
        ({{ new Date(stream.createdAt).toLocaleString() }})
      </span>
    </v-col>
    <v-col v-tooltip="'Stream total size'" class="caption font-weight-bold">
      {{ `${(stream.size ? stream.size / 1048576 : 0.0).toFixed(2)} MB` }}
    </v-col>
    <v-col class="caption text-truncate grey--text">
      <v-icon small>mdi-source-branch</v-icon>
      {{ stream.branches.totalCount }}
      <v-icon small>mdi-source-commit</v-icon>
      {{ stream.commits.totalCount }}
    </v-col>
    <v-col class="caption text-truncate">
      <collaborators-display :stream="stream" :link-to-collabs="false" />
    </v-col>
    <v-col cols="1" class="text-right">
      <v-btn
        v-tooltip="'Delete stream'"
        small
        icon
        color="error"
        @click="$emit('delete', stream)"
      >
        <v-icon small>mdi-delete-outline</v-icon>
      </v-btn>
    </v-col>
  </v-row>
</template>
<script>
export default {
  components: {
    // UserAvatar: () => import('@/main/components/common/UserAvatar')
    CollaboratorsDisplay: () => import('@/main/components/stream/CollaboratorsDisplay')
  },
  props: {
    stream: { type: Object, default: () => null }
  }
}
</script>
