<template>
  <div
    :style="`position: relative; height: ${height}px;`"
    :class="`${$vuetify.theme.dark ? 'grey darken-4' : 'grey lighten-4'}`"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @mousemove="setIndex"
    @touchmove="
      (e) =>
        setIndex({
          target: e.target,
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        })
    "
  >
    <v-fade-transition>
      <div
        v-show="!(fullPreviewImage && hovered) || legacyMode"
        ref="image_360"
        :style="background"
      ></div>
    </v-fade-transition>

    <div
      ref="image_360"
      xxxv-show="!legacyMode && hovered && fullPreviewImage"
      :style="background360"
    ></div>

    <v-progress-linear
      v-show="loading"
      indeterminate
      height="4"
      style="position: absolute; bottom: 0"
    />
  </div>
</template>
<script>
export default {
  props: {
    url: {
      type: String,
      default: ''
    },
    color: {
      type: Boolean,
      default: true
    },
    height: {
      type: Number,
      default: 200
    },
    rotate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isMounted: false,
      loading: false,
      hovered: false,
      hasStartedLoadingImages: false,
      previewImage: null,
      fullPreviewImage: null,
      imageIndex: 0,
      legacyMode: false,
      controller: new AbortController()
    }
  },
  computed: {
    background() {
      return `
      position: absolute;
        top:0;
        height: 100%;
        width: 100%;
        background-size: cover;
        background-image:url(${this.previewImage});
        background-position: center center;
      `
    },
    background360() {
      let background = `
        position: absolute;
        opacity: ${!this.legacyMode && this.hovered && this.fullPreviewImage ? 1 : 0};
        transition: opacity 0.5s;
        top:0;
        height: 100%;
        width: 100%;
        background-size: cover;
        background-image:`
      if (this.fullPreviewImage && (this.hovered || true)) {
        background += `url(${this.fullPreviewImage});`
      } else {
        background += `url(${this.previewImage});`
      }
      if (!this.isMounted) return background
      const scaleFactor = this.$refs.image_360.getBoundingClientRect().height / 400
      const actualWidth = scaleFactor * 700
      const widthDiff =
        (this.$refs.image_360.getBoundingClientRect().width - actualWidth) * 0.5

      if (this.fullPreviewImage && (this.hovered || true)) {
        background += `background-position: ${-(
          actualWidth * (2 * this.imageIndex + 1) -
          widthDiff
        )}px 0;`
      } else {
        background += `background-position: center center;`
      }
      return background
    }
  },

  watch: {
    hovered(val) {
      if (val && !this.fullPreviewImage) {
        setTimeout(async () => {
          if (!this.hovered) return
          if (this.legacyMode) return
          if (this.fullPreviewImage) return
          this.loading = true
          try {
            this.fullPreviewImage = await this.getPreviewImage('all')
          } catch (err) {
            if (err.toString() === 'Failed getting preview') {
              this.legacyMode = true
            }
            // else: we've aborted the request due to mouse moving out
          }
          this.loading = false
        }, 500)
      }

      if (!val && this.loading) {
        this.controller.abort()
        this.controller = new AbortController()
        this.loading = false
      }
      if (!val) {
        this.imageIndex = 0
      }
    }
  },
  async mounted() {
    this.previewImage = await this.getPreviewImage()
    this.isMounted = true
  },
  methods: {
    setIndex(e) {
      if (this.loading || !this.rotate) {
        this.imageIndex = 0
        return
      }
      const rect = e.target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const step = rect.width / 24
      let index = Math.round(x / step)
      if (index >= 24) index = 24 - 1
      this.imageIndex = index
    },
    async getPreviewImage(angle = 0) {
      const res = await fetch(this.url + `/${angle}`, {
        signal: this.controller.signal,
        headers: localStorage.getItem('AuthToken')
          ? { Authorization: `Bearer ${localStorage.getItem('AuthToken')}` }
          : {}
      })

      if (res.headers.has('X-Preview-Error')) {
        throw new Error('Failed getting preview')
      }
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    }
  }
}
</script>
<style scoped>
.grasycale-img {
  transition: all 0.3s;
  filter: grayscale(100%);
}
</style>
