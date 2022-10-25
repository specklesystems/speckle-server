<template>
  <v-app
    id="speckle"
    :class="`embed-viewer no-scrollbar ${
      transparent ? '' : $vuetify.theme.dark ? 'background-dark' : 'background-light'
    }`"
  >
    <!-- BG image -->
    <div
      v-if="previewUrl && resourceMetadata && !isModelLoaded"
      style="position: fixed; top: 0; width: 100%; height: 100%; cursor: pointer"
      class="embed-bg"
      @click="load()"
    >
      <preview-image :url="previewUrl" :height="height" rotate></preview-image>
    </div>

    <!-- Play button -->
    <div
      v-if="!isModelLoaded && !error && !autoload"
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

    <!-- This should always be conditionally and asynchronously loaded so that heavy viewer deps are lazy loaded -->
    <embedded-commit-object-viewer
      v-if="resourceMetadata && shouldLoadHeavyDeps"
      :stream-id="streamId"
      :resource-id="resourceMetadata.resourceId"
      @models-loaded="onModelsLoaded"
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
import { computed, defineComponent, ref, onBeforeMount, watch, onMounted } from 'vue'
import { useRoute } from '@/main/lib/core/composables/router'
import { useMixpanel } from '@/main/lib/core/composables/core'
import { useApolloClient } from '@vue/apollo-composable'
import {
  StreamBranchFirstCommitDocument,
  StreamFirstCommitDocument
} from '@/graphql/generated/graphql'
import { useWindowSize } from '@vueuse/core'
import { isDarkTheme } from '@/main/utils/themeStateManager'
import PreviewImage from '@/main/components/common/PreviewImage.vue'
import { useEmbedViewerQuery } from '@/main/lib/viewer/commit-object-viewer/composables/embed'

export default defineComponent({
  name: 'TheEmbed',
  components: {
    EmbeddedCommitObjectViewer: () =>
      import('@/main/components/viewer/embed/EmbeddedCommitObjectViewer.vue'),
    PreviewImage
  },
  setup() {
    const route = useRoute()
    const apollo = useApolloClient()
    const mixpanel = useMixpanel()

    const isInitialized = ref(false)
    const isModelLoaded = ref(false)
    const shouldLoadHeavyDeps = ref(false)

    const error = ref(null as Nullable<Error>)
    const resourceMetadata = ref(
      null as Nullable<{
        resourceId: string
        objectId?: Nullable<string>
        type: 'commit' | 'object'
      }>
    )

    const displayType = computed(() => {
      let type: string | null = null
      if (route.query.stream) type = 'stream'
      if (route.query.branch) type = 'branch'
      if (route.query.commit) type = 'commit'
      if (route.query.object) type = 'object'

      return type
    })

    const { height } = useWindowSize()

    const { streamId, branchName, commitId, objectId, transparent, autoload } =
      useEmbedViewerQuery()

    const previewUrl = computed(() => {
      if (!resourceMetadata.value || !streamId.value) return null

      if (resourceMetadata.value.objectId) {
        return `/preview/${streamId.value}/objects/${resourceMetadata.value.objectId}`
      } else if (resourceMetadata.value.type === 'commit') {
        return `/preview/${streamId.value}/commits/${resourceMetadata.value.resourceId}`
      } else {
        return null
      }
    })

    const showPlayLoader = computed(
      () => !isInitialized.value || (shouldLoadHeavyDeps.value && !isModelLoaded.value)
    )

    onBeforeMount(async () => {
      const type = displayType.value

      try {
        if (!streamId.value) {
          throw new Error('Stream ID must be specified')
        }

        if (type === 'stream') {
          // Resolve the stream's first commit
          const res = await apollo.client.query({
            query: StreamFirstCommitDocument,
            variables: {
              id: streamId.value
            }
          })

          if (!res.data.stream?.commits?.items)
            throw new Error('Could not resolve stream')

          if (
            res.data.stream.commits.totalCount === 0 ||
            !res.data.stream.commits.items[0]
          )
            throw new Error('Stream has no commits.')

          resourceMetadata.value = {
            resourceId: res.data.stream.commits.items[0].id,
            objectId: res.data.stream.commits.items[0].referencedObject,
            type: 'commit'
          }
        } else if (type === 'branch' && branchName.value) {
          // Resolve a stream branch's first commit
          const res = await apollo.client.query({
            query: StreamBranchFirstCommitDocument,
            variables: {
              id: streamId.value,
              branch: branchName.value
            }
          })

          if (!res.data.stream?.branch?.commits?.items)
            throw new Error('Could not resolve stream or its branch')

          if (
            res.data.stream.branch.commits.totalCount === 0 ||
            !res.data.stream.branch.commits.items[0]
          )
            throw new Error('Branch has no commits.')

          resourceMetadata.value = {
            resourceId: res.data.stream.branch.commits.items[0].id,
            objectId: res.data.stream.branch.commits.items[0].referencedObject,
            type: 'commit'
          }
        } else if (type === 'commit' && commitId.value) {
          resourceMetadata.value = {
            resourceId: commitId.value,
            type: 'commit'
          }
        } else if (type === 'object' && objectId.value) {
          resourceMetadata.value = {
            resourceId: objectId.value,
            objectId: objectId.value,
            type: 'object'
          }
        }

        if (!resourceMetadata.value) {
          throw new Error('Unexpected display type or invalid parameters')
        }

        // Mark as ready for loading
        isInitialized.value = true
      } catch (err: unknown) {
        error.value = err instanceof Error ? err : new Error('Unexpected error')
        isInitialized.value = shouldLoadHeavyDeps.value = isModelLoaded.value = false
      }
    })

    const updateTransparency = () => {
      const appEl = document.getElementById('speckle')
      const classList = appEl!.classList
      if (transparent.value) {
        document.body.style.background = 'none'
        document.body.style.backgroundColor = 'none'
        appEl!.style.background = 'none'
        // classList.remove('theme--dark')
        // classList.remove('theme--light')
      } else {
        const isDarkMode = isDarkTheme()
        classList.add(`theme--${isDarkMode ? 'dark' : 'light'}`)
      }
    }

    const load = () => {
      if (!isInitialized.value || shouldLoadHeavyDeps.value || isModelLoaded.value)
        return

      shouldLoadHeavyDeps.value = true
      mixpanel.track('Embedded Model Load', {
        type: 'action'
      })
    }

    watch(() => transparent, updateTransparency)
    onMounted(() => {
      updateTransparency()
      if (autoload.value) load()
    })

    return {
      displayType,
      streamId,
      branchName,
      commitId,
      objectId,
      error,
      resourceMetadata,
      isInitialized,
      isModelLoaded,
      shouldLoadHeavyDeps,
      height,
      transparent,
      previewUrl,
      showPlayLoader,
      autoload,
      onError: (e: unknown) => {
        error.value = e instanceof Error ? e : new Error('Unexpected error')
      },
      onModelsLoaded: () => {
        isModelLoaded.value = true
      },
      load
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
.no-mouse {
  pointer-events: none;
}
.mouse {
  pointer-events: auto;
}
</style>
