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
      :class="`absolute-pos rounded-xl`"
      :style="`pointer-events: none; z-index:${comment.expanded ? '20' : '10'}; ${
        hasExpandedComment && !comment.expanded ? 'opacity: 0.1;' : 'opacity: 1;'
      }`"
    >
      <div class="" style="pointer-events: none">
        <div class="d-flex align-center" style="pointer-events: none">
          <v-btn
            small
            icon
            :class="`elevation-5 pa-0 ma-0 ${
              comment.expanded ? 'dark white--text primary' : 'background'
            }`"
            @click="comment.expanded ? (comment.expanded = false) : expandComment(comment)"
          >
            <!-- <span v-if="!comment.expanded" class="primary--text">
              <v-icon small>mdi-comment</v-icon>
              1
            </span> -->
            <v-icon v-if="!comment.expanded" x-small class="">mdi-comment</v-icon>
            <v-icon v-if="comment.expanded" x-small class="">mdi-close</v-icon>
          </v-btn>
          <!-- <span class="caption ml-2" v-if="!comment.expanded">1 replies</span> -->
        </div>
      </div>
    </div>
    <div
      v-for="(comment, index) in comments"
      v-show="comment.expanded"
      :key="index + 'card'"
      :ref="`commentcard-${index}`"
      :class="`hover-bg absolute-pos rounded-xl overflow-y-auto ${
        comment.hovered && false ? 'background elevation-5' : ''
      }`"
      :style="`z-index:${comment.expanded ? '20' : '10'}`"
      @mouseenter="comment.hovered = true"
      @mouseleave="comment.hovered = false"
    >
      <!-- <v-card class="elevation-0 ma-0 transparent" style="height: 100%"> -->
      <comment-thread-viewer :comment="comment" @reply-added="replyAdded" />
      <!-- </v-card> -->
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
          data.commentCreated.hovered = false
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
  computed: {
    hasExpandedComment() {
      return this.comments.filter((c) => c.expanded).length !== 0
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
          setTimeout(() => {
            c.expanded = true
          }, 100)
          setTimeout(() => {
            this.updateCommentBubbles()
          }, 200)
          setTimeout(() => {
            c.preventAutoClose = false
            // this.updateCommentBubbles()
          }, 1000)
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
      // TODO: apply filters, section box, etc.
    },
    replyAdded() {
      this.updateCommentBubbles()
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
        const paddingYBottom = 90

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
        let maxHeight = this.$refs.parent.clientHeight - paddingYTop - paddingYBottom

        card.style.maxHeight = `${maxHeight}px`
        card.style.left = `${tX + 40}px`

        let cardTop = paddingYTop

        if (card.scrollHeight > maxHeight) {
          card.style.top = `${cardTop}px`
        } else {
          cardTop = tY - card.scrollHeight / 2

          // top clip
          if (cardTop < paddingYTop) cardTop = paddingYTop

          let cardBottom = cardTop + card.clientHeight
          let maxBottom = this.$refs.parent.clientHeight - 45

          // bottom clip
          if (cardBottom > maxBottom) {
            cardTop -= (cardBottom - maxBottom) / 2
            cardTop = this.$refs.parent.clientHeight - card.clientHeight - 45
          }

          card.style.top = `${cardTop}px`
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
.fixed-pos {
  pointer-events: auto;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
}
.no-mouse-parent {
  pointer-events: none;
}
.no-mouse-parent * {
  pointer-events: auto;
}

.hover-bg {
  transition: background 0.3s ease;
}
</style>
