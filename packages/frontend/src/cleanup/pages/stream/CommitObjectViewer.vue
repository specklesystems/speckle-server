<template>
  <div>
    <div v-if="(isMultiple || isCommit || isObject) && !singleResourceError">
      <commit-toolbar
        v-if="isCommit"
        :stream="resources[0].data"
        @edit-commit="showCommitEditDialog = true"
      />
      <object-toolbar v-if="isObject" :stream="resources[0].data" />
      <multiple-resources-toolbar
        v-if="isMultiple"
        :stream="{ name: resources[0].data.name, id: $route.params.streamId }"
        :resources="resources"
      />

      <portal to="nav">
        <v-list nav dense class="mt-0 pt-0">
          <v-list-item
            v-if="isCommit"
            link
            :to="`/streams/${$route.params.streamId}/branches/${resources[0].data.commit.branchName}`"
            class=""
          >
            <v-list-item-icon>
              <v-icon small class>mdi-arrow-left-drop-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="font-weight-bold">
                <v-icon small class="mr-1 caption">mdi-source-branch</v-icon>
                {{ resources[0].data.commit.branchName }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            v-if="isObject || isMultiple"
            link
            exact
            :to="`/streams/${$route.params.streamId}`"
            class=""
          >
            <v-list-item-icon>
              <v-icon small class>mdi-arrow-left-drop-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="font-weight-bold">
                <v-icon small class="mr-1 caption">mdi-home</v-icon>
                Stream Home
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <!-- Loaded resources  -->
        <resource-group
          :resources="resources"
          @remove="removeResource"
          @add-resource="addResource"
          @show-add-overlay="showAddOverlay = true"
        />

        <!-- <v-divider v-if="isMultiple" class="my-4" /> -->

        <!-- Views display -->
        <views-display v-if="views.length !== 0" :views="views" class="mt-4" />

        <!-- Filters display -->
        <filters
          class="mt-4"
          :props="objectProperties"
          :source-application="
            resources
              .filter((r) => r.type === 'commit')
              .map((r) => r.data.commit.sourceApplication)
              .join(',')
          "
        />
      </portal>

      <!-- Preview image -->
      <v-fade-transition>
        <preview-image
          v-if="!loadedModel && (isCommit || isObject)"
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
          :url="`/preview/${$route.params.streamId}/objects/${
            isCommit ? resources[0].data.commit.referencedObject : resources[0].data.object.id
          }`"
        ></preview-image>
      </v-fade-transition>

      <div style="height: 100vh; width: 100%; top: -64px; left: 0px; position: absolute">
        <viewer @load-progress="captureProgress" @selection="captureSelect" />
      </div>

      <div
        style="
          height: 100vh;
          width: 100%;
          top: -64px;
          left: 22px;
          position: absolute;
          z-index: 10;
          pointer-events: none;
        "
      >
        <object-selection
          v-show="selectionData.length !== 0"
          :key="'one'"
          :objects="selectionData"
          :stream-id="$route.params.streamId"
          @clear-selection="selectionData = []"
        />
      </div>

      <!-- Viewer controls -->
      <div
        :style="`width: 100%; bottom: 12px; left: 0px; position: ${
          $isMobile() ? 'fixed' : 'absolute'
        }; z-index: 100`"
        :class="`d-flex justify-center`"
      >
        <viewer-controls @show-add-overlay="showAddOverlay = true" />
      </div>

      <!-- Progress bar -->
      <div v-if="!loadedModel" style="width: 20%; top: 45%; left: 40%; position: absolute">
        <v-progress-linear
          v-model="loadProgress"
          :indeterminate="loadProgress >= 99 && !loadedModel"
          color="primary"
        ></v-progress-linear>
      </div>
      <div
        v-show="viewerBusy && loadedModel"
        class="pl-2 pb-2"
        style="width: 100%; bottom: 12px; left: 0; position: absolute; z-index: 10000000"
      >
        <v-progress-circular
          :size="20"
          indeterminate
          color="primary"
          class="mr-2"
        ></v-progress-circular>
      </div>
    </div>

    <div v-else-if="singleResourceError">
      <error-placeholder error-type="404">
        <h2>
          <code>{{ $route.params.resourceId }}</code>
          not found.
        </h2>
      </error-placeholder>
    </div>
    <v-dialog
      v-model="showAddOverlay"
      width="800"
      :fullscreen="$vuetify.breakpoint.smAndDown"
      style="z-index: 10000"
    >
      <stream-overlay-viewer
        :stream-id="$route.params.streamId"
        @add-resource="addResource"
        @close="showAddOverlay = false"
      />
    </v-dialog>
    <v-dialog
      v-if="isCommit"
      v-model="showCommitEditDialog"
      width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
    >
      <commit-edit :stream="resources[0].data" @close="showCommitEditDialog = false" />
    </v-dialog>
  </div>
</template>
<script>
import debounce from 'lodash.debounce'
import streamCommitQuery from '@/graphql/commit.gql'
import streamObjectQuery from '@/graphql/objectSingleNoData.gql'
import Viewer from '@/cleanup/components/common/Viewer' // do not import async

export default {
  components: {
    Viewer,
    CommitToolbar: () => import('@/cleanup/toolbars/CommitToolbar'),
    ObjectToolbar: () => import('@/cleanup/toolbars/ObjectToolbar'),
    MultipleResourcesToolbar: () => import('@/cleanup/toolbars/MultipleResourcesToolbar'),
    CommitEdit: () => import('@/cleanup/dialogs/CommitEdit'),
    StreamOverlayViewer: () => import('@/cleanup/components/viewer/dialogs/AddOverlay'),
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder'),
    PreviewImage: () => import('@/cleanup/components/common/PreviewImage'),
    ViewerControls: () => import('@/cleanup/components/viewer/ViewerControls'),
    ObjectSelection: () => import('@/cleanup/components/viewer/ObjectSelection'),
    ResourceGroup: () => import('@/cleanup/components/viewer/ResourceGroup'),
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
    showVisReset: false,
    resourceType: null,
    resources: [],
    showAddOverlay: false,
    viewerBusy: false
  }),
  computed: {
    isCommit() {
      if (this.resources.length === 0) return false
      if (this.resources.length === 1 && this.resources[0].type === 'commit') return true
      return false
    },
    isObject() {
      if (this.resources.length === 0) return false
      if (this.resources.length === 1 && this.resources[0].type === 'object') return true
      return false
    },
    isMultiple() {
      if (this.resources.length === 0) return false
      if (this.resources.length > 1) return true
      return false
    },
    singleResourceError() {
      return this.resources.length === 1 && this.resources[0].data.error
    }
  },
  watch: {
    stream(val) {
      if (!val) return
      if (val && val.commit && val.commit.branchName && val.commit.branchName === 'globals') {
        this.$router.push(`/streams/${this.$route.params.streamId}/globals/${val.commit.id}`)
        return
      }
    },
    '$store.state.appliedFilter'(val) {
      if (!val) {
        let fullQuery = { ...this.$route.query }
        delete fullQuery.filter
        this.$router.replace({
          path: this.$route.path,
          query: { ...fullQuery }
        })
        return
      }
      let fullQuery = { ...this.$route.query }
      delete fullQuery.filter
      this.$router
        .replace({
          path: this.$route.path,
          query: { ...fullQuery, filter: JSON.stringify(val) }
        })
        .catch(() => {})
    }
  },
  async mounted() {
    this.$eventHub.$emit('page-load', true)
    this.resources.push({
      type: this.$route.params.resourceId.length === 10 ? 'commit' : 'object',
      id: this.$route.params.resourceId,
      data:
        this.$route.params.resourceId.length === 10
          ? await this.loadCommit(this.$route.params.resourceId)
          : await this.loadObject(this.$route.params.resourceId)
    })

    if (this.$route.query.overlay) {
      let ids = this.$route.query.overlay.split(',')
      for (const id of ids) {
        let cleanedId = id.replace(/\s+/g, '')
        if (!cleanedId || cleanedId === '') continue
        this.resources.push({
          type: id.length === 10 ? 'commit' : 'object',
          id: cleanedId,
          data:
            cleanedId.length === 10
              ? await this.loadCommit(cleanedId)
              : await this.loadObject(cleanedId)
        })
      }
    }

    if (
      this.resources.length === 1 &&
      this.resources[0].type === 'commit' &&
      this.resources[0].data.commit.branchName === 'globals'
    ) {
      this.$router.push(
        `/streams/${this.$route.params.streamId}/globals/${this.resources[0].data.commit.id}`
      )
      return
    }

    this.$eventHub.$emit('page-load', false)
    this.firstCallToCam = true
    this.camToSet = null
    this.filterToSet = null

    if (this.$route.query && this.$route.query.c) {
      this.camToSet = JSON.parse(this.$route.query.c)
    }

    if (this.$route.query && this.$route.query.filter) {
      this.filterToSet = JSON.parse(this.$route.query.filter)
    }

    setTimeout(() => {
      for (const resource of this.resources) {
        if (resource.data.error) continue
        this.loadModel(
          resource.type === 'commit'
            ? resource.data.commit.referencedObject
            : resource.data.object.id
        )
      }
      window.__viewer.on('busy', (val) => {
        this.viewerBusy = val
        if (!val && this.camToSet) {
          setTimeout(() => {
            if (this.camToSet[6] === 1) {
              window.__viewer.toggleCameraProjection()
            }
            window.__viewer.interactions.setLookAt(
              { x: this.camToSet[0], y: this.camToSet[1], z: this.camToSet[2] }, // position
              { x: this.camToSet[3], y: this.camToSet[4], z: this.camToSet[5] } // target
            )
            if (this.camToSet[6] === 1) {
              window.__viewer.cameraHandler.activeCam.controls.zoom(this.camToSet[7], true)
            }
            this.camToSet = null
          }, 200)
        }

        if (!val && this.filterToSet) {
          setTimeout(() => {
            this.$store.commit('setFilterDirect', { filter: this.filterToSet })
            this.filterToSet = null
          }, 200)
        }
      })

      window.__viewer.cameraHandler.controls.addEventListener(
        'rest',
        debounce(() => {
          if (this.firstCallToCam) {
            this.firstCallToCam = false
            return
          }
          if (this.camToSet) return
          let controls = window.__viewer.cameraHandler.activeCam.controls
          let pos = controls.getPosition()
          let target = controls.getTarget()
          let c = [
            parseFloat(pos.x.toFixed(5)),
            parseFloat(pos.y.toFixed(5)),
            parseFloat(pos.z.toFixed(5)),
            parseFloat(target.x.toFixed(5)),
            parseFloat(target.y.toFixed(5)),
            parseFloat(target.z.toFixed(5)),
            window.__viewer.cameraHandler.activeCam.name === 'ortho' ? 1 : 0,
            controls._zoom
          ]
          let fullQuery = { ...this.$route.query }
          delete fullQuery.c
          this.$router
            .replace({
              path: this.$route.path,
              query: { ...fullQuery, c: JSON.stringify(c) }
            })
            .catch(() => {})
        }, 1000)
      )
    }, 300)
  },
  methods: {
    async loadCommit(id) {
      try {
        let res = await this.$apollo.query({
          query: streamCommitQuery,
          variables: { streamId: this.$route.params.streamId, id: id }
        })
        if (res.data.stream.commit === null) throw new Error()
        return res.data.stream
      } catch (e) {
        this.$eventHub.$emit('notification', { text: `Failed to load commit ${id}` })
        return { error: true, message: `Failed to load commit ${id}` }
      }
    },
    async loadObject(id) {
      try {
        let res = await this.$apollo.query({
          query: streamObjectQuery,
          variables: { streamId: this.$route.params.streamId, id: id }
        })
        if (res.data.stream.object === null) throw new Error()
        return res.data.stream
      } catch (e) {
        this.$eventHub.$emit('notification', { text: `Failed to load object ${id}` })
        return { error: true, message: `Failed to load object ${id}` }
      }
    },
    async loadModel(objectId) {
      if (!window.__viewer) {
        this.$eventHub.$emit('notification', {
          text: 'Error in rendering page (no __viewer found). Please refresh.'
        })
      }
      await window.__viewer.loadObject(
        `${window.location.origin}/streams/${this.$route.params.streamId}/objects/${objectId}`
      )
      window.__viewer.zoomExtents(undefined, true)
      this.loadedModel = true
      this.setFilters()
      this.setViews()
    },
    async addResource(resId) {
      this.showAddOverlay = false
      let existing = this.resources.findIndex((res) => res.id === resId)
      if (existing !== -1) {
        this.$eventHub.$emit('notification', {
          text: `${resId.length === 10 ? 'Commit' : 'Object'} is already loaded.`
        })
        return
      }
      let resource = {
        type: resId.length === 10 ? 'commit' : 'object',
        id: resId,
        data: resId.length === 10 ? await this.loadCommit(resId) : await this.loadObject(resId)
      }
      this.resources.push(resource)

      // TODO add to url
      let fullQuery = { ...this.$route.query }
      delete fullQuery.overlay
      if (this.$route.query.overlay) {
        let arr = this.$route.query.overlay
          .split(',')
          .map((id) => id.replace(/\s+/g, ''))
          .filter((id) => id && id !== '' && id !== resource.id)
        arr.push(resId)
        this.$router.replace({
          path: this.$route.path,
          query: { overlay: arr.join(','), ...fullQuery }
        })
      } else {
        this.$router.replace({
          path: this.$route.path,
          query: { overlay: resId, ...fullQuery }
        })
      }

      this.loadModel(
        resource.type === 'commit' ? resource.data.commit.referencedObject : resource.data.object.id
      )
    },
    async removeResource(resource) {
      let index = this.resources.findIndex((res) => resource.id === res.id)

      if (index === -1) return // err

      if (!resource.data.error) {
        let url = `${window.location.origin}/streams/${resource.data.id}/objects/${
          resource.type === 'commit'
            ? resource.data.commit.referencedObject
            : resource.data.object.id
        }`

        await window.__viewer.unloadObject(url)
        window.__viewer.zoomExtents(undefined, true)
      }
      this.resources.splice(index, 1)
      this.setFilters()
      this.setViews()
      if (this.$route.query.overlay) {
        let arr = this.$route.query.overlay
          .split(',')
          .map((id) => id.replace(/\s+/g, ''))
          .filter((id) => id && id !== '' && id !== resource.id)

        let fullQuery = { ...this.$route.query }
        delete fullQuery.overlay
        if (arr.length !== 0)
          this.$router.replace({
            path: this.$route.path,
            query: { overlay: arr.join(','), ...fullQuery }
          })
        else
          this.$router.replace({
            path: this.$route.path,
            query: { ...fullQuery }
          })
      }
    },
    setViews() {
      this.views.splice(0, this.views.length)
      this.views.push(...window.__viewer.sceneManager.views)
    },
    async setFilters() {
      try {
        // repopulate object props
        this.objectProperties = await window.__viewer.getObjectsProperties()
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: 'Failed to get object properties from viewer.'
        })
      }
    },
    captureProgress(args) {
      this.loadProgress = args.progress * 100
    },
    captureSelect(selectionData) {
      this.selectionData.splice(0, this.selectionData.length)
      this.selectionData.push(...selectionData)
    }
  }
}
</script>
