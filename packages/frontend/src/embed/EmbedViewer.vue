<template>
  <v-app
    :class="`no-scrollbar ${
      $vuetify.theme.dark ? 'background-dark' : 'background-light'
    }`"
  >
    <!-- <speckle-loading v-if="!stream || error" :error="error" style="z-index: 101000" /> -->
    <div v-if="!error" style="z-index: 1000">
      <div class="top-left bottom-left ma-2 d-flex">
        <span class="caption d-inline-flex align-center">
          <img src="@/assets/logo.svg" height="20" />
          <span style="margin-top: 2px" class="primary--text">
            <a href="https://speckle.xyz" target="_blank" class="text-decoration-none">
              Speckle
            </a>
          </span>
        </span>
      </div>
      <div
        class="pa-2 d-flex align-center justify-space-between caption"
        style="position: fixed; bottom: 0; width: 100%"
      >
        <v-btn
          v-if="stream && serverInfo"
          v-tooltip="'See in Speckle'"
          color="primary"
          small
          class="rounded-lg"
          :href="goToServerUrl"
          target="blank"
        >
          <v-icon small>mdi-open-in-new</v-icon>
        </v-btn>
      </div>
    </div>
    <div
      v-if="!loadedModel"
      ref="cover"
      class="d-flex fullscreen align-center justify-center bg-img"
    />
    <div
      v-if="!loadedModel && loadProgress > 0"
      class="d-flex fullscreen align-center justify-center"
    >
      <v-progress-linear
        v-model="loadProgress"
        :indeterminate="loadProgress >= 99 && !loadedModel"
        color="primary"
        style="max-width: 30%"
      ></v-progress-linear>
    </div>
    <div
      v-if="!loadedModel && loadProgress === 0"
      class="d-flex fullscreen align-center justify-center"
    >
      <v-btn fab color="primary" class="elevation-10" @click="load()">
        <v-icon>mdi-play</v-icon>
      </v-btn>
    </div>
    <div style="position: fixed" class="no-scrollbar">
      <viewer @load-progress="captureProgress" />
    </div>
  </v-app>
</template>

<script>
import Viewer from '@/main/components/common/Viewer.vue'
import { getCommit, getLatestBranchCommit, getServerInfo } from '@/embed/speckleUtils'

export default {
  name: 'EmbedViewer',
  components: {
    Viewer
  },
  filters: {
    truncate: function (str, n = 20) {
      return str.length > n ? str.substr(0, n - 3) + '...' : str
    }
  },
  data() {
    return {
      loadedModel: false,
      loadProgress: 0,
      error: null,
      objectId: this.$route.query.object,
      input: {
        stream: this.$route.query.stream,
        object: this.$route.query.object,
        branch: this.$route.query.branch || 'main',
        commit: this.$route.query.commit
      },
      lastCommit: null,
      specificCommit: null,
      serverInfo: null
    }
  },
  computed: {
    isSmall() {
      return (
        this.$vuetify.breakpoint.name == 'xs' || this.$vuetify.breakpoint.name == 'sm'
      )
    },
    displayType() {
      if (!this.input.stream) {
        return 'error'
      }

      if (this.input.commit) return 'commit'
      if (this.input.object) return 'object'
      if (this.input.branch) return 'branch'

      return 'stream'
    },
    stream() {
      return this.lastCommit || this.specificCommit
    },
    objectUrl() {
      return `${window.location.protocol}//${window.location.host}/streams/${this.input.stream}/objects/${this.objectId}`
    },
    goToServerUrl() {
      let stream = this.input.stream
      let base = `${window.location.origin}/streams/${stream}/`

      let commit = this.input.commit
      if (commit) return base + `commits/${commit}`

      let object = this.objectId
      if (object) return base + `objects/${object}`

      let branch = this.input.branch
      if (branch) return base + `branches/${encodeURI(branch)}`

      return base
    }
  },
  watch: {
    displayType(oldVal, newVal) {
      if (newVal == 'error') this.error = 'Provided details were invalid'
      else {
        this.error = null
      }
    }
  },
  async beforeMount() {
    try {
      let serverInfoResponse = await getServerInfo()
      this.serverInfo = serverInfoResponse.data.serverInfo
    } catch (e) {
      this.error = e.message
      return
    }

    if (this.displayType === 'commit') {
      try {
        let res = await getCommit(this.input.stream, this.input.commit)
        let data = res.data
        let latestCommit = data.stream.commit
        if (this.input.object === undefined)
          this.objectId = latestCommit.referencedObject
        this.specificCommit = data.stream
      } catch (e) {
        this.error = e.message
        return
      }
    } else {
      try {
        let res = await getLatestBranchCommit(this.input.stream, this.input.branch)
        let data = res.data
        let latestCommit =
          data.stream.branch.commits.items[0] || data.stream.branch.commit
        if (!latestCommit) {
          this.error = 'No commit for this branch'
          this.lastCommit = data.stream
          return
        }
        if (this.input.object == undefined)
          this.objectId = latestCommit.referencedObject
        else this.objectId = this.input.object
        this.lastCommit = data.stream
      } catch (e) {
        this.error = e.message
        return
      }
    }
    this.getPreviewImage()
  },
  mounted() {},
  methods: {
    async load() {
      await window.__viewer.loadObject(this.objectUrl)
      window.__viewer.zoomExtents(undefined, true)
      this.loadedModel = true
      this.$mixpanel.track('Embedded Model Load', {
        step: this.onboarding,
        type: 'action'
      })
    },
    captureProgress(args) {
      this.loadProgress = args.progress * 100
    },
    async getPreviewImage(angle) {
      angle = angle || 0
      let previewUrl = this.objectUrl.replace('streams', 'preview') + '/' + angle
      let token = undefined
      try {
        token = localStorage.getItem('AuthToken')
      } catch (e) {
        console.warn('Sanboxed mode, only public streams will fetch properly.')
      }
      const res = await fetch(previewUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const blob = await res.blob()
      const imgUrl = URL.createObjectURL(blob)
      if (this.$refs.cover) this.$refs.cover.style.backgroundImage = `url('${imgUrl}')`
      this.hasImg = true
    }
  }
}
</script>

<style lang="scss">
body::-webkit-scrollbar {
  display: none;
}

.fullscreen {
  height: 100vh !important;
  width: 100vw !important;
  position: fixed;
  &::-webkit-scrollbar {
    display: none;
  }
}

.no-scrollbar {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  &::-webkit-scrollbar {
    display: none;
  }
}
.bg-img {
  background-position: center;
  background-repeat: no-repeat;
  /*background-attachment: fixed;*/
  filter: blur(2px);
}
.no-events {
  pointer-events: none;
}
</style>
