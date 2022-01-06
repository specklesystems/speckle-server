<template>
  <portal to="toolbar">
    <div class="d-flex align-center">
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
        <div class="text-decoration-none space-grotesk font-weight-bold">
          <v-icon small class="mx-1 primary--text" style="font-size: 13px">mdi-cube-outline</v-icon>
          <b class="d-none d-sm-inline">Object</b>
        </div>
      </div>
      <div class="text-truncate flex-shrink-0 hidden-sm-and-up">
        <v-btn icon @click="showInfo = true">
          <v-icon small>mdi-information</v-icon>
        </v-btn>
        <v-dialog v-model="showInfo">
          <v-card>
            <v-toolbar flat>
              <v-app-bar-nav-icon style="pointer-events: none">
                <v-icon>mdi-pencil</v-icon>
              </v-app-bar-nav-icon>
              <v-toolbar-title>Commit Info</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="showInfo = false"><v-icon>mdi-close</v-icon></v-btn>
            </v-toolbar>
            <v-card-text class="mt-2">TODO: Show resources info</v-card-text>
          </v-card>
        </v-dialog>
      </div>
    </div>
  </portal>
</template>
<script>
export default {
  components: {
    SourceAppAvatar: () => import('@/cleanup/components/common/SourceAppAvatar'),
    UserAvatar: () => import('@/cleanup/components/common/UserAvatar'),
    CommitReceivedReceipts: () => import('@/cleanup/components/common/CommitReceivedReceipts')
  },
  props: ['stream'],
  data() {
    return { showInfo: false }
  },
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
