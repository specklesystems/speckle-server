<template>
  <!-- 
    HIC SVNT DRACONES
  -->
  <div
    ref="parent"
    style="width: 100%; height: 100vh; position: absolute; pointer-events: none; overflow: hidden"
    class="d-flex align-center justify-center no-mouse"
  >
    <div
      v-show="showComments && !$store.state.addingComment"
      style="width: 100%; height: 100vh; position: absolute; pointer-events: none; overflow: hidden"
      class="no-mouse"
    >
      <!-- Comment bubbles -->
      <div
        v-for="comment in localComments"
        :key="comment.id"
        :ref="`comment-${comment.id}`"
        :class="`absolute-pos rounded-xl no-mouse`"
        :style="`transition: opacity 0.2s ease; z-index:${comment.expanded ? '20' : '10'}; ${
          hasExpandedComment && !comment.expanded && !comment.hovered && !comment.bouncing
            ? 'opacity: 0.1;'
            : 'opacity: 1;'
        }`"
        @mouseenter="comment.hovered = true"
        @mouseleave="comment.hovered = false"
      >
        <div class="" style="pointer-events: none">
          <div class="d-flex align-center" style="pointer-events: none">
            <v-btn
              v-show="!($vuetify.breakpoint.xs && comment.expanded)"
              :ref="`comment-button-${comment.id}`"
              small
              icon
              :class="`elevation-5 pa-0 ma-0 mouse ${
                comment.expanded || comment.bouncing ? 'dark white--text primary' : 'background'
              }`"
              @click="comment.expanded ? collapseComment(comment) : expandComment(comment)"
            >
              <v-icon v-if="!comment.expanded" x-small class="">mdi-comment</v-icon>
              <v-icon v-if="comment.expanded" x-small class="">mdi-close</v-icon>
            </v-btn>
            <v-slide-x-transition>
              <div
                v-if="comment.hovered && !comment.expanded"
                style="position: absolute; left: 30px; width: max-content"
                class="rounded-xl primary white--text px-2 ml-1 caption"
              >
                <timeago :datetime="comment.updatedAt" class="font-italic mr-2"></timeago>
                <v-icon x-small class="white--text">mdi-comment-outline</v-icon>
                {{ comment.replies.totalCount + 1 }}
                <v-icon v-if="comment.data.filters" x-small class="white--text">
                  mdi-filter-variant
                </v-icon>
                <v-icon v-if="comment.data.sectionBox" x-small class="white--text">
                  mdi-scissors-cutting
                </v-icon>
              </div>
            </v-slide-x-transition>
          </div>
        </div>
      </div>
      <!-- Comment Threads -->
      <div
        v-for="comment in localComments"
        :key="comment.id + '-card'"
        :ref="`commentcard-${comment.id}`"
        :class="`hover-bg absolute-pos rounded-xl overflow-y-auto ${
          comment.hovered && false ? 'background elevation-5' : ''
        }`"
        :style="`z-index:${comment.expanded ? '20' : '10'};`"
        @mouseenter="comment.hovered = true"
        @mouseleave="comment.hovered = false"
      >
        <!-- <v-card class="elevation-0 ma-0 transparent" style="height: 100%"> -->
        <v-fade-transition>
          <div v-show="comment.expanded">
            <comment-thread-viewer
              :comment="comment"
              @bounce="bounceComment"
              @refresh-layout="updateCommentBubbles()"
              @close="collapseComment"
              @deleted="handleDeletion"
            />
          </div>
        </v-fade-transition>
        <!-- </v-card> -->
      </div>
    </div>
    <portal to="viewercontrols" :order="5">
      <v-btn
        key="comment-toggle-button"
        v-tooltip="`Toggle comments (${localComments.length})`"
        rounded
        icon
        class="mr-2"
        @click="toggleComments()"
      >
        <v-icon v-if="showComments" small>mdi-comment-outline</v-icon>
        <v-icon v-if="!showComments" small>mdi-comment-off-outline</v-icon>
      </v-btn>
    </portal>
  </div>
</template>
<script>
import debounce from 'lodash.debounce'
import gql from 'graphql-tag'

export default {
  components: {
    CommentThreadViewer: () => import('@/main/components/comments/CommentThreadViewer')
  },
  apollo: {
    comments: {
      query: gql`
        query($streamId: String!, $resources: [ResourceIdentifierInput]!) {
          comments(streamId: $streamId, resources: $resources, limit: 1000) {
            totalCount
            cursor
            items {
              id
              authorId
              text
              createdAt
              updatedAt
              data
              replies {
                totalCount
              }
            }
          }
        }
      `,
      variables() {
        let resourceArr = [
          {
            resourceType: this.$resourceType(this.$route.params.resourceId),
            resourceId: this.$route.params.resourceId
          }
        ]
        if (this.$route.query.overlay) {
          let resIds = this.$route.query.overlay.split(',')
          for (let resId of resIds)
            resourceArr.push({
              resourceType: this.$resourceType(resId),
              resourceId: resId
            })
        }

        return {
          streamId: this.$route.params.streamId,
          resources: resourceArr
        }
      },
      result({ data }) {
        for (let c of data.comments.items) {
          c.expanded = false
          c.hovered = false
          c.bouncing = false
          if (this.localComments.findIndex((lc) => c.id === lc.id) === -1)
            this.localComments.push({ ...c })
        }
      }
    },
    $subscribe: {
      commentActivity: {
        query: gql`
          subscription($streamId: String!, $resourceId: String!) {
            commentActivity(streamId: $streamId, resourceId: $resourceId)
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
          if (!data.commentActivity) return
          // Creation
          if (data.commentActivity.eventType === 'comment-added') {
            data.commentActivity.expanded = false
            data.commentActivity.hovered = false
            data.commentActivity.bouncing = false
            this.localComments.push(data.commentActivity)
            setTimeout(() => {
              this.updateCommentBubbles()
              this.bounceComment(data.commentActivity.id)
            }, 10)
          }
        }
      }
    }
  },
  data() {
    return {
      localComments: [],
      showComments: true
    }
  },
  computed: {
    hasExpandedComment() {
      return this.localComments.filter((c) => c.expanded).length !== 0
    },
    flatComments() {
      return this.comments ? this.localComments : []
    }
  },
  mounted() {
    window.__viewer.on(
      'select',
      debounce(
        function () {
          // prevents comment collapse if filters are reset (that triggers a deselect event from the viewer)
          if (this.$store.state.preventCommentCollapse) {
            this.$store.commit('setPreventCommentCollapse', { value: false })
            return
          }
          for (let c of this.localComments) {
            this.collapseComment(c)
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
    toggleComments() {
      this.showComments = !this.showComments
    },
    expandComment(comment) {
      for (let c of this.localComments) {
        if (c.id === comment.id) {
          c.preventAutoClose = true
          this.$store.commit('setCommentSelection', { comment: c })
          this.setCommentPow(c)
          setTimeout(() => {
            c.expanded = true
            this.updateCommentBubbles()
          }, 200)
          setTimeout(() => {
            // prevents auto closing from camera moving to comment pow
            c.preventAutoClose = false
            this.updateCommentBubbles()
          }, 1000)
        } else {
          c.expanded = false
        }
      }
    },
    collapseComment(comment) {
      for (let c of this.localComments) {
        if (c.id === comment.id && c.expanded) {
          c.expanded = false
          if (c.data.filters) this.$store.commit('resetFilter')
          if (c.data.sectionBox) window.__viewer.sectionBox.off()
          this.$store.commit('setCommentSelection', { comment: null })
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
      if (comment.data.filters) {
        this.$store.commit('setFilterDirect', { filter: comment.data.filters })
      } else {
        this.$store.commit('resetFilter')
      }

      if (comment.data.sectionBox) {
        window.__viewer.sectionBox.setBox(comment.data.sectionBox, 0)
        window.__viewer.sectionBox.on()
      } else {
        window.__viewer.sectionBox.off()
      }
    },
    handleDeletion(comment) {
      this.collapseComment(comment)
      this.localComments = this.localComments.filter((c) => c.id !== comment.id)
    },
    updateCommentBubbles() {
      if (!this.comments) return
      let cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      for (let comment of this.localComments) {
        // get html elements
        let commentEl = this.$refs[`comment-${comment.id}`][0]
        let card = this.$refs[`commentcard-${comment.id}`][0]

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

        if (tX < -300)
          if (!comment.preventAutoClose && !this.$vuetify.breakpoint.xs) comment.expanded = false // collapse if too far out leftwise
        if (tX < paddingX) {
          tX = paddingX
        }

        if (tX > this.$refs.parent.clientWidth - (paddingX + 50)) {
          tX = this.$refs.parent.clientWidth - (paddingX + 50)
          if (!comment.preventAutoClose && !this.$vuetify.breakpoint.xs) comment.expanded = false // collapse if too far down right
        }
        if (tY < 0 && !comment.preventAutoClose && !this.$vuetify.breakpoint.xs)
          comment.expanded = false // collapse if too far out topwise
        if (tY < paddingYTop) {
          tY = paddingYTop
        }

        if (
          !comment.preventAutoClose &&
          tY > this.$refs.parent.clientHeight &&
          !this.$vuetify.breakpoint.xs
        )
          comment.expanded = false // collapse if too far out down

        if (tY > this.$refs.parent.clientHeight - paddingYBottom) {
          tY = this.$refs.parent.clientHeight - paddingYBottom
        }

        commentEl.style.top = `${tY}px`
        commentEl.style.left = `${tX}px`

        let maxHeight = this.$refs.parent.clientHeight - paddingYTop - paddingYBottom

        card.style.maxHeight = `${maxHeight}px`

        if (tX > this.$refs.parent.clientWidth - (paddingX + 50 + card.scrollWidth)) {
          tX = this.$refs.parent.clientWidth - (paddingX + 50 + card.scrollWidth)
        }
        card.style.left = `${tX + 40}px`
        // card.style.right = '0px'

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

          if (this.$vuetify.breakpoint.xs) cardTop = paddingYTop
          card.style.top = `${cardTop}px`
        }
      }
    },
    bounceComment(id) {
      let commentEl = this.$refs[`comment-${id}`][0]
      commentEl.classList.add('tada-once')
      let comment = this.localComments.find((c) => c.id === id)
      comment.bouncing = true
      setTimeout(() => {
        commentEl.classList.remove('tada-once')
        comment.bouncing = false
      }, 2000)
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
.no-mouse {
  pointer-events: none;
}
.mouse {
  pointer-events: auto;
}
</style>
