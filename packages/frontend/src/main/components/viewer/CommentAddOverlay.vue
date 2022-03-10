<template>
  <!-- 
    HIC SVNT DRACONES
  -->
  <div
    ref="parent"
    style="
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      z-index: 25;
    "
    class="no-mouse"
  >
    <v-slide-x-transition>
      <div
        v-show="visible && !$store.state.selectedComment"
        ref="commentButton"
        class="absolute-pos"
      >
        <div class="d-flex align-center" style="height: 48px; width: 320px">
          <v-btn
            v-tooltip="!expand ? 'Add a comment (ctrl + shift + c)' : 'Cancel'"
            small
            icon
            :dark="!expand"
            :class="`mouse elevation-5 ${!expand ? 'primary' : 'background'} mr-2`"
            @click="toggleExpand()"
          >
            <v-icon v-if="!expand" dark x-small>mdi-comment-plus</v-icon>
            <v-icon v-else dark x-small>mdi-close</v-icon>
          </v-btn>
          <v-slide-x-transition>
            <div v-if="expand" style="width: 100%" class="d-flex">
              <v-textarea
                v-model="commentText"
                solo
                hide-details
                autofocus
                auto-grow
                rows="1"
                placeholder="Your comment..."
                class="mouse rounded-xl caption elevation-15"
                append-icon="mdi-send"
                @keydown.enter.shift.exact.prevent="addComment()"
              ></v-textarea>
              <v-btn
                v-tooltip="'Send comment (shift + enter)'"
                icon
                dark
                large
                class="mouse elevation-0 primary pa-0 ma-o"
                style="left: -47px; top: 1px; height: 48px; width: 48px"
                @click="addComment()"
              >
                <v-icon dark small>mdi-send</v-icon>
              </v-btn>
            </div>
          </v-slide-x-transition>
        </div>
      </div>
    </v-slide-x-transition>
    <portal to="viewercontrols" :order="100">
      <v-slide-x-transition>
        <v-btn
          v-show="!location && !$store.state.selectedComment"
          v-tooltip="'Add a comment (ctrl + shift + c)'"
          icon
          dark
          large
          class="elevation-5 primary pa-0 ma-o"
          @click="toggleExpand()"
        >
          <v-icon v-if="!expand" dark small>mdi-comment-plus</v-icon>
          <v-icon v-else dark small>mdi-close</v-icon>
        </v-btn>
      </v-slide-x-transition>
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
    // this.$refs.commentTextArea.calculateInputHeight()
    document.addEventListener(
      'keyup',
      function (e) {
        // console.log(e)
        if (e.shiftKey && e.ctrlKey && e.keyCode === 67) this.toggleExpand()
      }.bind(this)
    )
  },
  methods: {
    async addComment() {
      if (!this.commentText || this.commentText.length < 5) {
        this.$eventHub.$emit('notification', {
          text: `Comment must be at least 5 characters.`
        })
        return
      }
      let camTarget = window.__viewer.cameraHandler.activeCam.controls.getTarget()
      let commentInput = {
        streamId: this.$route.params.streamId,
        resources: [
          { resourceType: 'stream', resourceId: this.$route.params.streamId },
          {
            resourceType: this.$route.path.includes('object') ? 'object' : 'commit',
            resourceId: this.$route.params.resourceId
          }
        ],
        text: this.commentText,
        data: {
          location: this.location
            ? this.location
            : new THREE.Vector3(camTarget.x, camTarget.y, camTarget.z),
          camPos: getCamArray(),
          filters: this.$store.state.appliedFilter,
          sectionBox: window.__viewer.sectionBox.getCurrentBox(),
          selection: null // TODO for later, lazy now
        },
        screenshot: window.__viewer.interactions.screenshot()
      }
      if (this.$route.query.overlay) {
        commentInput.resources.push(
          ...this.$route.query.overlay
            .split(',')
            .map((res) => ({ resourceId: res, resourceType: this.$resourceType(res) }))
        )
      }
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation commentCreate($input: CommentCreateInput!) {
              commentCreate(input: $input)
            }
          `,
          variables: { input: commentInput }
        })
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }
      this.expand = false
      this.visible = false
      this.commentText = null
      window.__viewer.interactions.deselectObjects()
    },
    sendStatusUpdate() {
      // TODO: typing or not
    },
    toggleExpand() {
      this.expand = !this.expand
      if (this.expand && !this.location) {
        this.visible = true
        this.$refs.commentButton.style.transform = `translate(-50%, -50%)`
        this.$refs.commentButton.style.top = `50%`
        this.$refs.commentButton.style.left = `50%`
      }

      if (!this.location && !this.expand) this.visible = false
    },
    handleSelect(info) {
      this.expand = false
      if (!info.location) {
        // TODO: deselect event
        this.visible = false
        this.location = null
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
      this.$refs.commentButton.style.transform = ''
      this.$refs.commentButton.style.transition = 'all 0.3s ease'
      this.$refs.commentButton.style.top = `${mappedLocation.y - 7}px`
      this.$refs.commentButton.style.left = `${mappedLocation.x}px`
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
      this.$refs.commentButton.style.transform = ''
      this.$refs.commentButton.style.transition = ''
      this.$refs.commentButton.style.top = `${mappedLocation.y - 7}px`
      this.$refs.commentButton.style.left = `${mappedLocation.x}px`
    }
  }
}
</script>
<style scoped>
.no-mouse {
  pointer-events: none;
}

.mouse {
  pointer-events: auto;
}

.absolute-pos {
  position: absolute;
  top: -100px;
  left: -100px;
}

.transition {
  transition: all 0.2s ease;
}
</style>
