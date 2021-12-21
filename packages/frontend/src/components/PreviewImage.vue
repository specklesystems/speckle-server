<template>
  <v-img
    ref="cover"
    :height="height"
    :class="`${color ? '' : 'grasycale-img'} preview-img`"
    :src="currentPreviewImg"
    :gradient="`to top right, ${
      $vuetify.theme.dark
        ? 'rgba(100,115,201,.33), rgba(25,32,72,.7)'
        : 'rgba(100,115,231,.1), rgba(25,32,72,.05)'
    }`"
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
      try {
        const blob = await res.blob()
        this.currentPreviewImg = URL.createObjectURL(blob)
      } catch (err) {
        console.log(err)
      }
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

.preview-img:hover{
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
