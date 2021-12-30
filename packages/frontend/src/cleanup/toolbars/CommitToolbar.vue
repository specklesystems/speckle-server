<template>
  <div class="ml-2">
    <div v-if="true">
      /
      <router-link
        v-tooltip="'Go to branch ' + stream.commit.branchName"
        :to="`/streams/${stream.id}/branches/${stream.commit.branchName}`"
        class="text-decoration-none space-grotesk"
      >
        <v-icon class="primary--text mr-1 mb-1" style="font-size: 14px">mdi-source-branch</v-icon>
        <b>{{ stream.commit.branchName }}</b>
      </router-link>
      /
      <v-icon small class="">mdi-source-commit</v-icon>
      <span v-tooltip="'Commit message'" class="space-grotesk mr-2">
        {{ stream.commit.message }}
      </span>
      <user-avatar
        :id="stream.commit.authorId"
        :avatar="stream.commit.authorAvatar"
        :name="stream.commit.authorName"
        :size="22"
        class="hidden-sm-and-down"
      />
      <v-chip v-tooltip="commitDate" small class="mx-1">
        <timeago :datetime="stream.commit.createdAt"></timeago>
      </v-chip>
      <source-app-avatar
        :application-name="stream.commit.sourceApplication"
        class="hidden-sm-and-down"
      />
      <commit-received-receipts :commit-id="stream.commit.id" :stream-id="stream.id" />
      <v-btn
        v-if="stream && stream.role !== 'stream:reviewer' && stream.commit.authorId === $userId()"
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
        <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">mdi-pencil</v-icon>
        <span class="hidden-md-and-down">Edit</span>
      </v-btn>
    </div>
  </div>
</template>
<script>
export default {
  components: {
    SourceAppAvatar: () => import('@/cleanup/components/common/SourceAppAvatar'),
    UserAvatar: () => import('@/cleanup/components/common/UserAvatar'),
    CommitReceivedReceipts: () => import('@/cleanup/components/common/CommitReceivedReceipts')
  },
  props: ['stream'],
  computed: {
    commitDate() {
      if (!this.stream.commit) return null
      let date = new Date(this.stream.commit.createdAt)
      let options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    }
  }
}
</script>
