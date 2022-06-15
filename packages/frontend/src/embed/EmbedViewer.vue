<template>
  <v-app
    :class="`embed-viewer no-scrollbar ${
      $vuetify.theme.dark ? 'background-dark' : 'background-light'
    }`"
  >
    <!-- BG image -->
    <div
      v-if="!isModelLoaded"
      ref="cover"
      class="viewer-image-overlay d-flex fullscreen align-center justify-center bg-img"
    />

    <!-- Play button -->
    <div
      v-if="!isModelLoaded"
      class="viewer-play d-flex fullscreen align-center justify-center"
    >
      <v-btn
        id="viewer-play-btn"
        :disabled="showPlayLoader"
        fab
        color="primary"
        class="elevation-4 hover-tada"
        @click="load()"
      >
        <v-icon v-if="!showPlayLoader">mdi-play</v-icon>
        <v-icon v-else class="spinning-icon">mdi-loading</v-icon>
      </v-btn>
    </div>

    <!-- Async loaded viewer -->
    <embed-viewer-core
      v-if="shouldLoadHeavyDeps"
      :input="input"
      :object-url="objectUrl"
      @model-loaded="onModelLoaded"
      @error="onError"
    />
  </v-app>
</template>

<script lang="ts">
import { Nullable } from '@/helpers/typeHelpers'
import { getCommit, getLatestBranchCommit } from '@/embed/speckleUtils'
import Vue from 'vue'

/**
 * TODO:
 * - Move EmbedViewer back to main app? The main app has a lot of global dependencies
 * that this endpoint doesn't need, tho...
 * - Make speckle-viewer configurable through props/events not through window.__viewer
 */

export default Vue.extend({
  name: 'EmbedViewer',
  components: {
    EmbedViewerCore: () => import('@/embed/EmbedViewerCore.vue')
  },
  data() {
    return {
      isModelLoaded: false,
      error: null as Nullable<Error>,
      input: {
        stream: this.$route.query.stream,
        object: this.$route.query.object,
        branch: this.$route.query.branch || 'main',
        commit: this.$route.query.commit,
        overlay: this.$route.query.overlay,
        camera: this.$route.query.c,
        filter: this.$route.query.filter
      } as Record<string, string>,
      isInitialized: false as boolean,
      shouldLoadHeavyDeps: false as boolean
    }
  },
  computed: {
    displayType(): string {
      if (!this.input.stream) {
        return 'error'
      }

      if (this.input.commit) return 'commit'
      if (this.input.object) return 'object'
      if (this.input.branch) return 'branch'

      return 'stream'
    },
    objectUrl(): string {
      return `${window.location.protocol}//${window.location.host}/streams/${this.input.stream}/objects/${this.input.object}`
    },
    showPlayLoader(): boolean {
      return !this.isInitialized || (this.shouldLoadHeavyDeps && !this.isModelLoaded)
    }
  },
  watch: {
    displayType(_oldVal: string, newVal: string) {
      this.error =
        newVal === 'error' ? new Error('Provided details were invalid') : null
    },
    error(newVal: Error | null) {
      if (newVal) console.error(newVal)
    }
  },
  async beforeMount() {
    // Initialize base data, which can potentially change input.object
    await (this.displayType === 'commit'
      ? this.initializeForCommit()
      : this.initializeForStream())

    // Load BG image
    await this.getPreviewImage()

    // Mark as initialized (enable play button)
    this.isInitialized = true
  },
  methods: {
    onError(e: Error) {
      this.error = e
    },
    onModelLoaded() {
      this.isModelLoaded = true
    },
    load() {
      if (!this.isInitialized || this.shouldLoadHeavyDeps || this.isModelLoaded) return

      this.shouldLoadHeavyDeps = true
      this.$mixpanel.track('Embedded Model Load', {
        type: 'action'
      })
    },
    async getPreviewImage(angle?: number) {
      angle = angle || 0
      const previewUrl = this.objectUrl.replace('streams', 'preview') + '/' + angle
      const res = await fetch(previewUrl)
      const blob = await res.blob()
      const imgUrl = URL.createObjectURL(blob)
      if (this.$refs.cover) {
        ;(this.$refs.cover as HTMLElement).style.backgroundImage = `url('${imgUrl}')`
      }
    },
    async initializeForStream() {
      try {
        const res = await getLatestBranchCommit(this.input.stream, this.input.branch)
        const data = res.data
        const latestCommit =
          data.stream.branch.commits.items[0] || data.stream.branch.commit

        if (!latestCommit) {
          this.error = new Error('No commit for this branch')
          return
        }

        // Updating input.object
        if (this.input.object === undefined) {
          this.input.object = latestCommit.referencedObject
        }
      } catch (e: unknown) {
        this.error = e instanceof Error ? e : new Error('An unexpected error occurred')
      }
    },
    async initializeForCommit() {
      try {
        const res = await getCommit(this.input.stream, this.input.commit)
        const data = res.data
        const latestCommit = data.stream.commit

        // Updating input.object
        if (this.input.object === undefined) {
          this.input.object = latestCommit.referencedObject
        }
      } catch (e: unknown) {
        this.error = e instanceof Error ? e : new Error('An unexpected error occurred')
      }
    }
  }
})
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

  top: 0;
  left: 0;
  z-index: 10;
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

#viewer-play-btn {
  @keyframes spinner-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  // kinda hacky, but vuetify renders the disabled state in a stupid way that relies
  // on the background color of the thing behind the button
  &.v-btn--fab.v-btn--disabled {
    background-color: #242424 !important;
  }

  .spinning-icon {
    animation: spinner-spin 0.5s linear infinite;
  }
}
</style>
