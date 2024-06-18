<template>
  <div class="embed-viewer-core">
    <!-- Top bar (menu toggle + powered by speckle text) -->
    <div
      class="embed-viewer-core__top-bar top-left bottom-left pa-4 d-flex justify-space-between"
      style="right: 0px; position: fixed; z-index: 5; width: 100%"
    >
      <v-btn
        v-if="!hideSidebar"
        fab
        small
        style="z-index=1000"
        @click="drawer = !drawer"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-fade-transition>
        <span v-if="!drawer && !hideLogo" class="caption d-inline-flex align-center">
          <img src="@/assets/logo.svg" height="18" />
          <span style="margin-top: 2px" class="primary--text">
            <a
              href="https://speckle.systems"
              target="_blank"
              class="text-decoration-none"
            >
              <b>Powered by Speckle</b>
            </a>
          </span>
        </span>
      </v-fade-transition>
    </div>

    <!-- Viewer filters panel / sidebar -->
    <v-navigation-drawer
      v-show="!hideSidebar"
      ref="drawerRef"
      v-model="drawer"
      class="viewer-controls-drawer"
      app
      floating
      :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} elevation-1`"
      :width="navWidth"
      disable-resize-watcher
      style="z-index: 100"
    >
      <div class="px-1 pt-1 d-flex flex-column" style="height: 100%; width: 100%">
        <!-- Drawer closer -->
        <v-btn icon small class="align-self-end mb-2" @click="drawer = false">
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>

        <!-- Sidebar portal -->
        <portal-target name="nav" />
      </div>
    </v-navigation-drawer>

    <!-- Actual viewer -->
    <div class="embed-viewer-core__viewer viewer-wrapper no-scrollbar">
      <commit-object-viewer
        :stream-id="streamId"
        :resource-id="resourceId"
        :is-embed="true"
        :hide-controls="hideControls"
        :hide-selection-info="hideSelectionInfo"
        :no-scroll="noScroll"
        @models-loaded="onModelsLoaded"
      />
    </div>
    <!-- Appending buttons to viewercontrols (these should be ordered last) -->
    <portal to="viewercontrols" :order="100">
      <v-btn
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
</template>
<script lang="ts">
import Vue, { computed, defineComponent, Ref, ref } from 'vue'
import CommitObjectViewer from '@/main/pages/stream/CommitObjectViewer.vue'
import { useEmbedViewerQuery } from '@/main/lib/viewer/commit-object-viewer/composables/embed'
import { useNavigationDrawerAutoResize } from '@/main/lib/core/composables/dom'
import { Nullable } from '@/helpers/typeHelpers'

export default defineComponent({
  name: 'EmbeddedCommitObjectViewer',
  components: {
    CommitObjectViewer
  },
  props: {
    streamId: {
      type: String,
      required: true
    },
    resourceId: {
      type: String,
      required: true
    }
  },
  setup(_, { emit }) {
    const drawerRef: Ref<Nullable<Vue>> = ref(null)
    const loadedModel = ref(false)
    const drawer = ref(false)

    const { navWidth } = useNavigationDrawerAutoResize({
      drawerRef
    })

    const {
      streamId,
      commitId,
      objectId,
      branchName,
      hideControls,
      hideSidebar,
      hideSelectionInfo,
      hideLogo,
      noScroll
    } = useEmbedViewerQuery()

    const goToServerUrl = computed(() => {
      const base = `${window.location.origin}/streams/${streamId.value}/`

      if (commitId.value) return base + `commits/${commitId.value}`
      if (objectId.value) return base + `objects/${objectId.value}`
      if (branchName.value) return base + `branches/${encodeURI(branchName.value)}`

      return base
    })

    return {
      goToServerUrl,
      loadedModel,
      drawer,
      // drawer ref must be returned, for it to be filled
      drawerRef,
      navWidth,
      hideControls,
      hideSidebar,
      hideSelectionInfo,
      noScroll,
      hideLogo,
      onModelsLoaded: () => {
        loadedModel.value = true
        emit('models-loaded')
      }
    }
  }
})
</script>
<style lang="scss" scoped>
.embed-viewer-core {
  position: relative;
  width: 100%;
  height: 100%;

  &__viewer {
    height: 100vh !important;
    width: 100vw !important;

    &::-webkit-scrollbar {
      display: none;
    }

    top: 0;
    left: 0;
  }
}
</style>
