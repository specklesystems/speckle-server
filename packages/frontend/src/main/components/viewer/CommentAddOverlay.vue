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
    class="comment-add-overlay no-mouse"
  >
    <v-slide-x-transition>
      <div
        v-show="visible && !$store.state.selectedComment"
        ref="commentButton"
        class="new-comment-overlay absolute-pos"
      >
        <div class="d-flex">
          <v-btn
            v-tooltip="!expand ? 'Add a comment (ctrl + shift + c)' : 'Cancel'"
            small
            icon
            :dark="!expand"
            :class="`mouse elevation-5 ${!expand ? 'primary' : 'background'} mr-2`"
            :loading="loading"
            @click="toggleExpand()"
          >
            <v-icon v-if="!expand" dark small>mdi-message</v-icon>
            <v-icon v-else dark x-small>mdi-close</v-icon>
          </v-btn>
          <v-slide-x-transition>
            <div
              v-if="expand && !$vuetify.breakpoint.xs"
              style="width: 100%; top: -10px; position: relative"
              class=""
            >
              <div v-if="$loggedIn() && canComment" class="d-flex mouse">
                <comment-editor
                  ref="desktopEditor"
                  v-model="commentValue"
                  :stream-id="$route.params.streamId"
                  adding-comment
                  style="width: 300px"
                  max-height="300px"
                  :disabled="isSubmitDisabled"
                  @attachments-processing="anyAttachmentsProcessing = $event"
                  @submit="addComment()"
                />
              </div>
              <div
                v-if="$loggedIn() && canComment"
                class="d-flex mt-2 mouse justify-end"
              >
                <v-fade-transition group>
                  <template v-if="isCommentEmpty">
                    <template v-for="reaction in $store.state.commentReactions">
                      <v-btn
                        :key="reaction"
                        class="mr-2"
                        fab
                        small
                        @click="addCommentDirect(reaction)"
                      >
                        <span
                          class="text-h5"
                          style="position: relative; top: 1px; left: -1px"
                        >
                          {{ reaction }}
                        </span>
                      </v-btn>
                    </template>
                  </template>
                </v-fade-transition>
                <v-btn
                  v-tooltip="'Add attachments'"
                  :disabled="loading"
                  fab
                  small
                  class="mx-2 elevation-10"
                  @click="addAttachments()"
                >
                  <v-icon v-if="$vuetify.breakpoint.smAndDown" small>mdi-camera</v-icon>
                  <v-icon v-else small>mdi-paperclip</v-icon>
                </v-btn>
                <v-btn
                  v-tooltip="'Send comment (press enter)'"
                  :disabled="loading"
                  icon
                  dark
                  fab
                  small
                  class="primary mr-2 elevation-10"
                  @click="addComment()"
                >
                  <v-icon dark small>mdi-send</v-icon>
                </v-btn>
              </div>
              <div
                v-if="!canComment && $loggedIn()"
                class="caption background px-4 py-2 rounded-xl elevation-2"
              >
                You do not have sufficient permissions to add a comment to this stream.
              </div>
              <v-btn
                v-if="!$loggedIn()"
                block
                depressed
                color="primary"
                class="rounded-xl mouse mt-2"
                to="/authn/login"
              >
                <v-icon small class="mr-1">mdi-account</v-icon>
                Sign in to comment
              </v-btn>
            </div>
          </v-slide-x-transition>
        </div>

        <v-dialog
          v-if="$vuetify.breakpoint.xs"
          v-model="expand"
          content-class="elevation-0 flat px-2"
          @click:outside="toggleExpand()"
        >
          <div
            v-if="!canComment && $loggedIn()"
            class="caption background px-4 py-2 rounded-xl elevation-2"
          >
            You do not have sufficient permissions to add a comment to this stream.
          </div>
          <div
            v-if="$loggedIn() && canComment"
            class="d-flex justify-center"
            style="position: relative"
          >
            <comment-editor
              ref="mobileEditor"
              v-model="commentValue"
              :stream-id="$route.params.streamId"
              adding-comment
              style="width: 100%"
              max-height="60vh"
              :disabled="isSubmitDisabled"
              @submit="addComment()"
              @attachments-processing="anyAttachmentsProcessing = $event"
            />
          </div>
          <div
            v-if="$loggedIn() && canComment"
            class="my-2 d-flex justify-end"
            style="position: relative"
          >
            <v-btn
              v-if="!$loggedIn()"
              block
              depressed
              color="primary"
              class="rounded-xl"
              to="/authn/login"
            >
              <v-icon small class="mr-1">mdi-account</v-icon>
              Sign in to comment
            </v-btn>
            <v-fade-transition group>
              <template v-if="isCommentEmpty">
                <template v-for="reaction in $store.state.commentReactions">
                  <v-btn
                    :key="reaction"
                    class="mr-2 elevation-4"
                    fab
                    small
                    @click="addCommentDirect(reaction)"
                  >
                    <span class="text-h5">
                      {{ reaction }}
                    </span>
                  </v-btn>
                </template>
              </template>
            </v-fade-transition>
            <v-btn
              v-tooltip="'Add attachments'"
              :disabled="loading"
              fab
              small
              class="mx-2 elevation-4"
              @click="addAttachments()"
            >
              <v-icon v-if="$vuetify.breakpoint.smAndDown" small>mdi-camera</v-icon>
              <v-icon v-else small>mdi-paperclip</v-icon>
            </v-btn>
            <v-btn
              v-tooltip="'Send comment (press enter)'"
              :disabled="loading"
              icon
              dark
              fab
              small
              class="primary elevation-4"
              @click="addComment()"
            >
              <v-icon dark small>mdi-send</v-icon>
            </v-btn>
          </div>
        </v-dialog>
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
import * as THREE from 'three'
import { gql } from '@apollo/client/core'
import { debounce, throttle } from 'lodash'
import { getCamArray } from './viewerFrontendHelpers'
import CommentEditor from '@/main/components/comments/CommentEditor.vue'
import {
  basicStringToDocument,
  isDocEmpty
} from '@/main/lib/common/text-editor/documentHelper'
import {
  VIEWER_UPDATE_THROTTLE_TIME,
  SMART_EDITOR_SCHEMA
} from '@/main/lib/viewer/comments/commentsHelper'
import { buildResizeHandlerMixin } from '@/main/lib/common/web-apis/mixins/windowResizeHandler'
import { isSuccessfullyUploaded } from '@/main/lib/common/file-upload/fileUploadHelper'

