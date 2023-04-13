<template>
  <div
    ref="parent"
    :style="`width: 100%; height: 100vh; position: absolute; pointer-events: none; overflow: hidden; opacity: ${
      viewerState.selectedCommentMetaData || viewerState.addingComment ? '0.2' : '1'
    };`"
  >
    <div v-show="showBubbles">
      <!-- User click point -->
      <div
        v-for="user in users"
        :ref="`user-target-${user.uuid}`"
        :key="user.uuid + 'target'"
        :class="`absolute-pos rounded-pill primary`"
        :style="` opacity: ${
          user.hidden ? '0.2' : 1
        }; transform-origin:center; width: 10px; height:10px; pointer-events:none`"
      ></div>
      <!-- User pointed arrow circle -->
      <div
        v-for="user in users"
        :ref="`user-arrow-${user.uuid}`"
        :key="user.uuid + 'arrow'"
        :class="`absolute-pos d-flex align-center justify-center`"
        :style="`opacity: ${
          user.hidden ? '0.2' : 1
        }; pointer-events:none; transform-origin:center; width: 32px; height:32px; transform: rotateY(0) rotate(90deg)`"
      >
        <!-- <v-icon class="primary--text" style="position: relative; right: -90%">mdi-arrow-right</v-icon> -->
        <!-- <v-icon class="primary--text" style="position: relative; right: -90%">mdi-pan-right</v-icon> -->
        <v-icon
          class="primary--text"
          large
          :style="`opacity: ${
            user.hidden ? '0.2' : 1
          }; position: relative; right: -60%; font-size: 4.2em`"
        >
          mdi-menu-right
        </v-icon>
      </div>
      <!-- User avatar -->
      <div
        v-for="sessionUser in users"
        :ref="`user-bubble-${sessionUser.uuid}`"
        :key="sessionUser.uuid"
        :class="`${
          sessionUser.name === 'Anonymous Viewer' ? 'background' : ''
        } absolute-pos rounded-pill user-bubble elevation-5`"
        :style="`opacity: ${
          sessionUser.hidden ? '0.2' : 1
        }; border: 4px solid #047EFB;`"
      >
        <div @click="setUserPow(sessionUser)">
          <user-avatar
            v-if="sessionUser.name !== 'Anonymous Viewer'"
            :id="sessionUser.id"
            v-tooltip="sessionUser.name"
            :show-hover="false"
            :size="30"
            :margin="false"
          ></user-avatar>
          <v-avatar
            v-else
            v-tooltip="sessionUser.name"
            color="background"
            :size="30"
            style="cursor: pointer"
          >
            👀
          </v-avatar>
          <text-dots-typing v-if="sessionUser.status === 'writing'" />
        </div>
      </div>
    </div>
    <portal to="viewercontrols" :order="4">
      <v-btn
        v-show="users.length !== 0"
        v-tooltip="`Toggle real time user bubbles`"
        small
        rounded
        icon
        class="mr-2"
        @click="showBubbles = !showBubbles"
      >
        <v-icon v-if="showBubbles" small>mdi-account</v-icon>
        <v-icon v-else small>mdi-account-off</v-icon>
      </v-btn>
    </portal>
  </div>
