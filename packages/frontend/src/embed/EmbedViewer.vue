<template>
  <v-app
    :class="`no-scrollbar ${
      $vuetify.theme.dark ? 'background-dark' : 'background-light'
    }`"
  >
    <div v-if="!error" style="z-index: 10">
      <div
        class="top-left bottom-left pa-4"
        style="right: 0px; position: fixed; z-index: 100000"
      >
        <span v-show="!drawer" class="caption d-inline-flex align-center">
          <img src="@/assets/logo.svg" height="18" />
          <span style="margin-top: 2px" class="primary--text">
            <a href="https://speckle.xyz" target="_blank" class="text-decoration-none">
              <b>Powered by Speckle</b>
            </a>
          </span>
        </span>
        <br />
      </div>
      <div v-show="!drawer && loadedModel" class="caption grey--text pa-2">
        <v-btn fab small @click="drawer = true">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </div>
      <div
        class="pa-2 d-flex align-center justify-space-between caption"
        style="position: fixed; bottom: 0; width: 100%"
      >
        <portal to="viewercontrols">
          <v-btn
            v-if="stream && serverInfo"
            v-tooltip="'View extra details in Speckle!'"
            icon
            dark
            large
            class="elevation-5 primary pa-0 ma-o"
            :href="goToServerUrl"
            target="blank"
          >
            <v-icon dark small>mdi-open-in-new</v-icon>
          </v-btn>
        </portal>
      </div>
      <div
        :style="`width: 100%; bottom: 12px; left: 0px; position: ${
          $isMobile() ? 'fixed' : 'absolute'
        }; z-index: 20`"
        :class="`d-flex justify-center`"
      >
        <viewer-controls v-show="loadedModel" />
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
      <v-btn fab color="primary" class="elevation-20 hover-tada" @click="load()">
        <v-icon>mdi-play</v-icon>
      </v-btn>
    </div>
    <v-navigation-drawer
      ref="drawer"
      v-model="drawer"
      app
      floating
      style="z-index: 10000"
    >
      <div class="mx-1 mt-4 pr-2" style="height: 100%; width: 100%">
        <!-- Views display -->
        <views-display v-if="views.length !== 0" :views="views" :sticky-top="false" />

        <!-- Filters display -->
        <viewer-filters
          :props="objectProperties"
          style="width: 100%"
          :sticky-top="false"
        />
      </div>
    </v-navigation-drawer>
    <div style="position: fixed" class="no-scrollbar">
      <speckle-viewer @load-progress="captureProgress" />
    </div>
  </v-app>
</template>

<script>
import SpeckleViewer from '@/main/components/common/SpeckleViewer.vue'
import { getCommit, getLatestBranchCommit, getServerInfo } from '@/embed/speckleUtils'

export default {
  name: 'EmbedViewer',
  components: {
    SpeckleViewer,
    ViewerControls: () => import('@/main/components/viewer/ViewerControls'),
    ViewsDisplay: () => import('@/main/components/viewer/ViewsDisplay'),
    ViewerFilters: () => import('@/main/components/viewer/ViewerFilters.vue')
  },
  filters: {
    truncate(str, n = 20) {
      return str.length > n ? str.substr(0, n - 3) + '...' : str
    }
  },
  data() {
    return {
      drawer: false,
      loadedModel: false,
      loadProgress: 0,
      error: null,
      objectId: this.$route.query.object,
      views: [],
      objectProperties: null,
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
        this.$vuetify.breakpoint.name === 'xs' || this.$vuetify.breakpoint.name === 'sm'
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
      const stream = this.input.stream
      const base = `${window.location.origin}/streams/${stream}/`

      const commit = this.input.commit
      if (commit) return base + `commits/${commit}`

      const object = this.objectId
      if (object) return base + `objects/${object}`

      const branch = this.input.branch
      if (branch) return base + `branches/${encodeURI(branch)}`

      return base
    }
  },
  watch: {
    displayType(oldVal, newVal) {
      if (newVal === 'error') this.error = 'Provided details were invalid'
      else {
        this.error = null
      }
    }
  },
  async beforeMount() {
    try {
      const serverInfoResponse = await getServerInfo()
      this.serverInfo = serverInfoResponse.data.serverInfo
    } catch (e) {
      this.error = e.message
      return
    }

    if (this.displayType === 'commit') {
      try {
        const res = await getCommit(this.input.stream, this.input.commit)
        const data = res.data
        const latestCommit = data.stream.commit
        if (this.input.object === undefined)
          this.objectId = latestCommit.referencedObject
        this.specificCommit = data.stream
      } catch (e) {
        this.error = e.message
        return
      }
    } else {
      try {
        const res = await getLatestBranchCommit(this.input.stream, this.input.branch)
        const data = res.data
        const latestCommit =
          data.stream.branch.commits.items[0] || data.stream.branch.commit
        if (!latestCommit) {
          this.error = 'No commit for this branch'
          this.lastCommit = data.stream
          return
        }
        if (this.input.object === undefined)
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
      this.$mixpanel.track('Embedded Model Load', {
        step: this.onboarding,
        type: 'action'
      })

      window.__viewer.zoomExtents(undefined, true)

      this.loadedModel = true
      this.views.push(...window.__viewer.sceneManager.views)
      this.objectProperties = await window.__viewer.getObjectsProperties()
    },
    captureProgress(args) {
      this.loadProgress = args.progress * 100
    },
    async getPreviewImage(angle) {
      angle = angle || 0
      const previewUrl = this.objectUrl.replace('streams', 'preview') + '/' + angle
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
