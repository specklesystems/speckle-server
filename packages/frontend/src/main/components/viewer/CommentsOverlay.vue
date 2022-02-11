<template>
  <div
    ref="parent"
    style="width: 100%; height: 100vh; position: absolute; pointer-events: none; overflow: hidden"
    class="d-flex align-center justify-center no-mouse-parent"
  >
    <div
      v-for="(comment, index) in comments"
      :key="index"
      :ref="`comment-${index}`"
      class="absolute-pos rounded-xl caption"
    >
      <div class="">
        <div class="d-flex align-center">
          <v-btn
            small
            class="rounded-pill"
            @click="
              comment.expanded = !comment.expanded
              comment.expanded ? setCommentPow(comment) : null
            "
          >
            <span v-if="!comment.expanded">
              <v-icon small class="">mdi-comment</v-icon>
              1
            </span>
            <v-icon v-else small class="">mdi-close</v-icon>
          </v-btn>
          <v-slide-x-transition>
            <div
              v-show="comment.expanded"
              class="inline-block"
              style="display: inline-block; overflow: hidden"
            >
              <v-btn x-small icon class="ml-4">
                <v-icon small class="mr-2">mdi-camera</v-icon>
              </v-btn>
              <v-btn x-small icon class="ml-2">
                <v-icon small class="mr-2">mdi-filter</v-icon>
              </v-btn>
            </div>
          </v-slide-x-transition>
        </div>
        <v-scroll-y-transition>
          <v-card
            v-show="comment.expanded"
            class="elevation-2 rounded-xl my-1 mt-3"
            style="width: 300px"
          >
            <v-card-text v-html="comment.text"></v-card-text>
            <v-card-actions class="mx-1">
              <v-btn small class="rounded-xl">reply</v-btn>
            </v-card-actions>
          </v-card>
        </v-scroll-y-transition>
      </div>
    </div>
  </div>
</template>
<script>
import gql from 'graphql-tag'

export default {
  components: {
    // UserAvatar: () => import('@/main/components/common/UserAvatar'),
    // TextDotsTyping: () => import('@/main/components/common/TextDotsTyping')
  },
  apollo: {
    $subscribe: {
      userCommentCreated: {
        query: gql`
          subscription($streamId: String!, $resourceId: String!) {
            userCommentCreated(streamId: $streamId, resourceId: $resourceId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId,
            resourceId: this.$route.params.resourceId
          }
        },
        skip() {
          return !this.$loggedIn() || !this.$route.params.resourceId
        },
        result({ data }) {
          console.log(data.userCommentCreated)
          data.userCommentCreated.expanded = false
          this.comments.push(data.userCommentCreated)
          setTimeout(this.updateCommentBubbles, 0)
        }
      }
    }
  },
  data() {
    return {
      comments: []
    }
  },
  mounted() {
    window.__viewer.cameraHandler.controls.addEventListener('update', () =>
      this.updateCommentBubbles()
    )
  },
  methods: {
    setCommentPow(comment) {
      let camToSet = comment.camPos
      if (camToSet[6] === 1) {
        window.__viewer.toggleCameraProjection()
      }
      window.__viewer.interactions.setLookAt(
        { x: camToSet[0], y: camToSet[1], z: camToSet[2] }, // position
        { x: camToSet[3], y: camToSet[4], z: camToSet[5] } // target
      )
      if (camToSet[6] === 1) {
        window.__viewer.cameraHandler.activeCam.controls.zoom(camToSet[7], true)
      }
      // if (user.filter) this.$store.commit('setFilterDirect', { filter: user.filter })
      // else this.$store.commit('resetFilter')

      // if (user.sectionBox) {
      //   window.__viewer.sectionBox.on()
      //   window.__viewer.sectionBox.setBox(user.sectionBox, 0)
      // }
    },
    updateCommentBubbles() {
      let index = -1
      let cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      for (let comment of this.comments) {
        index++
        let commentEl = this.$refs[`comment-${index}`][0]
        // console.log(commentEl)
        if (!commentEl) continue
        let location = new THREE.Vector3(comment.location.x, comment.location.y, comment.location.z)
        location.project(cam)
        let commentLocation = new THREE.Vector3(
          (location.x * 0.5 + 0.5) * this.$refs.parent.clientWidth,
          (location.y * -0.5 + 0.5) * this.$refs.parent.clientHeight,
          0
        )
        commentEl.style.transform = `translate(${commentLocation.x - 20}px,${
          commentLocation.y - 20
        }px)`
      }
    }
  }
}
</script>
<style scoped>
.absolute-pos {
  pointer-events: auto;
  position: absolute;
  top: 0;
  left: 0;
  /* transition: all 0.3s ease; */
  transform-origin: center;
}
.no-mouse-parent {
  pointer-events: none;
}
.no-mouse-parent * {
  pointer-events: auto;
}
</style>