</template>
<script>
import * as THREE from 'three'
import { gql } from '@apollo/client/core'
import { v4 as uuid } from 'uuid'
import debounce from 'lodash/debounce'
import { useInjectedViewer } from '@/main/lib/viewer/core/composables/viewer'
import { useIsLoggedIn } from '@/main/lib/core/composables/core'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import {
  resetFilter,
  setFilterDirectly,
  useCommitObjectViewerParams,
  getLocalFilterState,
  setSectionBox,
  sectionBoxOn,
  sectionBoxOff,
  highlightObjects
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { ViewerEvent } from '@speckle/viewer'

export default {
  name: 'ViewerBubbles',
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    TextDotsTyping: () => import('@/main/components/common/TextDotsTyping')
  },
  apollo: {
    user: {
      query: gql`
        query {
          activeUser {
            id
            name
          }
        }
      `,
      update: (data) => data.activeUser,
      skip() {
        return !this.isLoggedIn
      }
    },
    $subscribe: {
      userViewerActivity: {
        query: gql`
          subscription ($streamId: String!, $resourceId: String!) {
            userViewerActivity(streamId: $streamId, resourceId: $resourceId)
          }
        `,
        variables() {
          return {
            streamId: this.streamId,
            resourceId: this.resourceId
          }
        },
        skip() {
          return !this.resourceId || !this.isLoggedIn
        },
        result(res) {
          const data = res.data
          // Note: swap user id checks for .userId (vs. uuid) if wanting to not allow same user two diff browsers
          // it's easier to test like this though :)
          if (!data.userViewerActivity) return
          if (
            data.userViewerActivity.status &&
            data.userViewerActivity.status === 'disconnect'
          ) {
            this.users = this.users.filter(
              (u) => u.uuid !== data.userViewerActivity.uuid
            )
            this.updateBubbles(true)
            return
          }
          if (data.userViewerActivity.uuid === this.uuid) return
          const indx = this.users.findIndex(
            (u) => u.uuid === data.userViewerActivity.uuid
          )
          if (indx !== -1) {
            const user = this.users[indx]
            user.hidden = false
            user.status = 'viewing'
            user.camera = data.userViewerActivity.camera
            user.status = data.userViewerActivity.status
            user.filter = data.userViewerActivity.filter
            user.selectionLocation = data.userViewerActivity.selectionLocation
            user.selection = data.userViewerActivity.selection
            user.selectionCenter = data.userViewerActivity.selectionCenter
            user.sectionBox = data.userViewerActivity.sectionBox
            user.name = data.userViewerActivity.name
            user.lastUpdate = Date.now()
            // if (Math.random() < 0.5) user.status = 'writing'
            // else user.status = 'viewing'
          } else {
            this.users.push({
              projectedPos: [0, 0],
              hidden: false,
              id: data.userViewerActivity.userId,
              lastUpdate: Date.now(),
              clipped: false,
              ...data.userViewerActivity
            })
          }
          this.updateBubbles(true)
        }
      }
    }
  },
  setup() {
    const { streamId, resourceId } = useCommitObjectViewerParams()
    const { viewer } = useInjectedViewer()
    const { isLoggedIn } = useIsLoggedIn()
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          selectedCommentMetaData {
            id
            selectionLocation
          }
          addingComment
          selectedObjects
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    return { viewer, viewerState, streamId, resourceId, isLoggedIn }
  },
  data() {
    const ownActivityUpdateInterval = 60 * 1000
    return {
      uuid: uuid(),
      selectedIds: [],
      selectionLocation: null,
      selectionCenter: null,
      users: [],
      showBubbles: true,
      otherUsersSelectedObjects: [],
      // How often we send out an "activity" message even if user hasn't made any clicks (just to keep him active)
      ownActivityUpdateInterval,
      // How often we check for user staleness
      userUpdateInterval: 2000,
      // How much time must pass after an update from user after which we consider them "stale" or "disconnected"
      userStaleAfterPeriod: 2 * ownActivityUpdateInterval
    }
  },
  watch: {
    showBubbles(newVal) {
      if (!newVal) highlightObjects([])
    }
  },
  mounted() {
    // for some reasons, these are not clearly initialised
    this.users = []
    this.selectedIds = []
    this.selectionCenter = null
    this.selectionLocation = null

    if (!window.__bubblesId) window.__bubblesId = uuid()
    this.uuid = window.__bubblesId

    this.raycaster = new THREE.Raycaster()
    this.viewer.cameraHandler.controls.addEventListener('update', () =>
      this.updateBubbles(false)
    )

    this.updateInterval = window.setInterval(
      this.sendUpdateAndPrune,
      this.ownActivityUpdateInterval
    )
    this.pruneInterval = window.setInterval(
      this.pruneStaleUsers,
      this.userUpdateInterval
    )

    window.addEventListener('beforeunload', async () => {
      await this.safelyDisconnect()
    })

    this.viewer.on(
      ViewerEvent.ObjectDoubleClicked,
      debounce((selectionInfo) => {
        this.sendSelectionUpdate(selectionInfo)
      }, 50)
    )
    this.viewer.on(
      ViewerEvent.ObjectClicked,
      debounce((selectionInfo) => {
        this.sendSelectionUpdate(selectionInfo)
      }, 50)
    )
  },
  async beforeDestroy() {
    await this.safelyDisconnect()
  },
  methods: {
    async safelyDisconnect() {
      // clear all intervals
      window.clearInterval(this.updateInterval)
      window.clearInterval(this.pruneInterval)

      // send out disconnect msg
      await this.sendDisconnect()
    },
    sendSelectionUpdate(selectionInfo) {
      if (!selectionInfo) {
        this.sendUpdateAndPrune()
        return
      }

      const firstHit = selectionInfo?.hits[0]
      this.selectedIds = firstHit.object.id
      this.selectionLocation = firstHit.point
      this.selectionCenter = firstHit.point
      this.sendUpdateAndPrune()
    },
    setUserPow(user) {
      const camToSet = user.camera
      if (camToSet[6] === 1) {
        this.viewer.toggleCameraProjection()
      }

      this.viewer.setView({
        position: new THREE.Vector3(camToSet[0], camToSet[1], camToSet[2]),
        target: new THREE.Vector3(camToSet[3], camToSet[4], camToSet[5])
      })
      // NOTE: disabled as parallel projection cam is not enabled anymore, see other comments
      // if (camToSet[6] === 1) {
      //   this.viewer.cameraHandler.activeCam.controls.zoom(camToSet[7], true)
      // }

      if (user.filter) setFilterDirectly({ filter: user.filter })
      else resetFilter()

      if (user.sectionBox) {
        setSectionBox(user.sectionBox, 0)
        sectionBoxOn()
      } else {
        sectionBoxOff()
      }
      this.$mixpanel.track('Bubbles Action', { type: 'action', name: 'avatar-click' })
    },
    /**
     * Hide stale users that haven't reported activity for a while
     */
    pruneStaleUsers() {
      const stalenessLimit = this.userStaleAfterPeriod
      if (!this.users?.length) return

      // Hide if stale
      for (const user of this.users) {
        const delta = Math.abs(Date.now() - user.lastUpdate)
        if (delta > stalenessLimit) {
          user.hidden = true
          user.status = 'stale'
        }
        if (delta < stalenessLimit) {
          user.hidden = false
          user.status = ''
        }
      }

      // Remove altogether if stale for a while
      this.users = this.users.filter(
        (u) => Date.now() - u.lastUpdate < stalenessLimit * 2
      )
    },
    /**
     * Send out user activity broadcast
     */
    async sendUpdateAndPrune() {
      this.pruneStaleUsers()
      if (!this.resourceId || !this.isLoggedIn) return

      const controls = this.viewer.cameraHandler.activeCam.controls
      const pos = controls.getPosition()
      const target = controls.getTarget()
      const c = [
        parseFloat(pos.x.toFixed(5)),
        parseFloat(pos.y.toFixed(5)),
        parseFloat(pos.z.toFixed(5)),
        parseFloat(target.x.toFixed(5)),
        parseFloat(target.y.toFixed(5)),
        parseFloat(target.z.toFixed(5)),
        this.viewer.cameraHandler.activeCam.name === 'ortho' ? 1 : 0,
        controls._zoom
      ]

      let selectionLocation = this.selectionLocation
      if (this.viewerState.selectedCommentMetaData) {
        selectionLocation = this.viewerState.selectedCommentMetaData.selectionLocation
      }

      const data = {
        filter: getLocalFilterState(),
        selection: this.viewerState.selectedObjects.map((o) => o.id),
        selectionLocation,
        sectionBox: this.viewer.getCurrentSectionBox(),
        selectionCenter: this.selectionCenter,
        camera: c,
        userId: this.$userId(),
        name: this.user ? this.user.name : 'Anonymous Viewer',
        uuid: this.uuid,
        status: 'viewing'
      }

      if (!this.streamId) return
      await this.$apollo.mutate({
        mutation: gql`
          mutation userViewerActivityBroadcast(
            $streamId: String!
            $resourceId: String!
            $data: JSONObject
          ) {
            userViewerActivityBroadcast(
              streamId: $streamId
              resourceId: $resourceId
              data: $data
            )
          }
        `,
        variables: {
          streamId: this.streamId,
          resourceId: this.resourceId,
          data
        }
      })
    },
    /**
     * Send out notification that the active user has disconnected
     */
    async sendDisconnect() {
      if (!this.isLoggedIn) return
      if (!this.streamId) return

      await this.$apollo.mutate({
        mutation: gql`
          mutation userViewerActivityBroadcast(
            $streamId: String!
            $resourceId: String!
            $data: JSONObject
          ) {
            userViewerActivityBroadcast(
              streamId: $streamId
              resourceId: $resourceId
              data: $data
            )
          }
        `,
        variables: {
          streamId: this.streamId,
          resourceId: this.resourceId,
          data: { userId: this.$userId(), uuid: this.uuid, status: 'disconnect' }
        }
      })
    },
    updateBubbles(transition = true) {
      if (!this.$refs.parent) return
      /** This needs to be refactored using queries. TO DO in FE2 */
      const cam = this.viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      const selectedObjects = []
      for (const user of this.users) {
        if (!this.$refs[`user-bubble-${user.uuid}`]) continue

        if (user.selection) selectedObjects.push(...user.selection)

        const location = new THREE.Vector3(
          user.camera[0],
          user.camera[1],
          user.camera[2]
        )
        let target = new THREE.Vector3(user.camera[3], user.camera[4], user.camera[5])
        const camDir = new THREE.Vector3().subVectors(target, location)

        if (user.selectionLocation)
          target = new THREE.Vector3(
            user.selectionLocation.x,
            user.selectionLocation.y,
            user.selectionLocation.z
          )
        camDir.project(cam)
        // camDir.normalize()
        target.project(cam)
        // target.normalize()

        const bubbleLoc = new THREE.Vector3(
          (camDir.x * 0.5 + 0.5) * this.$refs.parent.clientWidth,
          (camDir.y * -0.5 + 0.5) * this.$refs.parent.clientHeight,
          0
        )
        const targetLoc = new THREE.Vector3(
          (target.x * 0.5 + 0.5) * this.$refs.parent.clientWidth,
          (target.y * -0.5 + 0.5) * this.$refs.parent.clientHeight,
          0
        )
        const dir2D = new THREE.Vector3()
          .subVectors(targetLoc, bubbleLoc)
          .normalize()
          .multiplyScalar(70)
        const newTarget = new THREE.Vector3().addVectors(targetLoc, dir2D)

        const paddingX = 42
        const paddingYTop = 86
        const paddingYBottom = 68
        let tX = newTarget.x + 16
        let tY = newTarget.y + 16
        user.clipped = false
        if (tX < paddingX) {
          tX = paddingX
          user.clipped = true
        }
        if (tX > this.$refs.parent.clientWidth - paddingX) {
          tX = this.$refs.parent.clientWidth - paddingX
          user.clipped = true
        }

        if (tY < paddingYTop) {
          tY = paddingYTop
          user.clipped = true
        }
        if (tY > this.$refs.parent.clientHeight - paddingYBottom) {
          tY = this.$refs.parent.clientHeight - paddingYBottom
          user.clipped = true
        }

        const bubbleEl = this.$refs[`user-bubble-${user.uuid}`][0]
        const uTargetEl = this.$refs[`user-target-${user.uuid}`][0]
        const uArrowEl = this.$refs[`user-arrow-${user.uuid}`][0]

        if (!bubbleEl || !uTargetEl || !uArrowEl) return // collection can get modified during update

        if (!transition) {
          bubbleEl.style.transition = ''
          uTargetEl.style.transition = ''
          uArrowEl.style.transition = ''
        } else {
          bubbleEl.style.transition = 'all 0.3s ease'
          uTargetEl.style.transition = 'all 0.3s ease'
          uArrowEl.style.transition = 'all 0.3s ease'
        }

        bubbleEl.style.transform = `translate(-50%, -50%) translate(${tX}px,${tY}px)`

        uTargetEl.style.transform = `translate(-50%, -50%) translate(${targetLoc.x}px,${targetLoc.y}px)`
        uTargetEl.style.opacity = user.clipped ? '0' : '1'

        const angle = Math.atan2(
          targetLoc.y - 16 - newTarget.y,
          targetLoc.x - 16 - newTarget.x
        )
        uArrowEl.style.transform = `translate(${newTarget.x}px,${newTarget.y}px) rotate(${angle}rad)`
        uArrowEl.style.opacity = user.clipped ? '0' : '1'
      }

      selectedObjects.sort((a, b) => a.localeCompare(b))

      const isSame =
        JSON.stringify(selectedObjects) ===
        JSON.stringify([...this.otherUsersSelectedObjects])

      if (this.showBubbles && !isSame) {
        highlightObjects(selectedObjects)
      }

      this.otherUsersSelectedObjects = selectedObjects
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
  transform-origin: center;
}
</style>
