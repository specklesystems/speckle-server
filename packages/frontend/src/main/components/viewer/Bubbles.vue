<template>
  <div
    ref="parent"
    style="width: 100%; height: 100%; position: relative; pointer-events: none"
    class=""
  >
    <div
      v-for="user in users"
      :ref="`user-bubble-${user.uuid}`"
      :key="user.uuid"
      class="absolute-pos rounded-pill"
      :style="`opacity: ${user.hidden ? '0.2' : 1}; border: 2px solid ${
        $vuetify.theme.dark ? '#047EFB' : '#047EFB'
      }`"
    >
      <div @click="setUser(user)">
        <user-avatar :id="user.id" :show-hover="false" :size="32" :margin="false"></user-avatar>
        <span
          v-if="user.status === 'writing'"
          class="ellipsis-anim ml-1 mr-3 primary--text"
          style="position: absolute"
        >
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </div>
    <!-- Note: hidden, unhide for debugging -->
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
      <v-icon class="primary--text" large style="position: relative; right: -77%">
        mdi-menu-right
      </v-icon>
    </div>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import throttle from 'lodash.throttle'
import { v4 as uuid } from 'uuid'
// import debounce from 'lodash.debounce'

export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  apollo: {
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
            return
          }
          if (data.userCommentActivity.uuid === this.uuid) return

          let indx = this.users.findIndex((u) => u.uuid === data.userCommentActivity.uuid)
          if (indx !== -1) {
            let user = this.users[indx]
            user.camera = data.userCommentActivity.camera
            user.status = data.userCommentActivity.status
            user.filter = data.userCommentActivity.filter
            user.lastUpdate = Date.now()
            if (Math.random() < 0.5) user.status = 'writing'
            else user.status = 'viewing'
          } else {
            this.users.push({
              projectedPos: [0, 0],
              hidden: false,
              id: data.userCommentActivity.userId,
              lastUpdate: Date.now(),
              ...data.userCommentActivity
            })
          }
          this.updateBubbles()
        }
      }
    }
  },
  data() {
    return {
      uuid: uuid(),
      users: []
    }
  },
  mounted() {
    this.raycaster = new THREE.Raycaster()
    window.__viewer.cameraHandler.controls.addEventListener(
      'update',
      throttle(this.updateBubbles, 120)
    )
    this.updateInterval = window.setInterval(this.sendUpdateAndPrune, 2000)
    window.addEventListener('beforeunload', async (e) => {
      await this.sendDisconnect()
    })
    this.resourceId = this.$route.params.resourceId
  },
  async beforeDestroy() {
    await this.sendDisconnect()
    window.clearInterval(this.updateInterval)
  },
  methods: {
    setUser(user) {
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
    },
    async sendUpdateAndPrune() {
      for (let user of this.users) {
        let delta = Date.now() - user.lastUpdate
        if (delta > 20000) {
          user.hidden = true
          user.status = 'stale'
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
        camera: c,
        userId: this.$userId(),
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
          resourceId: this.resourceId,
          data: { userId: this.$userId(), uuid: this.uuid, status: 'disconnect' }
        }
      })
    },
    updateBubbles() {
      if (!this.$refs.parent) return

      let cam = window.__viewer.cameraHandler.activeCam.camera
      cam.updateProjectionMatrix()

      for (let user of this.users) {
        if (!this.$refs[`user-bubble-${user.uuid}`]) continue

        let location = new THREE.Vector3(user.camera[0], user.camera[1], user.camera[2])
        let target = new THREE.Vector3(user.camera[3], user.camera[4], user.camera[5])
        let camDir = new THREE.Vector3().subVectors(target, location)

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
        // const paddingX = 42
        // const paddingY = 64

        // if (newTarget.x < paddingX) newTarget.setX(paddingX)
        // if (newTarget.x > this.$refs.parent.clientWidth - paddingX)
        //   newTarget.setX(this.$refs.parent.clientWidth - paddingX)

        // if (newTarget.y < paddingY) newTarget.setX(paddingY)
        // if (newTarget.y > this.$refs.parent.clientWidth - paddingY)
        //   newTarget.setX(this.$refs.parent.clientWidth - paddingY)

        this.$refs[
          `user-bubble-${user.uuid}`
        ][0].style.transform = `translate(-50%, -50%) translate(${newTarget.x + 16}px,${
          newTarget.y + 16
        }px)`

        this.$refs[
          `user-target-${user.uuid}`
        ][0].style.transform = `translate(-50%, -50%) translate(${targetLoc.x}px,${targetLoc.y}px)`

        const angle = Math.atan2(targetLoc.y - 16 - newTarget.y, targetLoc.x - 16 - newTarget.x)
        this.$refs[
          `user-arrow-${user.uuid}`
        ][0].style.transform = `translate(${newTarget.x}px,${newTarget.y}px) rotate(${angle}rad)`
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
  transition: all 0.3s ease;
  transform-origin: center;
}

.ellipsis-anim span {
  font-family: serif !important;
  opacity: 0;
  -webkit-animation: ellipsis-dot 1s infinite;
  animation: ellipsis-dot 1s infinite;
  font-size: 1.5em;
  line-height: 10px;
  user-select: none;
}

.ellipsis-anim span:nth-child(1) {
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
}
.ellipsis-anim span:nth-child(2) {
  -webkit-animation-delay: 0.1s;
  animation-delay: 0.1s;
}
.ellipsis-anim span:nth-child(3) {
  -webkit-animation-delay: 0.2s;
  animation-delay: 0.2s;
}

@-webkit-keyframes ellipsis-dot {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes ellipsis-dot {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
