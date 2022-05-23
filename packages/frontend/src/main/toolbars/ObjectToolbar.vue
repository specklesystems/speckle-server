<template>
  <portal v-if="canRenderToolbarPortal" to="toolbar">
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
      <div class="text-truncate flex-shrink-0 mx-1 d-inline-flex">
        /
        <div class="text-decoration-none space-grotesk">
          <v-icon small class="mx-1 primary--text" style="font-size: 13px">
            mdi-cube-outline
          </v-icon>
          <b class="d-none d-sm-inline">Object</b>
          <code class="ml-2">{{ stream.object.id }}</code>
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
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'

export default {
  mixins: [
    buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'stream-commit-objects', 1)
  ],
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return { showInfo: false }
  },
  computed: {
    commitDate() {
      if (!this.stream.commit) return null
      const date = new Date(this.stream.commit.createdAt)
      const options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    }
  }
}
</script>
