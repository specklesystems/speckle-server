<template>
  <div
    ref="parent"
    style="width: 100%; height: 100vh; position: absolute; pointer-events: none; overflow: hidden"
    class=" "
  >
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
      :style="`pointer-events:none; transform-origin:center; width: 32px; height:32px; transform: rotateY(0) rotate(90deg)`"
    >
      <!-- <v-icon class="primary--text" style="position: relative; right: -90%">mdi-arrow-right</v-icon> -->
      <!-- <v-icon class="primary--text" style="position: relative; right: -90%">mdi-pan-right</v-icon> -->
      <v-icon class="primary--text" large style="position: relative; right: -60%; font-size: 4.2em">
        mdi-menu-right
      </v-icon>
    </div>
    <div
      v-for="sessionUser in users"
      :ref="`user-bubble-${sessionUser.uuid}`"
      :key="sessionUser.uuid"
      class="absolute-pos rounded-pill user-bubble elevation-5"
      :style="`opacity: ${sessionUser.hidden ? '0.2' : 1}; border: 4px solid ${
        $vuetify.theme.dark ? '#047EFB' : '#047EFB'
      }`"
    >
      <div @click="setUserPow(sessionUser)">
        <user-avatar
          :id="sessionUser.id"
          v-tooltip="sessionUser.name"
          :show-hover="false"
          :size="30"
          :margin="false"
        ></user-avatar>
        <text-dots-typing v-if="sessionUser.status === 'writing'" />
      </div>
    </div>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import { v4 as uuid } from 'uuid'
import debounce from 'lodash.debounce'

export default {
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
      userCommentActivity: {
        query: gql`
          subscription($streamId: String!, $resourceId: String!) {
            userCommentActivity(streamId: $streamId, resourceId: $resourceId)
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
          // Note: swap user id checks for .userId (vs. uuid) if wanting to not allow same user two diff browsers
          // it's easier to test like this though :)
          if (data.userCommentActivity.status === 'disconnect') {
            this.users = this.users.filter((u) => u.uuid !== data.userCommentActivity.uuid)
            this.updateBubbles(true)
            return
          }
          if (data.userCommentActivity.uuid === this.uuid) return
          let indx = this.users.findIndex((u) => u.uuid === data.userCommentActivity.uuid)
          if (indx !== -1) {
            let user = this.users[indx]
            user.camera = data.userCommentActivity.camera
            user.status = data.userCommentActivity.status
            user.filter = data.userCommentActivity.filter
            user.selectionLocation = data.userCommentActivity.selectionLocation
            user.selection = data.userCommentActivity.selection
            user.selectionCenter = data.userCommentActivity.selectionCenter
            user.sectionBox = data.userCommentActivity.sectionBox
            user.name = data.userCommentActivity.name
            user.lastUpdate = Date.now()
            // if (Math.random() < 0.5) user.status = 'writing'
            // else user.status = 'viewing'
          } else {
            this.users.push({
              projectedPos: [0, 0],
              hidden: false,
              id: data.userCommentActivity.userId,
              lastUpdate: Date.now(),
              clipped: false,
              ...data.userCommentActivity
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
      users: []
    }
  },
  mounted() {
    // for some reasons, these are not clearly intialised
    this.users = []
    this.selectedIds = []
    this.selectionCenter = null
    this.selectionLocation = null

    if (!window.__bubblesId) window.__bubblesId = uuid()
    this.uuid = window.__bubblesId

    this.raycaster = new THREE.Raycaster()
    // window.__viewer.cameraHandler.controls.addEventListener(
    //   'update',
    //   throttle(this.updateBubbles, 120)
    // )
    window.__viewer.cameraHandler.controls.addEventListener('update', () =>
      this.updateBubbles(false)
    )

    this.updateInterval = window.setInterval(this.sendUpdateAndPrune, 2000)
    window.addEventListener('beforeunload', async (e) => {
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
    window.__viewer.on('object-doubleclicked', (selectionInfo) => {})
  },
  async beforeDestroy() {
    await this.sendDisconnect()
    window.clearInterval(this.updateInterval)
  },
  methods: {
    setUserPow(user) {
      let camToSet = user.camera
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
    },
    async sendUpdateAndPrune() {
      if (!this.$route.params.resourceId) return
      for (let user of this.users) {
        let delta = Date.now() - user.lastUpdate
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

      let controls = window.__viewer.cameraHandler.activeCam.controls
      let pos = controls.getPosition()
      let target = controls.getTarget()
      let c = [
        parseFloat(pos.x.toFixed(5)),
        parseFloat(pos.y.toFixed(5)),
        parseFloat(pos.z.toFixed(5)),
        parseFloat(target.x.toFixed(5)),
        parseFloat(target.y.toFixed(5)),
        parseFloat(target.z.toFixed(5)),
        window.__viewer.cameraHandler.activeCam.name === 'ortho' ? 1 : 0,
        controls._zoom
      ]

      let data = {
        filter: this.$store.state.appliedFilter,
        selection: this.selectedIds,
        selectionLocation: this.selectionLocation,
        sectionBox: window.__viewer.sectionBox.getCurrentBox(),
        selectionCenter: this.selectionCenter,
        camera: c,
        userId: this.$userId(),
        name: this.user.name,
        uuid: this.uuid,
        status: 'viewing'
      }

      await this.$apollo.mutate({
        mutation: gql`
          mutation userCommentActivityBroadcast(
            $streamId: String!
            $resourceId: String!
            $data: JSONObject
          ) {
            userCommentActivityBroadcast(streamId: $streamId, resourceId: $resourceId, data: $data)
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
      await this.$apollo.mutate({
        mutation: gql`
          mutation userCommentActivityBroadcast(
            $streamId: String!
            $resourceId: String!
            $data: JSONObject
          ) {
            userCommentActivityBroadcast(streamId: $streamId, resourceId: $resourceId, data: $data)
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

      let cam = window.__viewer.cameraHandler.camera
      cam.updateProjectionMatrix()
      let selectedObjects = []
      for (let user of this.users) {
        if (!this.$refs[`user-bubble-${user.uuid}`]) continue

        if (user.selection) selectedObjects.push(...user.selection)

        let location = new THREE.Vector3(user.camera[0], user.camera[1], user.camera[2])
        let target = new THREE.Vector3(user.camera[3], user.camera[4], user.camera[5])
        let camDir = new THREE.Vector3().subVectors(target, location)

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

        let bubbleLoc = new THREE.Vector3(
          (camDir.x * 0.5 + 0.5) * this.$refs.parent.clientWidth,
          (camDir.y * -0.5 + 0.5) * this.$refs.parent.clientHeight,
          0
        )
        let targetLoc = new THREE.Vector3(
          (target.x * 0.5 + 0.5) * this.$refs.parent.clientWidth,
          (target.y * -0.5 + 0.5) * this.$refs.parent.clientHeight,
          0
        )
        let dir2D = new THREE.Vector3()
          .subVectors(targetLoc, bubbleLoc)
          .normalize()
          .multiplyScalar(70)
        let newTarget = new THREE.Vector3().addVectors(targetLoc, dir2D)

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

        let bubbleEl = this.$refs[`user-bubble-${user.uuid}`][0]
        let uTargetEl = this.$refs[`user-target-${user.uuid}`][0]
        let uArrowEl = this.$refs[`user-arrow-${user.uuid}`][0]

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

        const angle = Math.atan2(targetLoc.y - 16 - newTarget.y, targetLoc.x - 16 - newTarget.x)
        uArrowEl.style.transform = `translate(${newTarget.x}px,${newTarget.y}px) rotate(${angle}rad)`
        uArrowEl.style.opacity = user.clipped ? '0' : '1'
      }

      window.__viewer.interactions.overlayObjects(selectedObjects)
    }
  }
}
</script>
<style scoped>
.user-bubble {
}
.absolute-pos {
  pointer-events: auto;
  position: absolute;
  top: 0;
  left: 0;
  /* transition: all 0.3s ease; */
  transform-origin: center;
}
</style>
