<template>
  <div v-if="stream">
    <portal to="title">
      <router-link
        v-show="true || (!streamNav && !$vuetify.breakpoint.smAndDown)"
        class="text-decoration-none space-grotesk"
        :to="`/streams/${stream.id}`"
      >
        <b>{{ stream.name }}</b>
      </router-link>
      <portal-target v-if="stream" name="streamTitleBar" slim style="display: inline-block">
        <!-- child routes can teleport things here -->
        <div v-if="stream">
          <span v-tooltip="stream.updatedAt.toString()" class="caption ml-2">
            Last Updated
            <timeago :datetime="stream.updatedAt"></timeago>
          </span>
          <v-chip small class="ml-2">{{ stream.commits.totalCount }} Commits</v-chip>
          <v-chip small class="ml-2">{{ stream.branches.totalCount }} Branches</v-chip>
          <collaborators-display :stream="stream" />
        </div>
      </portal-target>
    </portal>
    <portal to="actions">
      <v-btn
        v-if="stream"
        v-tooltip="'Share this stream'"
        elevation="0"
        text
        rounded
        @click="shareStream = true"
      >
        <v-icon v-if="!stream.isPublic" small class="mr-2 grey--text">mdi-lock</v-icon>
        <v-icon v-else small class="mr-2 grey--text">mdi-lock-open</v-icon>
        <v-icon small class="mr-2">mdi-share-variant</v-icon>
      </v-btn>
    </portal>
    <v-dialog v-model="shareStream" max-width="600" :fullscreen="$vuetify.breakpoint.xsOnly">
      <share-stream-dialog
        :stream="stream"
        @close="shareStream = false"
        @visibility-change="$apollo.queries.stream.refetch()"
      />
    </v-dialog>
  </div>
</template>
<script>
export default {
  components: {
    CollaboratorsDisplay: () => import('@/cleanup/components/stream/CollaboratorsDisplay'),
    ShareStreamDialog: () => import('@/cleanup/dialogs/ShareStream')
  },
  props: ['stream'],
  data() {
    return { shareStream: false }
  }
}
</script>
