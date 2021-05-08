<template>
  <v-hover v-slot="{ hover }">
    <v-card
      :to="'/streams/' + stream.id"
      color=""
      :elevation="hover ? 5 : 1"
      style="transition: all 0.2s ease-in-out"
    >
      <img
        ref="cover"
        :class="`${hover ? '' : 'grasycale-img'} preview-img`"
        :src="currentPreviewImg"
      />
      <v-card-title class="">{{ stream.name }}</v-card-title>
      <v-card-text>
        <span class="caption mb-2 font-italic">
          Updated
          <timeago :datetime="stream.updatedAt"></timeago>
        </span>
        <v-chip small outlined class="ml-3">
          <v-icon small left>mdi-account-key-outline</v-icon>
          {{ stream.role.split(':')[1] }}
        </v-chip>
        <v-btn
          v-tooltip="
            stream.branches.totalCount + ' branch' + (stream.branches.totalCount === 1 ? '' : 'es')
          "
          plain
          color="primary"
          text
          class="px-0 ml-3"
          small
          :to="'/streams/' + stream.id + '/branches'"
        >
          <v-icon small class="mr-2 float-left">mdi-source-branch</v-icon>
          {{ stream.branches.totalCount }}
        </v-btn>

        <v-btn
          v-tooltip="
            stream.commits.totalCount + ' commit' + (stream.commits.totalCount === 1 ? '' : 's')
          "
          plain
          color="primary"
          text
          class="px-0"
          small
          :to="'/streams/' + stream.id + '/branches/main/commits'"
        >
          <v-icon small class="mr-2 float-left">mdi-source-commit</v-icon>
          {{ stream.commits.totalCount }}
        </v-btn>
        <div class="mt-3 caption text-truncate">
          {{ stream.description }}
        </div>
      </v-card-text>
      <v-card-text class="pt-0">
        <user-avatar
          v-for="user in stream.collaborators.slice(0, 4)"
          :id="user.id"
          :key="user.id"
          :avatar="user.avatar"
          :size="30"
          :name="user.name"
        />
        <v-avatar v-if="stream.collaborators.length > 4" size="30" color="grey">
          <span class="white--text">+{{ stream.collaborators.length - 4 }}</span>
        </v-avatar>
      </v-card-text>
    </v-card>
  </v-hover>
</template>
<script>
import UserAvatar from '../components/UserAvatar'

export default {
  components: { UserAvatar },
  props: {
    stream: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  data() {
    return {
      previewImgUrls: [],
      currentPreviewImg: '/loadingImage.png'
    }
  },
  mounted() {
    this.getPreviewImages().then().catch()
  },
  methods: {
    async getPreviewImages() {
      if (this.stream.commits.items.length === 0) return
      // let angles = [-2, -1, 0, 1, 2]
      let angles = [0]
      for (let ang of angles) {
        let previewUrl = `/preview/${this.stream.id}/objects/${this.stream.commits.items[0].referencedObject}/${ang}`
        const res = await fetch(previewUrl, {
          headers: localStorage.getItem('AuthToken')
            ? { Authorization: `Bearer ${localStorage.getItem('AuthToken')}` }
            : {}
        })
        const blob = await res.blob()
        const imgUrl = URL.createObjectURL(blob)
        this.previewImgUrls.push(imgUrl)
        if (ang === 0) this.currentPreviewImg = imgUrl
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
  height: 180px;
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