/**
 * TODO: Would be nice to get rid of duplicate templates for mobile & large screens
 */

export default {
  components: { CommentEditor },
  mixins: [
    buildResizeHandlerMixin({ shouldThrottle: true, wait: VIEWER_UPDATE_THROTTLE_TIME })
  ],
  apollo: {
    user: {
      query: gql`
        query {
          user {
            name
            id
          }
        }
      `,
      skip() {
        return !this.$loggedIn()
      }
    },
    stream: {
      query: gql`
        query ($streamId: String!) {
          stream(id: $streamId) {
            id
            role
            allowPublicComments
          }
        }
      `,
      variables() {
        return { streamId: this.$route.params.streamId }
      }
    }
  },
  data() {
    return {
      location: null,
      expand: false,
      visible: true,
      loading: false,
      commentValue: { doc: null, attachments: [] },
      editorSchemaOptions: SMART_EDITOR_SCHEMA,
      anyAttachmentsProcessing: false
    }
  },
  computed: {
    canComment() {
      return !!this.stream?.role || this.stream?.allowPublicComments
    },
    isCommentEmpty() {
      return isDocEmpty(this.commentValue.doc) && !this.commentValue.attachments.length
    },
    isSubmitDisabled() {
      return this.loading || this.anyAttachmentsProcessing
    }
  },
  mounted() {
    this.viewerSelectHandler = debounce(this.handleSelect, 10)
    window.__viewer.on('select', this.viewerSelectHandler)

    // Throttling update, cause it happens way too often and triggers expensive DOM updates
    // Smoothing out the animation with CSS transitions (check style)
    this.viewerControlsUpdateHandler = throttle(() => {
      this.updateCommentBubble()
    }, VIEWER_UPDATE_THROTTLE_TIME)
    window.__viewer.cameraHandler.controls.addEventListener(
      'update',
      this.viewerControlsUpdateHandler
    )

    this.docKeyUpHandler = (e) => {
      if (e.shiftKey && e.ctrlKey && e.keyCode === 67) this.toggleExpand()
    }
    document.addEventListener('keyup', this.docKeyUpHandler)
  },
  beforeDestroy() {
    window.__viewer.removeListener('select', this.viewerSelectHandler)
    window.__viewer.cameraHandler.controls.removeEventListener(
      'update',
      this.viewerControlsUpdateHandler
    )
    document.removeEventListener('keyup', this.docKeyUpHandler)
  },
  methods: {
    onWindowResize() {
      this.updateCommentBubble()
    },
    async addCommentDirect(emoji) {
      this.commentValue.doc = basicStringToDocument(emoji, this.editorSchemaOptions)
      await this.addComment()
    },
    addAttachments() {
      const editor = this.$refs.desktopEditor || this.$refs.mobileEditor
      editor.addAttachments()
    },
    async addComment() {
      if (this.loading) return
      if (this.isCommentEmpty) {
        this.$eventHub.$emit('notification', {
          text: `Comment cannot be empty.`
        })
        return
      }

      this.$mixpanel.track('Comment Action', { type: 'action', name: 'create' })

      const camTarget = window.__viewer.cameraHandler.activeCam.controls.getTarget()

      const blobIds = this.commentValue.attachments
        .filter(isSuccessfullyUploaded)
        .map((a) => a.result.blobId)
      const commentInput = {
        streamId: this.$route.params.streamId,
        resources: [
          {
            resourceType: this.$route.path.includes('object') ? 'object' : 'commit',
            resourceId: this.$route.params.resourceId
          }
        ],
        text: this.commentValue.doc,
        blobIds,
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

      let success = false
      this.loading = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: gql`
            mutation commentCreate($input: CommentCreateInput!) {
              commentCreate(input: $input)
            }
          `,
          variables: { input: commentInput }
        })
        success = !!data.commentCreate
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
      }

      // On success, mark uploads as in use, to prevent cleanup
      if (success) {
        this.commentValue.attachments.forEach((a) => {
          a.inUse = true
        })
      }

      this.loading = false
      this.expand = false
      this.visible = false
      this.commentValue = { doc: null, attachments: [] }
      this.$store.commit('setAddingCommentState', { addingCommentState: false })
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

      this.$store.commit('setAddingCommentState', { addingCommentState: this.expand })
    },
    handleSelect(info) {
      this.expand = false
      if (!info.location) {
        // TODO: deselect event
        this.visible = false
        this.location = null
        this.$store.commit('setAddingCommentState', { addingCommentState: false })
        return
      }

      if (!this.$refs.commentButton) return
      this.visible = true

      const projectedLocation = new THREE.Vector3(
        info.location.x,
        info.location.y,
        info.location.z
      )
      this.location = new THREE.Vector3(
        info.location.x,
        info.location.y,
        info.location.z
      )

      const cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      projectedLocation.project(cam)
      let collapsedSize = this.$refs.commentButton.clientWidth
      collapsedSize = 36
      const mappedLocation = new THREE.Vector3(
        (projectedLocation.x * 0.5 + 0.5) * this.$refs.parent.clientWidth -
          collapsedSize / 2,
        (projectedLocation.y * -0.5 + 0.5) * this.$refs.parent.clientHeight -
          collapsedSize / 1,
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
      const cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      const projectedLocation = this.location.clone()
      projectedLocation.project(cam)
      let collapsedSize = this.$refs.commentButton.clientWidth
      collapsedSize = 36
      const mappedLocation = new THREE.Vector3(
        (projectedLocation.x * 0.5 + 0.5) * this.$refs.parent.clientWidth -
          collapsedSize / 2,
        (projectedLocation.y * -0.5 + 0.5) * this.$refs.parent.clientHeight -
          collapsedSize / 1,
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
<style scoped lang="scss">
:deep(.v-dialog) {
  box-shadow: none;
  overflow-y: hidden;
  overflow-x: hidden;
}
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

.new-comment-overlay {
  $timing: 0.1s;
  transition: left $timing linear, right $timing linear, top $timing linear,
    bottom $timing linear;
}
</style>
