<template>
  <div
    ref="parent"
    style="width: 100%; height: 100%; position: relative; pointer-events: none"
    class=""
  >
    <div v-for="user in users" :ref="`chip-${user.name}`" :key="user.name" class="chipper">
      <user-avatar
        :id="user.id"
        :show-hover="false"
        :size="40"
        shadow
        :margin="false"
      ></user-avatar>
      <span class="caption">{{ user.projectedPos }}</span>
      <!-- <v-chip style="pointer-events: auto" class="primary elevation-10" x-small>
        {{user.name}}
      </v-chip> -->
      <!-- <v-btn icon style="pointer-events: auto" icon dark x-small class="primary">
        <v-icon x-small>mdi-comment</v-icon>
      </v-btn> -->
    </div>
  </div>
</template>
<script>
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'

export default {
  components: {
    UserAvatar: () => import('@/cleanup/components/common/UserAvatar')
  },
  data() {
    return {
      users: [
        {
          name: 'Jedd',
          id: 'db31c6ee0b',
          position: { x: 21, y: 21, z: 21 },
          projectedPos: [0, 0],
          hidden: false
        },
        {
          name: 'Izzy',
          id: 'e87eb2bd92',
          position: { x: 19, y: 19, z: 10.5 },
          projectedPos: [0, 0],
          hidden: false
        },
        {
          name: 'Claire',
          id: '66de3bfd52',
          position: { x: 0, y: 0, z: 1 },
          projectedPos: [0, 0],
          hidden: false
        }
      ]
    }
  },
  mounted() {
    let raycaster = new THREE.Raycaster()
    console.log(this.$refs)
    window.__viewer.cameraHandler.controls.addEventListener(
      'update',
      throttle(() => {
        if (!this.$refs.parent) return
        let cam = window.__viewer.cameraHandler.activeCam.camera
        for (let user of this.users) {
          let p = new THREE.Vector3(user.position.x, user.position.y, user.position.z)
          p.project(cam)

          let x = (p.x * 0.5 + 0.5) * this.$refs.parent.clientWidth
          let y = (p.y * -0.5 + 0.5) * this.$refs.parent.clientHeight

          // clamp
          const padding = 30
          if (x < padding) x = padding
          if (y < padding) y = padding
          if (x > this.$refs.parent.clientWidth - padding)
            x = this.$refs.parent.clientWidth - padding
          if (y > this.$refs.parent.clientHeight - padding)
            y = this.$refs.parent.clientHeight - padding

          this.$refs[`chip-${user.name}`][0].style.transform = `translate(${x}px,${y}px)`
          user.projectedPos = [Math.round(x), Math.round(y)]

          // check if occluded
          // TODO: investigate performance, raycaster sucks usually
          raycaster.setFromCamera(p, cam)
          const intersections = raycaster.intersectObjects(
            window.__viewer.sceneManager.sceneObjects.groupedSolidObjects.children
          )
          let dist = p.distanceTo(cam.position)
          user.hidden = intersections.length !== 0 && dist > intersections[0].distance
          this.$refs[`chip-${user.name}`][0].style.opacity = user.hidden ? 0.4 : 1
        }
      }, 500)
    )
  }
}
</script>
<style scoped>
.chipper {
  pointer-events: auto;
  position: absolute;
  left: 0;
  top: 0;
  transition: all 0.6s ease;
  /* margin-top: -12px; */
}
.chipper:hover {
  opacity: 1 !important;
}
</style>
