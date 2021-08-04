<template>
  <img
    ref="cover"
    :height="height"
    :class="`${color ? '' : 'grasycale-img'} preview-img`"
    :src="currentPreviewImg"
  />
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
    }
  },
  data() {
    return {
      currentPreviewImg: '/loadingImage.png'
    }
  },
  mounted() {
    this.getPreviewImage().then().catch()
  },
  methods: {
    async getPreviewImage() {
      const res = await fetch(this.url, {
        headers: localStorage.getItem('AuthToken')
          ? { Authorization: `Bearer ${localStorage.getItem('AuthToken')}` }
          : {}
      })
      const blob = await res.blob()
      this.currentPreviewImg = URL.createObjectURL(blob)
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
  object-fit: cover;
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
