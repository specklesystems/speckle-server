<template>
  <div
    ref="parent"
    :style="`width: 100%; height: 100vh; position: absolute; pointer-events: none; overflow: hidden; opacity: ${
      $store.state.selectedComment || $store.state.addingComment ? '0.2' : '1'
    };`"
  >
    <div v-show="showBubbles">
      <div
        v-for="user in users"
        :ref="`user-target-${user.uuid}`"
        :key="user.uuid + 'target'"
        :class="`absolute-pos rounded-pill primary`"
        :style="` opacity: ${
          user.hidden ? '0.2' : 1
        }; transform-origin:center; width: 10px; height:10px; pointer-events:none`"
      ></div>
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
        key="bubbles-toggle-button"
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
          user {
            id
            name
          }
        }
      `,
      skip() {
        return !this.$loggedIn()
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
            streamId: this.$route.params.streamId,
            resourceId: this.$route.params.resourceId
          }
        },
        skip() {
          return !this.$route.params.resourceId || !this.$loggedIn()
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
  data() {
    return {
      uuid: uuid(),
      selectedIds: [],
      selectionLocation: null,
      selectionCenter: null,
      users: [],
      showBubbles: true
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
    window.__viewer.cameraHandler.controls.addEventListener('update', () =>
      this.updateBubbles(false)
    )

    this.updateInterval = window.setInterval(this.sendUpdateAndPrune, 2000)
    window.addEventListener('beforeunload', async () => {
      await this.sendDisconnect()
    })
    this.resourceId = this.$route.params.resourceId
    window.__resourceId = this.$route.params.resourceId
    window.__viewer.on(
      'select',
      debounce((selectionInfo) => {
        this.selectedIds = selectionInfo.userData.map((o) => o.id)
        this.selectionLocation = selectionInfo.location
        this.selectionCenter = selectionInfo.selectionCenter
        this.sendUpdateAndPrune()
      }, 50)
    )
    window.__viewer.on('object-doubleclicked', () => {})
  },
  async beforeDestroy() {
    await this.sendDisconnect()
    window.clearInterval(this.updateInterval)
  },
  methods: {
    setUserPow(user) {
      const camToSet = user.camera
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
      if (user.filter) this.$store.commit('setFilterDirect', { filter: user.filter })
      else this.$store.commit('resetFilter')

      if (user.sectionBox) {
        window.__viewer.sectionBox.on()
        window.__viewer.sectionBox.setBox(user.sectionBox, 0)
      }
      this.$mixpanel.track('Bubbles Action', { type: 'action', name: 'avatar-click' })
    },
    async sendUpdateAndPrune() {
      if (!this.$route.params.resourceId) return
      for (const user of this.users) {
        const delta = Date.now() - user.lastUpdate
        if (delta > 20000) {
          user.hidden = true
          user.status = 'stale'
        }
        if (delta < 20000) {
          user.hidden = false
          user.status = ''
        }
      }
      this.users = this.users.filter((u) => Date.now() - u.lastUpdate < 40000)

      if (!this.$loggedIn()) return

      const controls = window.__viewer.cameraHandler.activeCam.controls
      const pos = controls.getPosition()
      const target = controls.getTarget()
      const c = [
        parseFloat(pos.x.toFixed(5)),
        parseFloat(pos.y.toFixed(5)),
        parseFloat(pos.z.toFixed(5)),
        parseFloat(target.x.toFixed(5)),
        parseFloat(target.y.toFixed(5)),
        parseFloat(target.z.toFixed(5)),
        window.__viewer.cameraHandler.activeCam.name === 'ortho' ? 1 : 0,
        controls._zoom
      ]

      let selectionLocation = this.selectionLocation
      if (this.$store.state.selectedComment) {
        selectionLocation = this.$store.state.selectedComment.data.location
      }

      const data = {
        filter: this.$store.state.appliedFilter,
        selection: this.selectedIds,
        selectionLocation,
        sectionBox: window.__viewer.sectionBox.getCurrentBox(),
        selectionCenter: this.selectionCenter,
        camera: c,
        userId: this.$userId(),
        name: this.user ? this.user.name : 'Anonymous Viewer',
        uuid: this.uuid,
        status: 'viewing'
      }

      if (!this.$route.params.streamId) return
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
          streamId: this.$route.params.streamId,
          resourceId: this.$route.params.resourceId,
          data
        }
      })
    },
    async sendDisconnect() {
      if (!this.$loggedIn()) return
      if (!this.$route.params.streamId) return

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
          streamId: this.$route.params.streamId,
          resourceId: this.resourceId || window.__resourceId,
          data: { userId: this.$userId(), uuid: this.uuid, status: 'disconnect' }
        }
      })
      delete window.__resourceId
    },
    updateBubbles(transition = true) {
      if (!this.$refs.parent) return

      const cam = window.__viewer.cameraHandler.camera
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

        // TODO: clamp sides
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

      window.__viewer.interactions.overlayObjects(selectedObjects)
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
