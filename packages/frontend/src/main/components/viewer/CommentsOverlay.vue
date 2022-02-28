<template>
  <!-- HIC SVNT DRACONES -->
  <div
    ref="parent"
    style="width: 100%; height: 100vh; position: absolute; pointer-events: none; overflow: hidden"
    class="d-flex align-center justify-center no-mouse-parent"
  >
    <div
      v-for="(comment, index) in comments"
      :key="index"
      :ref="`comment-${index}`"
      :class="`absolute-pos rounded-xl caption`"
      :style="`pointer-events: none; z-index:${comment.expanded ? '20' : '10'}`"
    >
      <div class="" style="pointer-events: none">
        <div class="d-flex align-center" style="pointer-events: none">
          <v-btn
            class="rounded-pill"
            small
            @click="comment.expanded ? (comment.expanded = false) : expandComment(comment)"
          >
            <span v-if="!comment.expanded" class="primary--text">
              <v-icon small>mdi-comment</v-icon>
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
              <!-- Management buttons here -->
              <!-- <v-btn x-small><v-icon small>mdi-archive-arrow-down</v-icon></v-btn> -->
            </div>
          </v-slide-x-transition>
        </div>
        <v-scroll-y-transition>
          <v-card
            v-show="comment.expanded"
            :ref="`commentcard-${index}`"
            class="transparent elevation-0 rounded-xl mt-2"
            style="width: 400px; overflow-y: scroll"
          >
            <comment-thread-viewer :comment="comment" />
            <!-- <div class="px-4 py-4">
              <div class="body-2" style="">
                We’ve just returned from Barcelona, where we had our second retreat - being a remote
                company, we try to meet at least twice a year IRL to get some better resolution
                meetings and spend quality time together (like cooking paella while drinking copious
                amounts of cava). Covid took its toll though, and the formula was incomplete: Izzy
                you were missed, but rest assured - we’ll photoshop you in all the pics!
                <br />
                {{ comment.text }}
              </div>
            </div>
            <v-card-actions>
              <v-btn small class="primary rounded-xl">reply</v-btn>
            </v-card-actions> -->
          </v-card>
        </v-scroll-y-transition>
      </div>
    </div>
  </div>
</template>
<script>
import debounce from 'lodash.debounce'
import gql from 'graphql-tag'

export default {
  components: {
    CommentThreadViewer: () => import('@/main/components/comments/CommentThreadViewer')
    // UserAvatar: () => import('@/main/components/common/UserAvatar'),
    // TextDotsTyping: () => import('@/main/components/common/TextDotsTyping')
  },
  apollo: {
    $subscribe: {
      commentCreated: {
        query: gql`
          subscription($streamId: String!, $resourceId: String!) {
            commentCreated(streamId: $streamId, resourceId: $resourceId)
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
          console.log(data.commentCreated)
          data.commentCreated.expanded = false
          this.comments.push(data.commentCreated)
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
    window.__viewer.on(
      'select',
      debounce(
        function () {
          for (let c of this.comments) {
            c.expanded = false
          }
        }.bind(this),
        10
      )
    )
    window.__viewer.cameraHandler.controls.addEventListener('update', () =>
      this.updateCommentBubbles()
    )
  },
  methods: {
    expandComment(comment) {
      for (let c of this.comments) {
        if (c === comment) {
          c.preventAutoClose = true
          setTimeout(() => (c.expanded = true), 100)
          setTimeout(() => (c.preventAutoClose = false), 1000)
        } else {
          c.expanded = false
        }

        if (c === comment) {
          this.setCommentPow(c)
        }
      }
    },
    setCommentPow(comment) {
      let camToSet = comment.data.camPos
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
        if (!commentEl) continue
        let location = new THREE.Vector3(
          comment.data.location.x,
          comment.data.location.y,
          comment.data.location.z
        )
        location.project(cam)
        let commentLocation = new THREE.Vector3(
          (location.x * 0.5 + 0.5) * this.$refs.parent.clientWidth,
          (location.y * -0.5 + 0.5) * this.$refs.parent.clientHeight,
          0
        )
        let tX = commentLocation.x - 20
        let tY = commentLocation.y - 20
        const paddingX = 10
        const paddingYTop = 70
        const paddingYBottom = 80

        if (tX < -300) if (!comment.preventAutoClose) comment.expanded = false // collapse if too far out leftwise
        if (tX < paddingX) {
          tX = paddingX
        }

        if (tX > this.$refs.parent.clientWidth - (paddingX + 50)) {
          tX = this.$refs.parent.clientWidth - (paddingX + 50)
          if (!comment.preventAutoClose) comment.expanded = false // collapse if too far down right
        }
        if (tY < 0 && !comment.preventAutoClose) comment.expanded = false // collapse if too far out topwise
        if (tY < paddingYTop) {
          tY = paddingYTop
        }
        if (tY > this.$refs.parent.clientHeight - paddingYBottom) {
          tY = this.$refs.parent.clientHeight - paddingYBottom
          if (!comment.preventAutoClose) comment.expanded = false // collapse if too far out down
        }
        commentEl.style.transform = `translate(${tX}px,${tY}px)`

        let card = this.$refs[`commentcard-${index}`][0]
        if (card) {
          let ot = tY
          let ph = this.$refs.parent.clientHeight
          let h = ph - ot - paddingYBottom - 40
          if (h < 40 && !comment.preventAutoClose) {
            comment.expanded = false
          }
          card.$el.style.maxHeight = `${h}px`
        }
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
  z-index: 10;
  transform-origin: center;
}
.no-mouse-parent {
  pointer-events: none;
}
.no-mouse-parent * {
  pointer-events: auto;
}
</style>
