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
      v-show="showComments && !viewerState.addingComment"
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
        :id="`comment-${comment.id}`"
        :key="comment.id"
        :ref="`comment-${comment.id}`"
        :class="`comment-bubble absolute-pos rounded-xl no-mouse `"
        :style="` z-index:${comment.expanded ? '20' : '10'}; ${
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
                getLeadingEmoji(comment) && !comment.expanded
                  ? 'emoji-btn transparent elevation-0'
                  : ''
              }
              ${
                (comment.expanded || comment.bouncing || isUnread(comment)) &&
                !commentSlideShow
                  ? 'dark white--text primary'
                  : 'background'
              }`"
              @click="
                comment.expanded ? collapseComment(comment) : expandComment(comment)
              "
            >
              <template v-if="!getLeadingEmoji(comment)">
                <v-icon v-if="!comment.expanded" x-small class="">mdi-comment</v-icon>
              </template>
              <template v-else-if="!comment.expanded">
                <span class="text-h5">
                  {{ getLeadingEmoji(comment) }}
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
          <!-- <v-btn
            v-if="comment.expanded && commentSlideShow"
            small
            icon
            class="pa-0 ma-0 mouse background"
          >
            <v-icon x-small>mdi-arrow-right</v-icon>
          </v-btn> -->
        </div>
      </div>
      <!-- Comment Threads -->
      <div
        v-for="comment in activeComments"
        :id="`commentcard-${comment.id}`"
        :key="comment.id + '-card'"
        :ref="`commentcard-${comment.id}`"
        :class="`comment-thread simple-scrollbar hover-bg absolute-pos rounded-xl overflow-y-auto ${
          comment.hovered && false ? 'background elevation-5' : ''
        }`"
        :style="{
          zIndex: comment.expanded ? 20 : 10,
          opacity: comment.expanded ? '1' : '0',
          visibility: comment.expanded ? 'visible' : 'hidden'
        }"
        @mouseenter="comment.hovered = true"
        @mouseleave="comment.hovered = false"
      >
        <!-- <v-card class="elevation-0 ma-0 transparent" style="height: 100%"> -->
        <v-fade-transition>
          <div class="position:relative">
            <comment-thread-viewer
              :comment="comment"
              @bounce="bounceComment"
              @refresh-layout="onThreadRefreshLayout"
              @close="collapseComment"
              @deleted="handleDeletion"
              @add-resources="(e) => $emit('add-resources', e)"
              @next="nextComment"
              @prev="prevComment"
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
import * as THREE from 'three'
import { debounce, throttle } from 'lodash'
import { gql } from '@apollo/client/core'
import { VIEWER_UPDATE_THROTTLE_TIME } from '@/main/lib/viewer/comments/commentsHelper'
import { buildResizeHandlerMixin } from '@/main/lib/common/web-apis/mixins/windowResizeHandler'
import { documentToBasicString } from '@/main/lib/common/text-editor/documentHelper'
import { COMMENT_FULL_INFO_FRAGMENT } from '@/graphql/comments'
import { useInjectedViewer } from '@/main/lib/viewer/core/composables/viewer'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import {
  resetFilter,
  setFilterDirectly,
  setPreventCommentCollapse,
  setSelectedCommentMetaData,
  useCommitObjectViewerParams
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { useEmbedViewerQuery } from '@/main/lib/viewer/commit-object-viewer/composables/embed'
export default {
  components: {
    CommentThreadViewer: () => import('@/main/components/comments/CommentThreadViewer'),
    CommentsViewerNavbar: () =>
      import('@/main/components/comments/CommentsViewerNavbar')
  },
  mixins: [
    buildResizeHandlerMixin({ shouldThrottle: true, wait: VIEWER_UPDATE_THROTTLE_TIME })
  ],
  apollo: {
    comments: {
      query: gql`
        query ($streamId: String!, $resources: [ResourceIdentifierInput]!) {
          comments(streamId: $streamId, resources: $resources, limit: 1000) {
            totalCount
            cursor
            items {
              ...CommentFullInfo
            }
          }
        }

        ${COMMENT_FULL_INFO_FRAGMENT}
      `,
      fetchPolicy: 'no-cache',
      variables() {
        const resourceArr = [
          {
            resourceType: this.$resourceType(this.resourceId),
            resourceId: this.resourceId
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
          streamId: this.streamId,
          resources: resourceArr
        }
      },
      result({ data }) {
        if (!data) return

        // Only reason why it's OK to mutate apollo results here, is because
        // of the 'no-cache' fetchPolicy, which means that none of the data here is actually
        // mutating the Apollo Cache
        for (const c of data.comments.items) {
          c.expanded = false
          c.hovered = false
          c.bouncing = false
          if (
            this.localComments.findIndex((lc) => c.id === lc.id) === -1 &&
            !c.archived &&
            c.data.location
          ) {
            this.localComments.push({ ...c })
          }
        }
        return data
      },
      subscribeToMore: {
        document: gql`
          subscription ($streamId: String!, $resourceIds: [String]) {
            commentActivity(streamId: $streamId, resourceIds: $resourceIds) {
              type
              comment {
                ...CommentFullInfo
              }
            }
          }
          ${COMMENT_FULL_INFO_FRAGMENT}
        `,
        variables() {
          let resIds = [this.resourceId]
          if (this.$route.query.overlay)
            resIds = [...resIds, ...this.$route.query.overlay.split(',')]
          return {
            streamId: this.streamId,
            resourceIds: resIds
          }
        },
        skip() {
          return !this.$loggedIn()
        },
        updateQuery(_, { subscriptionData }) {
          if (!subscriptionData.data?.commentActivity) return

          const { comment: newComment, type } = subscriptionData.data.commentActivity

          newComment.expanded = false
          newComment.hovered = false
          newComment.bouncing = false

          if (newComment.authorId !== this.$userId())
            newComment.viewedAt = new Date('1987')

          newComment.archived = false

          if (type === 'comment-added') {
            if (this.localComments.find((c) => c.id === newComment.id)) {
              return
            }
            if (!newComment.archived && newComment.data.location)
              this.localComments.push(newComment)

            setTimeout(() => {
              // console.log('updateQuery timeout')
              this.updateCommentBubbles()
              this.bounceComment(newComment.id)
            }, 10)
          }
        }
      }
    }
  },
  setup() {
    const { streamId, resourceId } = useCommitObjectViewerParams()
    const { commentSlideShow } = useEmbedViewerQuery()

    const { viewer } = useInjectedViewer()
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          addingComment
          viewerBusy
          preventCommentCollapse
          emojis
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    return { viewer, viewerState, streamId, resourceId, commentSlideShow }
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
      if (!this.commentSlideShow) return this.localComments.filter((c) => !c.archived)
      else
        return this.localComments
          .filter((c) => !c.archived)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
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
        if (this.viewerState.viewerBusy || this.$apollo.loading) return
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

    this.viewerSelectHandler = debounce(() => {
      // prevents comment collapse if filters are reset (that triggers a deselect event from the viewer)
      if (this.viewerState.preventCommentCollapse) {
        setPreventCommentCollapse(false)
        return
      }
      for (const c of this.localComments) {
        this.collapseComment(c)
      }
    }, 10)
    this.viewer.on('select', this.viewerSelectHandler)

    // Throttling update, cause it happens way too often and triggers expensive DOM updates
    // Smoothing out the animation with CSS transitions (check style)
    this.viewerControlsUpdateHandler = throttle(() => {
      // console.log('cameraHandler.controls update')
      this.updateCommentBubbles()
    }, VIEWER_UPDATE_THROTTLE_TIME)
    this.viewer.cameraHandler.controls.addEventListener(
      'update',
      this.viewerControlsUpdateHandler
    )
    setTimeout(() => {
      // console.log('mounted timeout')
      this.updateCommentBubbles()
    }, 1000)
  },
  beforeDestroy() {
    this.viewer.removeListener('select', this.viewerSelectHandler)
    this.viewer.cameraHandler.controls.removeEventListener(
      'update',
      this.viewerControlsUpdateHandler
    )
    window.clearInterval(this.commentIntervalChecker)
  },
  methods: {
    onThreadRefreshLayout() {
      // console.log('thread refresh layout')
      this.updateCommentBubbles()
    },
    getLeadingEmoji(comment) {
      const emojiWhitelist = this.viewerState.emojis
      const commentPureText = documentToBasicString(comment.text.doc, 1)
      const emojiCandidate = commentPureText.split(' ')[0]
      return emojiWhitelist.includes(emojiCandidate) ? emojiCandidate : null
    },
    onWindowResize() {
      // console.log('on window resize')
      this.updateCommentBubbles()
    },
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
          setSelectedCommentMetaData(c)
          this.setCommentPow(c)
          setTimeout(() => {
            c.expanded = true
            // console.log('expandComment 200 setTimeout')
            this.updateCommentBubbles()
          }, 200)
          setTimeout(() => {
            // prevents auto closing from camera moving to comment pow
            // console.log('expandComment 1000 setTimeout')
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
          if (c.data.filters) resetFilter()
          if (c.data.sectionBox) this.viewer.sectionBox.off()

          setSelectedCommentMetaData(null)
        }
      }
    },
    nextComment(comment) {
      const index = this.activeComments.findIndex((c) => c.id === comment.id)
      let nextComment = null
      if (index === -1) return
      if (index === this.activeComments.length - 1) nextComment = this.activeComments[0]
      else nextComment = this.activeComments[index + 1]
      this.collapseComment(comment)
      this.expandComment(nextComment)
    },
    prevComment(comment) {
      const index = this.activeComments.findIndex((c) => c.id === comment.id)
      let nextComment = null
      if (index === -1) return
      if (index === 0) nextComment = this.activeComments[this.activeComments.length - 1]
      else nextComment = this.activeComments[index - 1]
      this.collapseComment(comment)
      this.expandComment(nextComment)
    },
    setCommentPow(comment) {
      const camToSet = comment.data.camPos
      if (camToSet[6] === 1) {
        this.viewer.toggleCameraProjection()
      }
      this.viewer.interactions.setLookAt(
        { x: camToSet[0], y: camToSet[1], z: camToSet[2] }, // position
        { x: camToSet[3], y: camToSet[4], z: camToSet[5] } // target
      )
      if (camToSet[6] === 1) {
        this.viewer.cameraHandler.activeCam.controls.zoom(camToSet[7], true)
      }
      if (comment.data.filters) {
        setFilterDirectly({
          filter: comment.data.filters
        })
      } else {
        resetFilter()
      }

      if (comment.data.sectionBox) {
        this.viewer.sectionBox.setBox(comment.data.sectionBox, 0)
        this.viewer.sectionBox.on()
      } else {
        this.viewer.sectionBox.off()
      }
    },
    async handleDeletion(comment) {
      this.collapseComment(comment)
      const comm = this.localComments.find((c) => c.id === comment.id)
      comm.archived = true
      this.updateCommentBubbles()
    },
    updateCommentBubbles() {
      // console.log('updateCommentBubbles', new Date().toISOString())
      if (!this.comments) return
      const cam = this.viewer.cameraHandler.camera
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
          cardTop = tY - card.scrollHeight / 2 + 15

          // top clip
          if (cardTop < paddingYTop) cardTop = paddingYTop

          const cardBottom = cardTop + card.clientHeight
          const maxBottom = this.$refs.parent.clientHeight - 45

          // bottom clip
          if (cardBottom > maxBottom) {
            cardTop -= (cardBottom - maxBottom) / 2
            cardTop = this.$refs.parent.clientHeight - card.clientHeight - 45
          }

          if (this.$vuetify.breakpoint.xs && !this.commentSlideShow)
            cardTop = paddingYTop
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
<style scoped lang="scss">
:deep(.emoji-btn) {
  background-color: initial !important;

  .v-btn__content {
    color: initial;
  }
}

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

.comment-bubble,
.comment-thread {
  $timing: 0.1s;
  $visibilityTiming: 0.2s;

  transition: left $timing linear, right $timing linear, top $timing linear,
    bottom $timing linear, opacity $visibilityTiming ease,
    visibility $visibilityTiming ease;
}
</style>
