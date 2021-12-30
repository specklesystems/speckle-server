<template>
  <div>
    <div v-if="stream && stream.commit">
      <portal to="streamTitleBar">
        <commit-toolbar :stream="stream" @edit-commit="showCommitEditDialog = true" />
      </portal>

      <portal to="nav">

        <v-list v-if="stream" nav dense class="mt-0 pt-0">
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

        <object-selection :objects="selectionData" :stream-id="stream.id" />

        <structure-display
          :obj="commitObject"
          :title="stream.commit.message"
          :stream-id="stream.id"
        />

        <views-display :views="views" />

        <filters />
      </portal>

      <div style="height: 100vh; width: 100%; top: -64px; position: absolute">
        <viewer
          @viewer-init="loadModel()"
          @load-progress="captureProgress"
          @selection="captureSelect"
        />
      </div>

      <!-- Preview image -->
      <v-fade-transition>
        <preview-image
          v-if="!loadedModel"
          style="
            height: 100vh;
            width: 100%;
            top: -64px;
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

    <div
      style="position: absolute; bottom: 10px; z-index: 100; width: 100%"
      class="px-5 d-flex align-center justify-center"
    >
      <viewer-controls :show-vis-reset="showVisReset" @visibility-reset="visReset()" />
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
    calls: 0,
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
        this.loadModel()
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
    },
    typeMap() {
      if (!this.objectProperties) return []
      let typeMap = []
      for (let key of Object.keys(this.objectProperties.speckle_type.uniqueValues)) {
        let shortName = key.split('.').reverse()[0]
        typeMap.push({
          key: shortName,
          count: this.objectProperties.speckle_type.uniqueValues[key]
        })
      }
      return typeMap
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
    this.$eventHub.$on('hide-objects', (ids) => {
      this.isolatedObjects = []
      this.hiddenObjects = [...new Set([...this.hiddenObjects, ...ids])]
      window.__viewer.applyFilter({
        filterBy: { id: { not: this.hiddenObjects } },
        ghostOthers: false
      })
      if (this.isolatedObjects.length !== 0 || this.hiddenObjects.length !== 0)
        this.showVisReset = true
      else this.showVisReset = false
    })
    this.$eventHub.$on('show-objects', (ids) => {
      this.hiddenObjects = this.hiddenObjects.filter((id) => ids.indexOf(id) === -1)
      if (this.hiddenObjects.length === 0) window.__viewer.applyFilter(null)
      else
        window.__viewer.applyFilter({
          filterBy: { id: { not: this.hiddenObjects } },
          ghostOthers: false
        })
      if (this.isolatedObjects.length !== 0 || this.hiddenObjects.length !== 0)
        this.showVisReset = true
      else this.showVisReset = false
    })
    this.$eventHub.$on('isolate-objects', (ids) => {
      this.hiddenObjects = []
      this.isolatedObjects = [...new Set([...this.isolatedObjects, ...ids])]
      window.__viewer.applyFilter({
        filterBy: { id: this.isolatedObjects },
        ghostOthers: true
      })
      if (this.isolatedObjects.length !== 0 || this.hiddenObjects.length !== 0)
        this.showVisReset = true
      else this.showVisReset = false
    })
    this.$eventHub.$on('unisolate-objects', (ids) => {
      this.isolatedObjects = this.isolatedObjects.filter((id) => ids.indexOf(id) === -1)
      if (this.isolatedObjects.length === 0) {
        this.$eventHub.$emit('filter-reset')
        this.showVisReset = false
        return window.__viewer.applyFilter(null)
      }
      window.__viewer.applyFilter({
        filterBy: { id: this.isolatedObjects },
        ghostOthers: true
      })

      this.showVisReset = true
    })
  },
  methods: {
    test() {
      console.log('test')
    },
    test2() {
      console.log('test 2')
    },
    async loadModel() {
      this.calls++
      if (this.calls !== 2) return
      console.log('load start')
      await window.__viewer.loadObject(
        `${window.location.origin}/streams/${this.stream.id}/objects/${this.stream.commit.referencedObject}`
      )
      window.__viewer.zoomExtents(undefined, false)
      this.loadedModel = true
      console.log('load end')
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
