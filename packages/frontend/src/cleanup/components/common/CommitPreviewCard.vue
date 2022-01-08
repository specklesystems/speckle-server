<template>
  <v-hover v-slot="{ hover }">
    <v-card
      class="rounded-lg overflow-hidden"
      :elevation="hover ? 10 : 1"
      style="transition: all 0.2s ease-in-out"
    >
      <preview-image
        :url="`/preview/${commit.streamId}/commits/${commit.id}`"
        :height="previewHeight"
      ></preview-image>
      <v-toolbar class="transparent elevation-0" dense>
        <v-toolbar-title>
          <router-link
            class="text-decoration-none"
            :to="`/streams/${commit.streamId}/commits/${commit.id}`"
          >
            <v-icon small>mdi-source-commit</v-icon>
            {{ commit.message }}
          </router-link>
        </v-toolbar-title>
      </v-toolbar>
      <div class="mx-1">
        <v-card-text class="caption d-flex pb-2 pt-0">
          <div>
            Created
            <timeago :datetime="commit.createdAt"></timeago>
          </div>
          <div class="text-right flex-grow-1">
            <span>({{ new Date(commit.createdAt).toLocaleString() }})</span>
          </div>
        </v-card-text>
      </div>
      <v-divider/>
      <div class="d-flex align-center caption px-5 py-2">
        <div class="text-truncate mr-2">
          <router-link
            class="text-decoration-none d-inline-flex align-center"
            :to="`/streams/${commit.streamId}`"
          >
            <v-icon x-small class="primary--text mr-2">mdi-folder-outline</v-icon>
            {{ commit.streamName }}
          </router-link>
        </div>
        <div class="text-right flex-grow-1 text-truncate">
          <router-link
            class="text-decoration-none d-inline-flex align-center"
            :to="`/streams/${commit.streamId}/branches/${commit.branchName}`"
          >
            <v-icon x-small class="primary--text mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </router-link>
        </div>
      </div>
      <div style="position: absolute; top: 10px; right: 20px">
        <commit-received-receipts :stream-id="commit.streamId" :commit-id="commit.id" shadow />
      </div>
      <div style="position: absolute; top: 10px; left: 12px">
        <source-app-avatar :application-name="commit.sourceApplication" />
      </div>
    </v-card>
  </v-hover>
</template>
<script>
export default {
  components: {
    PreviewImage: () => import('@/cleanup/components/common/PreviewImage'),
    CommitReceivedReceipts: () => import('@/cleanup/components/common/CommitReceivedReceipts'),
    SourceAppAvatar: () => import('@/cleanup/components/common/SourceAppAvatar')
  },
  props: {
    commit: { type: Object, default: () => null },
    previewHeight: { type: Number, default: () => 180 },
    showCollabs: { type: Boolean, default: true },
    showDescription: { type: Boolean, default: true }
  }
}
</script>
