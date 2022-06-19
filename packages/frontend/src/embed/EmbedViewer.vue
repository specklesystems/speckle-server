<template>
  <v-app
    :class="`embed-viewer no-scrollbar ${
      $route.query.transparent === 'true'
        ? ''
        : $vuetify.theme.dark
        ? 'background-dark'
        : 'background-light'
    }`"
  >
    <!-- BG image -->
    <div
      v-if="objectIdsToLoad.length !== 0 && !isModelLoaded"
      style="position: fixed; top: 0; width: 100%; height: 100%; cursor: pointer"
      @click="load()"
    >
      <preview-image
        :url="`/preview/${$route.query.stream}/objects/${objectIdsToLoad[0]}`"
        :height="height"
        rotate
      ></preview-image>
    </div>

    <!-- Play button -->
    <div
      v-if="!isModelLoaded && !error"
      class="viewer-play d-flex fullscreen align-center justify-center no-mouse"
    >
      <v-btn
        id="viewer-play-btn"
        :disabled="showPlayLoader"
        fab
        color="primary"
        class="elevation-4 hover-tada mouse"
        @click="load()"
      >
        <v-icon v-if="!showPlayLoader">mdi-play</v-icon>
        <v-icon v-else class="spinning-icon">mdi-loading</v-icon>
      </v-btn>
    </div>

    <!-- Async loaded viewer -->
    <embed-viewer-core
      v-if="shouldLoadHeavyDeps"
      :objects="objectIdsToLoad"
      @model-loaded="onModelLoaded"
      @error="onError"
    />

    <!-- Display error if needed -->
    <div v-if="error" class="fullscreen d-flex justify-center align-center">
      <div class="">
        <p class="text-h5 text-center red--text">Speckle Embedding Error</p>
        <p class="text-center grey--text">
          Double check to see if the stream is public and if the embed link is correct.
        </p>
      </div>
    </div>
  </v-app>
</template>

<script lang="ts">
import { Nullable } from '@/helpers/typeHelpers'
import { getStreamObj, getBranchObj, getCommitObj } from '@/embed/speckleUtils'
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
    EmbedViewerCore: () => import('@/embed/EmbedViewerCore.vue'),
    PreviewImage: () => import('@/main/components/common/PreviewImage')
  },
  data() {
    return {
      isModelLoaded: false,
      error: null as Nullable<Error>,
      displayType: 'stream',
      objectIdsToLoad: [] as any[],
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
      shouldLoadHeavyDeps: false as boolean,
      height: window.innerHeight
    }
  },
  computed: {
    streamId(): string {
      return this.$route.query.stream as string
    },
    objectUrl(): string {
      return `${window.location.protocol}//${window.location.host}/streams/${this.input.stream}/objects/${this.input.object}`
    },
    showPlayLoader(): boolean {
      return !this.isInitialized || (this.shouldLoadHeavyDeps && !this.isModelLoaded)
    }
  },
  mounted() {
    if (this.$route.query.transparent === 'true') {
      document.getElementById('app').classList.remove('theme--dark')
      document.getElementById('app').classList.remove('theme--light')
    }
    window.addEventListener('resize', () => {
      this.height = window.innerHeight
    })
  },
  async beforeMount() {
    if (this.$route.query.stream) this.displayType = 'stream'
    if (this.$route.query.branch) this.displayType = 'branch'
    if (this.$route.query.commit) this.displayType = 'commit'
    if (this.$route.query.object) this.displayType = 'object'
    if (this.$route.query.overlay) this.displayType = 'multiple'

    try {
      switch (this.displayType) {
        case 'stream': {
          const res = await getStreamObj(this.$route.query.stream)
          if (res.data.stream.commits.totalCount === 0)
            throw new Error('Stream has no commits.')
          this.objectIdsToLoad.push(res.data.stream.commits.items[0].referencedObject)
          break
        }
        case 'branch': {
          const res = await getBranchObj(
            this.$route.query.stream,
            this.$route.query.branch
          )
          if (res.data.stream.branch.commits.totalCount === 0)
            throw new Error('Branch has no commits.')
          this.objectIdsToLoad.push(
            res.data.stream.branch.commits.items[0].referencedObject
          )
          break
        }
        case 'commit': {
          const res = await getCommitObj(
            this.$route.query.stream,
            this.$route.query.commit
          )
          this.objectIdsToLoad.push(res.data.stream.commit.referencedObject)
          break
        }
        case 'object':
          this.objectIdsToLoad.push(this.$route.query.object)
          break
        case 'multiple': {
          if (this.$route.query.commit) {
            const res = await getCommitObj(
              this.$route.query.stream,
              this.$route.query.commit
            )
            this.objectIdsToLoad.push(res.data.stream.commit.referencedObject)
          } else {
            this.objectIdsToLoad.push(this.$route.query.object)
          }
          for (const resId of this.$route.query.overlay.split(',')) {
            if (resId.length === 10) {
              const res = await getCommitObj(this.$route.query.stream, resId)
              this.objectIdsToLoad.push(res.data.stream.commit.referencedObject)
            } else {
              this.objectIdsToLoad.push(resId)
            }
          }
          break
        }
        default:
          break
      }
      // Mark as initialized (enable play button)
      this.isInitialized = true
    } catch (e) {
      this.error = e
    }
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
<<<<<<< HEAD
}
.no-mouse {
  pointer-events: none;
=======
>>>>>>> main
}
.mouse {
  pointer-events: auto;
}
</style>
