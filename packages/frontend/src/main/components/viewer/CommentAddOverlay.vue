<template>
  <div
    ref="parent"
    style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; overflow: hidden"
    class="no-mouse-parent"
  >
    <div
      ref="commentOverlay"
      :class="`absolute-pos comment-overlay rounded-xl ${expand ? 'expanded' : ''}`"
      :style="`${!expand ? 'display:none; pointer-events:none;' : ''}`"
    >
      <div class="px-2">
        <v-card class="elevation-2 rounded-xl pa-1 my-1">
          <v-textarea
            ref="commentTextArea"
            v-model="commentText"
            :style="`${!expand ? 'display:none; pointer-events:none;' : ''}`"
            rounded
            autofocus
            class="transparent elevation-0 pb-2"
            auto-grow
            hide-details
            dense
            placeholder="Type your comment here, and hit enter to save!"
            append-icon="mdi-send"
            hint="Add a comment"
            style="line-height: 1.25em !important"
            @click:append="addComment()"
            @keydown.enter.shift.exact.prevent="addComment()"
          ></v-textarea>
          <br />
          <span class="caption px-4 grey--text"><i>Shift + Enter will save the comment.</i></span>
        </v-card>
        <!-- <span class="caption">Hit enter to save.</span> -->
        <!-- <v-btn rounded block small class="mt-2 mb-2">add</v-btn> -->
      </div>
    </div>
    <div v-show="visible" ref="commentButton" class="absolute-pos">
      <v-btn icon dark class="elevation-5 primary pa-0 ma-o" @click="toggleExpand()">
        <v-icon v-if="!expand" dark small>mdi-comment-plus</v-icon>
        <v-icon v-else dark small>mdi-close</v-icon>
      </v-btn>
    </div>
    <portal to="viewercontrols">
      <v-btn
        v-tooltip="'Add a comment!'"
        icon
        dark
        class="elevation-5 primary pa-0 ma-o"
        @click="toggleExpand()"
      >
        <v-icon v-if="!expand" dark small>mdi-comment-plus</v-icon>
        <v-icon v-else dark small>mdi-close</v-icon>
      </v-btn>
    </portal>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'

import { getCamArray } from './viewerFrontendHelpers'
export default {
  data() {
    return {
      location: null,
      expand: false,
      visible: true,
      commentText: null
    }
  },
  mounted() {
    window.__viewer.on('select', debounce(this.handleSelect, 10))
    window.__viewer.cameraHandler.controls.addEventListener('update', this.updateCommentBubble)
    this.$refs.commentTextArea.calculateInputHeight()
  },
  methods: {
    async addComment() {
      let commentInput = {
        streamId: this.$route.params.streamId,
        resources: [this.$route.params.resourceId],
        text: this.commentText,
        data: {
          location: this.location,
          camPos: getCamArray(),
          filters: null, // TODO
          sectionBox: null, // TODO
          selection: null, // TODO
          screenshot: null // TODO
        }
      }
      if (this.$route.query.overlay)
        commentInput.resources.push(...this.$route.query.overlay.split(','))
      await this.$apollo.mutate({
        mutation: gql`
          mutation commentCreate($input: CommentCreateInput!) {
            commentCreate(input: $input)
          }
        `,
        variables: { input: commentInput }
      })
      this.expand = false
      this.visible = false
      this.commentText = null
      window.__viewer.interactions.deselectObjects()
    },
    sendStatusUpdate() {
      // TODO: typing or not
    },
    toggleExpand() {
      this.$refs.commentOverlay.style.transition = 'all 0.1s ease'
      this.expand = !this.expand
    },
    handleSelect(info) {
      if (!info.location) {
        // TODO: deselect event
        this.expand = false
        this.visible = false
        return
      }
      if (!this.$refs.commentButton) return
      this.visible = true

      let projectedLocation = new THREE.Vector3(info.location.x, info.location.y, info.location.z)
      this.location = new THREE.Vector3(info.location.x, info.location.y, info.location.z)

      let cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      projectedLocation.project(cam)
      let collapsedSize = this.$refs.commentButton.clientWidth
      collapsedSize = 36
      const mappedLocation = new THREE.Vector3(
        (projectedLocation.x * 0.5 + 0.5) * this.$refs.parent.clientWidth - collapsedSize / 2,
        (projectedLocation.y * -0.5 + 0.5) * this.$refs.parent.clientHeight - collapsedSize / 1,
        0
      )
      this.$refs.commentButton.style.transition = 'all 0.3s ease'
      this.$refs.commentButton.style.top = `${mappedLocation.y}px`
      this.$refs.commentButton.style.left = `${mappedLocation.x}px`

      this.$refs.commentOverlay.style.transition = 'all 0.1s ease'
      this.$refs.commentOverlay.style.top = `${mappedLocation.y + 40}px`
      this.$refs.commentOverlay.style.left = `${mappedLocation.x}px`
    },
    updateCommentBubble() {
      // TODO: Clamping, etc.
      if (!this.location) return
      if (!this.$refs.commentButton) return
      let cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      let projectedLocation = this.location.clone()
      projectedLocation.project(cam)
      let collapsedSize = this.$refs.commentButton.clientWidth
      collapsedSize = 36
      const mappedLocation = new THREE.Vector3(
        (projectedLocation.x * 0.5 + 0.5) * this.$refs.parent.clientWidth - collapsedSize / 2,
        (projectedLocation.y * -0.5 + 0.5) * this.$refs.parent.clientHeight - collapsedSize / 1,
        0
      )
      this.$refs.commentButton.style.transition = ''
      this.$refs.commentButton.style.top = `${mappedLocation.y}px`
      this.$refs.commentButton.style.left = `${mappedLocation.x}px`

      this.$refs.commentOverlay.style.transition = ''
      this.$refs.commentOverlay.style.top = `${mappedLocation.y + 40}px`
      this.$refs.commentOverlay.style.left = `${mappedLocation.x}px`
    }
  }
}
</script>
<style scoped>
::v-deep .v-text-field__slot {
  padding-top: 6px;
}
::v-deep .v-input__append-inner {
  margin-top: 5px !important;
}
::v-deep .v-input__slot {
  padding: 0px 10px !important;
}
::v-deep textarea {
  line-height: 1.25em;
  min-height: none;
  height: 1.25em;
  padding-top: 4px;
}
.no-mouse-parent {
  pointer-events: none;
}
.no-mouse-parent * {
  pointer-events: auto;
}
.absolute-pos {
  position: absolute;
  top: -100px;
  left: -100px;
}

.comment-overlay {
  min-height: 36px;
  width: 270px;
  height: 10px;
  overflow: hidden;
  opacity: 0;
}

.comment-overlay.expanded {
  width: 300px;
  height: auto;
  opacity: 1;
}

.transition {
  transition: all 0.2s ease;
}
</style>
