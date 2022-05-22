<template>
  <div @mouseenter="hovered = true" @mouseleave="hovered = false" @mousemove="setIndex">
    <v-img
      ref="cover"
      :height="height"
      cover
      :class="`${color ? '' : 'grasycale-img'} preview-img`"
      :src="previewImages[imageIndex]"
      :gradient="`to top right, ${
        $vuetify.theme.dark
          ? 'rgba(100,115,201,.13), rgba(25,32,72,.2)'
          : 'rgba(100,115,231,.075), rgba(25,32,72,.02)'
      }`"
    />
    <v-progress-linear v-show="loading" indeterminate height="2" />
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
    full: {
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
      angles: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
        22, 23, 0
      ]
    }
  },
  watch: {
    hovered(val) {
      if (!val || this.hasStartedLoadingImages) return
      this.getOtherAngles()
      this.hasStartedLoadingImages = true
    }
  },
  async mounted() {
    this.previewImages.push(await this.getPreviewImage())
  },
  methods: {
    setIndex(e) {
      if (this.hasStartedLoadingImages && this.loading) return
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
      // starting in reverse to quickly figure out if we're on the legacy track!
      for (let i = this.angles.length - 1; i > 0; i--) {
        if (this.angles[i] === 0) continue // we already have this one loaded
        try {
          const img = await this.getPreviewImage(this.angles[i])
          this.$set(this.previewImages, i, img)
        } catch (err) {
          // on the legacy track!
          this.previewImages.unshift(await this.getPreviewImage(-1))
          this.previewImages.unshift(await this.getPreviewImage(-2))
          // We have the image at 0, skipping
          this.previewImages.push(await this.getPreviewImage(1))
          this.previewImages.push(await this.getPreviewImage(2))
          this.loading = false
          break
        }
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
