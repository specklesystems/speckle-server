<template>
  <div>
    <div v-if="stream && stream.commit">
      <commit-toolbar :stream="stream" @edit-commit="showCommitEditDialog = true" />

      <portal to="nav">
        <v-list nav dense class="mt-0 pt-0">
          <v-list-item
            link
            :to="`/streams/${stream.id}/branches/${stream.commit.branchName}`"
            class=""
          >
            <v-list-item-icon>
              <v-icon small class>mdi-arrow-left-drop-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="font-weight-bold">
                <v-icon small class="mr-1 caption">mdi-source-branch</v-icon>
                {{ stream.commit.branchName }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-scroll-y-transition>
          <object-selection
            v-show="selectionData.length !== 0"
            :objects="selectionData"
            :stream-id="stream.id"
          />
        </v-scroll-y-transition>

        <structure-display
          :obj="commitObject"
          :title="stream.commit.message"
          :stream-id="stream.id"
        />

        <views-display v-if="views.length !== 0" :views="views" />

        <filters :props="objectProperties" :source-application="stream.commit.sourceApplication" />
      </portal>

      <div style="height: 100vh; width: 100%; top: -64px; left: 0px; position: absolute">
        <viewer @load-progress="captureProgress" @selection="captureSelect" />
      </div>
      <div
        style="width: calc(100% + 0px); bottom: 12px; left: 0px; position: absolute; z-index: 100"
        class="d-flex justify-center"
      >
        <viewer-controls />
      </div>

      <!-- Preview image -->
      <v-fade-transition>
        <preview-image
          v-if="!loadedModel"
          style="
            height: 100vh;
            width: 100%;
            top: -64px;
            left: 0px;
            position: absolute;
            opacity: 0.7;
            filter: blur(4px);
          "
          :height="420"
          :url="`/preview/${stream.id}/commits/${stream.commit.id}`"
        ></preview-image>
      </v-fade-transition>

      <!-- Progress bar -->
      <div
        v-if="!loadedModel"
        style="height: 100vh; width: 20%; top: 45%; left: 40%; position: absolute"
      >
        <v-progress-linear
          v-model="loadProgress"
          :indeterminate="loadProgress >= 99 && !loadedModel"
          color="primary"
        ></v-progress-linear>
      </div>
    </div>
    <v-row v-if="!$apollo.queries.stream.loading && !stream.commit" justify="center">
      <error-placeholder error-type="404">
        <h2>Commit {{ $route.params.commitId }} not found.</h2>
      </error-placeholder>
    </v-row>

    <v-dialog
      v-model="showCommitEditDialog"
      width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
    >
      <commit-edit :stream="stream" @close="showCommitEditDialog = false" />
    </v-dialog>
  </div>
</template>
<script>
import streamCommitQuery from '@/graphql/commit.gql'

export default {
  components: {
    CommitEdit: () => import('@/cleanup/dialogs/CommitEdit'),
    Viewer: () => import('@/cleanup/components/common/Viewer'),
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder'),
    CommitToolbar: () => import('@/cleanup/toolbars/CommitToolbar'),
    PreviewImage: () => import('@/cleanup/components/common/PreviewImage'),
    ViewerControls: () => import('@/cleanup/components/viewer/ViewerControls'),
    ObjectSelection: () => import('@/cleanup/components/viewer/ObjectSelection'),
    StructureDisplay: () => import('@/cleanup/components/viewer/StructureDisplay'),
    ViewsDisplay: () => import('@/cleanup/components/viewer/ViewsDisplay'),
    Filters: () => import('@/cleanup/components/viewer/Filters')
  },
  data: () => ({
    loadedModel: false,
    loadProgress: 0,
    showCommitEditDialog: false,
    selectionData: [],
    views: [],
    objectProperties: null,
    hiddenObjects: [],
    isolatedObjects: [],
    showVisReset: false
  }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamCommitQuery,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.$route.params.commitId
        }
      },
      result() {
        setTimeout(() => this.loadModel(), 200)
      }
    }
  },
  computed: {
    commitObject() {
      if (!this.stream) return null
      return {
        referencedId: this.stream.commit.referencedObject,
        name: '',
        streamId: this.stream.id
      }
    }
  },
  watch: {
    stream(val) {
      if (!val) return
      if (val && val.commit && val.commit.branchName && val.commit.branchName === 'globals') {
        this.$router.push(`/streams/${this.$route.params.streamId}/globals/${val.commit.id}`)
        return
      }
    }
  },
  async mounted() {

  },
  methods: {
    async loadModel() {
      console.log(`Model load called`)
      if (!window.__viewer) {
        this.$eventHub.$emit('notification', {
          text: 'Error in rendering page (no __viewer found). Please refresh.'
        })
      }
      // // TODO: issue when freshly logged in, this throws an error
      // // that window.__viewer is null.
      // this.$nextTick(async () => {
      await window.__viewer.loadObject(
        `${window.location.origin}/streams/${this.stream.id}/objects/${this.stream.commit.referencedObject}`
      )
      window.__viewer.zoomExtents(undefined, false)
      this.loadedModel = true
      try {
        this.objectProperties = await window.__viewer.getObjectsProperties()
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: 'Failed to get object properties from viewer.'
        })
      }
      this.views.splice(0, this.views.length)
      console.log()
      this.views.push(...window.__viewer.sceneManager.views)
      // })
    },
    captureProgress(args) {
      this.loadProgress = args.progress * 100
    },
    captureSelect(selectionData) {
      this.selectionData.splice(0, this.selectionData.length)
      this.selectionData.push(...selectionData)
    },
    visReset() {
      this.showVisReset = false
      this.isolatedObjects = []
      this.hiddenObjects = []
      this.$eventHub.$emit('vis-reset')
      this.$eventHub.$emit('filter-reset')
    }
  }
}
</script>
