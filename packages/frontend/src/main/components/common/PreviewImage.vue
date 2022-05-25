<template>
  <div
    :style="`position: relative; height: ${height}px;`"
    :class="`${$vuetify.theme.dark ? 'grey darken-4' : 'grey lighten-4'}`"
    @mouseenter="hovered = true"
    @touchmove="parseTouch"
    @mouseleave="
      hovered = false
      imageIndex = 0
    "
    @mousemove="setIndex"
  >
    <!-- 
    Note: alternate style, sketchfab inspired! We are controlling image display via manipulating
    bg image props position. Results in less dom elements, and no flickering! 
    -->
    <div :style="bgStyle"></div>
    <v-progress-linear
      v-show="loading"
      indeterminate
      height="2"
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
      default: 180
    },
    rotate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      hovered: false,
      hasStartedLoadingImages: false,
      currentPreviewImg: '',
      previewImages: [],
      imageIndex: 0,
      legacyMode: false,
      angles: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
        22, 23, 0
      ]
    }
  },
  computed: {
    revImg() {
      return this.legacyMode ? this.previewImages : [...this.previewImages].reverse()
    },
    bgStyle() {
      let bgStyle = `
        height: 100%;
        width: 100%;
        background-size: cover;
        background-image:`

      for (let i = 0; i < this.revImg.length; i++) {
        bgStyle += `url(${this.revImg[i]})${i !== this.revImg.length - 1 ? ',' : ';'}`
      }
      bgStyle += `
      background-position:`
      for (let i = 0; i < this.revImg.length; i++) {
        bgStyle += `${i === this.imageIndex ? 'center' : '10000px'}${
          i !== this.revImg.length - 1 ? ',' : ';'
        }`
      }
      return bgStyle
    }
  },

  watch: {
    hovered(val) {
      if (!this.rotate) return
      if (!val || this.hasStartedLoadingImages) return
      this.getOtherAngles()
      this.hasStartedLoadingImages = true
    }
  },
  async mounted() {
    this.previewImages.push(await this.getPreviewImage())
  },
  methods: {
    parseTouch(e) {
      if (this.loading || !this.rotate) {
        this.imageIndex = 0
        return
      }
      this.hovered = true
      this.setIndex({
        target: e.target,
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      })
    },
    setIndex(e) {
      if (this.loading || !this.rotate) {
        this.imageIndex = 0
        return
      }
      const rect = e.target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const step = rect.width / this.previewImages.length
      let index = Math.round(x / step)
      if (index >= this.previewImages.length) index = this.previewImages.length - 1
      this.imageIndex = index
    },
    async getPreviewImage(angle = 0) {
      const res = await fetch(this.url + `/${angle}`, {
        headers: localStorage.getItem('AuthToken')
          ? { Authorization: `Bearer ${localStorage.getItem('AuthToken')}` }
          : {}
      })

      if (res.headers.has('X-Preview-Error')) {
        throw new Error('Failed getting preview')
      }
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    },
    async getOtherAngles() {
      // Note: previously, previews were generated for only 5 angles (-30deg, -15, 0, 15, 30deg), corresponding to
      // labelled angles (-2, -1, 0, 1, 2). We have now switched to generating full 360deg previews in increments
      // of 15 deg, going clockwise straight. Eg., 0 = 0deg, 1 = 15deg, 2 = 30 deg, etc.
      this.loading = true

      try {
        const img = await this.getPreviewImage(this.angles[this.angles.length - 1]) // note: this throws if requesting an incorrect angle.
        this.$set(this.previewImages, this.angles.length - 1, img)
        const promises = []

        for (let i = 1; i < this.angles.length; i++) {
          promises.push(this.getPreviewImage(this.angles[i]))
        }

        const otherImgs = await Promise.all(promises)
        for (let i = 0; i < otherImgs.length; i++) {
          this.$set(this.previewImages, i + 1, otherImgs[i])
        }
      } catch (e) {
        // legacy track
        this.legacyMode = true
        const otherImgs = await Promise.all([
          this.getPreviewImage(-1),
          this.getPreviewImage(-2),
          this.getPreviewImage(1),
          this.getPreviewImage(2)
        ])
        this.previewImages.unshift(otherImgs[0])
        this.previewImages.unshift(otherImgs[1])
        this.previewImages.push(otherImgs[2])
        this.previewImages.push(otherImgs[3])
        // TODO: Weird. getPreviewImage throws, but the try block keeps going until the for loop,
        // resulting in an incorrect array; we need to filter out nulls/undefineds here...
        this.previewImages = this.previewImages.filter((i) => !!i)
      }
      this.loading = false
    }
  }
}
</script>
<style scoped>
.grasycale-img {
  transition: all 0.3s;
  filter: grayscale(100%);
}

.preview-img {
  width: 100%;
  opacity: 0.8;
  object-fit: cover;
  transition: all 0.2s ease;
}

.preview-img:hover {
  opacity: 1;
}

.stream-link a {
  /* color: inherit; */
  text-decoration: none;
  font-weight: 500;
}

.stream-link a:hover {
  text-decoration: underline;
}
</style>
