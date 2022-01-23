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
      :class="`absolute-pos rounded-pill elevation-4 grey ${
        $vuetify.theme.dark ? 'darken-4' : 'lighten-3'
      }`"
      :style="`opacity: ${user.hidden ? '0.2' : 1};`"
    >
      <div @click="setUser(user)">
        <user-avatar :id="user.id" :show-hover="false" :size="32" :margin="false"></user-avatar>
        <span
          v-if="user.status === 'writing'"
          class="ellipsis-anim ml-1 mr-3"
          style="position: relative; xxtop: -2px"
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
      <v-icon class="primary--text" style="position: relative; top: -90%">mdi-navigation-outline</v-icon>
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
    UserAvatar: () => import('@/cleanup/components/common/UserAvatar')
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
      for (let user of this.users) {
        if (!this.$refs[`user-bubble-${user.uuid}`]) continue

        let box = new THREE.Box3().setFromObject(
          window.__viewer.sceneManager.sceneObjects.objectsInScene
        )
        let fraction = box.max.distanceTo(box.min) / 3

        let location = new THREE.Vector3(user.camera[0], user.camera[1], user.camera[2])
        let target = new THREE.Vector3(user.camera[3], user.camera[4], user.camera[5])
        let distCamTarget = location.distanceTo(target)

        target.add(
          location
            .clone()
            .normalize()
            .multiplyScalar(fraction > distCamTarget ? distCamTarget : fraction)
        )

        let p = target // cam.target
        p.project(cam)

        // convert to div xy space
        let x = (p.x * 0.5 + 0.5) * this.$refs.parent.clientWidth
        let y = (p.y * -0.5 + 0.5) * this.$refs.parent.clientHeight

        // clamp sides
        const padding = 42
        if (x < padding) x = padding
        if (y < padding + 34) y = padding + 34
        if (x > this.$refs.parent.clientWidth - padding) x = this.$refs.parent.clientWidth - padding
        if (y > this.$refs.parent.clientHeight - padding - 34)
          y = this.$refs.parent.clientHeight - padding - 34

        this.$refs[`user-bubble-${user.uuid}`][0].style.transform = `translate(${x}px,${y}px)`

        let actualTarget = new THREE.Vector3(user.camera[3], user.camera[4], user.camera[5])
        actualTarget.project(cam)
        let targetX = (actualTarget.x * 0.5 + 0.5) * this.$refs.parent.clientWidth
        let targetY = (actualTarget.y * -0.5 + 0.5) * this.$refs.parent.clientHeight
        this.$refs[
          `user-target-${user.uuid}`
        ][0].style.transform = `translate(-50%, -50%) translate(${targetX}px,${targetY}px)`

        let dir = new THREE.Vector3()
        const p1 = new THREE.Vector3(x + 16, y + 16, 0)
        const p2 = new THREE.Vector3(targetX, targetY, 0)
        dir.subVectors(p2, p1).normalize()
        let angle = dir.angleTo(new THREE.Vector3(1, 0, 0))

        const cross = new THREE.Vector3()
        cross.crossVectors(p1, p2).normalize()
        // const norm =
        const dot = new THREE.Vector3(0, 0, 1).dot(cross)

        if (dot < 0) angle = -angle
        let deg = (angle * 180) / Math.PI + 90

        this.$refs[
          `user-arrow-${user.uuid}`
        ][0].style.transform = `translate(${x}px,${y}px) rotate(${deg}deg)`
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
  font-size: 1em;
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
