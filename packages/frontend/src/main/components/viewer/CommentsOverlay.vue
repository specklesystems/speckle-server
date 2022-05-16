<template>
  <!-- 
    HIC SVNT DRACONES
  -->
  <div
    ref="parent"
    style="
      width: 100%;
      height: 100vh;
      position: absolute;
      pointer-events: none;
      overflow: hidden;
    "
    class="d-flex align-center justify-center no-mouse"
  >
    <div
      v-show="showComments && !$store.state.addingComment"
      style="
        width: 100%;
        height: 100vh;
        position: absolute;
        pointer-events: none;
        overflow: hidden;
      "
      class="no-mouse"
    >
      <!-- Comment bubbles -->
      <div
        v-for="comment in activeComments"
        v-show="isVisible(comment)"
        :key="comment.id"
        :ref="`comment-${comment.id}`"
        :class="`absolute-pos rounded-xl no-mouse `"
        :style="`transition: opacity 0.2s ease; z-index:${
          comment.expanded ? '20' : '10'
        }; ${
          hasExpandedComment &&
          !comment.expanded &&
          !comment.hovered &&
          !comment.bouncing
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
                comment.expanded || comment.bouncing || isUnread(comment)
                  ? 'dark white--text primary'
                  : 'background'
              }`"
              @click="
                comment.expanded ? collapseComment(comment) : expandComment(comment)
              "
            >
              <template
                v-if="$store.state.emojis.indexOf(comment.text.split(' ')[0]) == -1"
              >
                <v-icon v-if="!comment.expanded" x-small class="">mdi-comment</v-icon>
              </template>
              <template v-else-if="!comment.expanded">
                <span>
                  {{ comment.text.split(' ')[0] }}
                </span>
              </template>
              <v-icon v-if="comment.expanded" x-small class="">mdi-close</v-icon>
            </v-btn>
            <v-slide-x-transition>
              <div
                v-if="comment.hovered && !comment.expanded"
                style="position: absolute; left: 30px; width: max-content"
                class="rounded-xl primary white--text px-2 ml-1 caption"
              >
                <timeago
                  :datetime="comment.updatedAt"
                  class="font-italic mr-2"
                ></timeago>
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
        v-for="comment in activeComments"
        v-show="isVisible(comment)"
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
              @add-resources="(e) => $emit('add-resources', e)"
            />
          </div>
        </v-fade-transition>
        <!-- </v-card> -->
      </div>
    </div>
    <portal v-if="activeComments.length !== 0" to="comments">
      <comments-viewer-navbar
        :comments="activeComments"
        :filter="commentsFilter"
        @select-comment="
          (e) => {
            if (!e.expanded && !showComments) showComments = true
            e.expanded ? collapseComment(e) : expandComment(e)
          }
        "
        @set-filter="
          (state) => {
            commentsFilter = state
          }
        "
      />
    </portal>
    <portal to="viewercontrols" :order="5">
      <v-btn
        key="comment-toggle-button"
        v-tooltip="currentCommentVisStatus"
        rounded
        icon
        class="mr-2"
        @click="toggleComments()"
      >
        <v-icon v-if="commentsFilter === 'all'" small>mdi-comment-outline</v-icon>
        <v-icon v-if="commentsFilter === 'unread'" small class="primary--text">
          mdi-comment-alert-outline
        </v-icon>
        <v-icon v-if="commentsFilter === 'none'" small>mdi-comment-off-outline</v-icon>
        <!-- {{ commentsFilter }} -->
        <!-- <v-icon v-if="!showComments" small>mdi-comment-off-outline</v-icon> -->
      </v-btn>
    </portal>
  </div>
</template>
<script>
// TODO: Need to fix the viewer package build process to be able to properly reference THREE.js
/* global THREE */
import debounce from 'lodash/debounce'
import gql from 'graphql-tag'

export default {
  components: {
    CommentThreadViewer: () => import('@/main/components/comments/CommentThreadViewer'),
    CommentsViewerNavbar: () =>
      import('@/main/components/comments/CommentsViewerNavbar')
  },
  apollo: {
    comments: {
      query: gql`
        query ($streamId: String!, $resources: [ResourceIdentifierInput]!) {
          comments(streamId: $streamId, resources: $resources, limit: 1000) {
            totalCount
            cursor
            items {
              id
              authorId
              text
              createdAt
              updatedAt
              viewedAt
              archived
              data
              resources {
                resourceId
                resourceType
              }
              replies {
                totalCount
              }
            }
          }
        }
      `,
      fetchPolicy: 'no-cache',
      variables() {
        const resourceArr = [
          {
            resourceType: this.$resourceType(this.$route.params.resourceId),
            resourceId: this.$route.params.resourceId
          }
        ]
        if (this.$route.query.overlay) {
          const resIds = this.$route.query.overlay.split(',')
          for (const resId of resIds)
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
        if (!data) return
        for (const c of data.comments.items) {
          c.expanded = false
          c.hovered = false
          c.bouncing = false
          if (
            this.localComments.findIndex((lc) => c.id === lc.id) === -1 &&
            !c.archived
          ) {
            this.localComments.push({ ...c })
          }
        }
        return data
      },
      subscribeToMore: {
        document: gql`
          subscription ($streamId: String!, $resourceIds: [String]) {
            commentActivity(streamId: $streamId, resourceIds: $resourceIds)
          }
        `,
        variables() {
          let resIds = [this.$route.params.resourceId]
          if (this.$route.query.overlay)
            resIds = [...resIds, ...this.$route.query.overlay.split(',')]
          return {
            streamId: this.$route.params.streamId,
            resourceIds: resIds
          }
        },
        skip() {
          return !this.$loggedIn()
        },
        updateQuery(prevResult, { subscriptionData }) {
          if (
            !subscriptionData ||
            !subscriptionData.data ||
            !subscriptionData.data.commentActivity
          )
            return
          const newComment = subscriptionData.data.commentActivity

          newComment.expanded = false
          newComment.hovered = false
          newComment.bouncing = false

          if (newComment.authorId !== this.$userId())
            newComment.viewedAt = new Date('1987')

          newComment.archived = false

          if (subscriptionData.data.commentActivity.eventType === 'comment-added') {
            if (prevResult.comments.items.find((c) => c.id === newComment.id)) {
              return
            }
            if (!newComment.archived) this.localComments.push(newComment)

            setTimeout(() => {
              this.updateCommentBubbles()
              this.bounceComment(newComment.id)
            }, 10)
          }
        }
      }
    }
  },
  data() {
    return {
      localComments: [],
      showComments: true,
      commentsFilter: 'all', // 'unread', 'none'
      openCommentOnInit: null
    }
  },
  computed: {
    activeComments() {
      return this.localComments.filter((c) => !c.archived)
    },
    hasExpandedComment() {
      return this.localComments.filter((c) => c.expanded).length !== 0
    },
    currentCommentVisStatus() {
      switch (this.commentsFilter) {
        case 'all':
          return 'Showing all comments'
        case 'unread':
          return 'Showing unread comments only'
        case 'none':
          return 'Comments hidden'
      }
      return ''
    }
  },
  mounted() {
    this.localComments = []
    this.$apollo.queries.comments.refetch()
    if (this.$route.query.cId) {
      this.openCommentOnInit = this.$route.query.cId
      this.commentIntervalChecker = window.setInterval(() => {
        if (this.$store.state.viewerBusy || this.$apollo.loading) return
        this.expandComment({ id: this.openCommentOnInit })
        this.openCommentOnInit = null
        const q = { ...this.$route.query }
        delete q.cId
        this.$router.replace({
          path: this.$route.path,
          query: q
        })
        window.clearInterval(this.commentIntervalChecker)
      }, 2000)
    }
    window.__viewer.on(
      'select',
      debounce(
        function () {
          // prevents comment collapse if filters are reset (that triggers a deselect event from the viewer)
          if (this.$store.state.preventCommentCollapse) {
            this.$store.commit('setPreventCommentCollapse', { value: false })
            return
          }
          for (const c of this.localComments) {
            this.collapseComment(c)
          }
        }.bind(this),
        10
      )
    )
    window.__viewer.cameraHandler.controls.addEventListener('update', () =>
      this.updateCommentBubbles()
    )
    setTimeout(() => {
      this.updateCommentBubbles()
    }, 1000)
  },
  methods: {
    isUnread(comment) {
      return new Date(comment.updatedAt) - new Date(comment.viewedAt) > 0
    },
    isVisible(comment) {
      if (comment.expanded) return true
      switch (this.commentsFilter) {
        case 'all':
          return true
        case 'unread':
          return this.isUnread(comment)
        case 'none':
          return false
      }
      return true
    },
    toggleComments() {
      // this.showComments = !this.showComments
      switch (this.commentsFilter) {
        case 'all':
          this.commentsFilter = 'unread'
          break
        case 'unread':
          this.commentsFilter = 'none'
          break
        case 'none':
          this.commentsFilter = 'all'
          break
      }
    },
    expandComment(comment) {
      for (const c of this.localComments) {
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
      for (const c of this.localComments) {
        if (c.id === comment.id && c.expanded) {
          c.expanded = false
          if (c.data.filters) this.$store.commit('resetFilter')
          if (c.data.sectionBox) window.__viewer.sectionBox.off()
          this.$store.commit('setCommentSelection', { comment: null })
        }
      }
    },
    setCommentPow(comment) {
      const camToSet = comment.data.camPos
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
    async handleDeletion(comment) {
      this.collapseComment(comment)
      const comm = this.localComments.find((c) => c.id === comment.id)
      comm.archived = true
      this.updateCommentBubbles()
    },
    updateCommentBubbles() {
      if (!this.comments) return
      const cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      for (const comment of this.localComments) {
        // get html elements
        const commentEl = this.$refs[`comment-${comment.id}`][0]
        const card = this.$refs[`commentcard-${comment.id}`][0]

        if (!commentEl) continue

        const location = new THREE.Vector3(
          comment.data.location.x,
          comment.data.location.y,
          comment.data.location.z
        )

        location.project(cam)

        const commentLocation = new THREE.Vector3(
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
          if (!comment.preventAutoClose && !this.$vuetify.breakpoint.xs)
            comment.expanded = false // collapse if too far out leftwise
        if (tX < paddingX) {
          tX = paddingX
        }

        if (tX > this.$refs.parent.clientWidth - (paddingX + 50)) {
          tX = this.$refs.parent.clientWidth - (paddingX + 50)
          if (!comment.preventAutoClose && !this.$vuetify.breakpoint.xs)
            comment.expanded = false // collapse if too far down right
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

        const maxHeight = this.$refs.parent.clientHeight - paddingYTop - paddingYBottom

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

          const cardBottom = cardTop + card.clientHeight
          const maxBottom = this.$refs.parent.clientHeight - 45

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
      const commentEl = this.$refs[`comment-${id}`][0]
      commentEl.classList.add('tada-once')
      const comment = this.localComments.find((c) => c.id === id)
      comment.bouncing = true
      comment.updatedAt = Date.now()
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
