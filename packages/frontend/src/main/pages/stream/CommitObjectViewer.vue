<template>
  <div class="commit-object-viewer">
    <div
      v-if="
        firstResource && (isMultiple || isCommit || isObject) && !singleResourceError
      "
    >
      <multiple-resources-toolbar
        v-if="isMultiple && isNotErrorResource(firstResource)"
        :stream="{ name: firstResource.data.name, id: streamId }"
        :resources="resources"
      />
      <commit-toolbar
        v-else-if="isCommitResource(firstResource)"
        :stream="firstResource.data"
        @edit-commit="showCommitEditDialog = true"
      />
      <object-toolbar
        v-else-if="isObjectResource(firstResource)"
        :stream="firstResource.data"
      />
      <prioritized-portal to="nav" identity="stream-commit-viewer" :priority="2">
        <commit-object-viewer-scope
          :stream-id="streamId"
          :resource-id="resourceId"
          :is-embed="isEmbed"
        >
          <template v-if="!isEmbed">
            <div v-if="!$loggedIn()" class="px-4 my-2">
              <v-btn small block color="primary" @click="$loginAndSetRedirect()">
                Sign In
              </v-btn>
            </div>
            <v-list nav dense class="mt-0 pt-0">
              <v-list-item
                v-if="!isMultiple && isCommitResource(firstResource)"
                link
                :to="`/streams/${streamId}/branches/${formatBranchNameForURL(
                  firstResource.data.commit?.branchName || ''
                )}`"
                class=""
              >
                <v-list-item-icon>
                  <v-icon small class>mdi-arrow-left-drop-circle</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">
                    <v-icon small class="mr-1 caption">mdi-source-branch</v-icon>
                    {{ firstResource.data.commit?.branchName }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item
                v-if="isObject || isMultiple"
                link
                exact
                :to="`/streams/${streamId}`"
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
          </template>

          <!-- Loaded resources  -->
          <resource-group
            :resources="resources"
            :allow-add="!isEmbed"
            @remove="removeResource"
            @add-resource="addResource"
            @show-add-overlay="showAddOverlay = true"
          />

          <!-- <v-divider v-if="isMultiple" class="my-4" /> -->
          <portal-target name="comments"></portal-target>
          <!-- Views display -->
          <views-display v-if="views.length !== 0" :views="views" class="mt-4" />

          <!-- Filters display -->
          <viewer-filters
            class="mt-4"
            :source-application="
              resources
                .filter(isCommitResource)
                .map((r) => r.data.commit?.sourceApplication)
                .join(',')
            "
          />
        </commit-object-viewer-scope>
      </prioritized-portal>

      <!-- Preview image -->
      <v-fade-transition>
        <preview-image
          v-if="
            !loadedModel &&
            !isMultiple &&
            (isCommitResource(firstResource) || isObjectResource(firstResource))
          "
          :style="`
            height: 100vh;
            width: 100%;
            ${topOffsetStyle}
            left: 0px;
            position: absolute;
            opacity: 0.7;
            filter: blur(4px);
          `"
          :height="420"
          :url="`/preview/${streamId}/objects/${
            isCommitResource(firstResource)
              ? firstResource.data.commit?.referencedObject
              : firstResource.data.object?.id
          }`"
        ></preview-image>
      </v-fade-transition>

      <div
        id="renderParent"
        ref="renderParent"
        :style="`height: 100vh; width: 100%; ${topOffsetStyle} left: 0px; position: absolute`"
      >
        <speckle-viewer :no-scroll="noScroll" @load-progress="captureProgress" />
      </div>

      <div
        :style="`
          height: 100vh;
          width: 100%;
          ${topOffsetStyle}
          left: 22px;
          position: absolute;
          z-index: 10;
          pointer-events: none;`"
      >
        <object-selection
          v-show="viewerState.selectedObjects.length !== 0 && !hideSelectionInfo"
          :key="'one'"
          :stream-id="streamId"
        />
      </div>

      <!-- Viewer controls -->
      <div
        :style="`width: 100%; bottom: 12px; left: 0px; position: ${
          $isMobile() ? 'fixed' : 'absolute'
        }; z-index: 20`"
        :class="`d-flex justify-center no-mouse`"
      >
        <viewer-controls
          v-show="!hideControls"
          class="mouse"
          @show-add-overlay="showAddOverlay = true"
        />
      </div>
      <div
        :style="`
          height: 100vh;
          width: 100%;
          ${topOffsetStyle}
          left: 0;
          position: absolute;
          z-index: 4;
          pointer-events: none;
          overflow: none;
        `"
        class=""
      >
        <viewer-bubbles v-if="!isEmbed" key="a" />
        <comments-overlay
          key="c"
          :model-loaded="loadedModel"
          @add-resources="addResources"
        />
        <comment-add-overlay v-if="!isEmbed" key="b" />
      </div>

      <!--
      Note: portaling out the mobile view of comment threads because of
      stacking chaos caused by transforms, etc. in positioning from the default
      view.
      -->
      <portal-target name="mobile-comment-thread"></portal-target>

      <!-- Progress bar -->
      <div
        v-if="!loadedModel"
        style="width: 20%; top: 45%; left: 40%; position: absolute"
      >
        <v-progress-linear
          v-model="loadProgress"
          :indeterminate="loadProgress >= 99 && !loadedModel"
          color="primary"
        ></v-progress-linear>
      </div>
      <div
        v-show="viewerBusy && loadedModel"
        class="pl-2 pb-2"
        style="
          width: 100%;
          bottom: 12px;
          left: 0;
          position: absolute;
          z-index: 10000000;
        "
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
          <code>{{ resourceId }}</code>
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
        :stream-id="streamId"
        @add-resource="addResource"
        @close="showAddOverlay = false"
      />
    </v-dialog>
    <v-dialog
      v-if="!isMultiple && firstResource && isCommitResource(firstResource)"
      v-model="showCommitEditDialog"
      width="500"
      :fullscreen="$vuetify.breakpoint.smAndDown"
    >
      <commit-edit :stream="firstResource.data" @close="showCommitEditDialog = false" />
    </v-dialog>
  </div>
</template>
<script lang="ts">
import * as THREE from 'three'
import { computed, defineComponent, toRefs } from 'vue'
import debounce from 'lodash/debounce'
import streamCommitQuery from '@/graphql/commit.gql'
import streamObjectQuery from '@/graphql/objectSingleNoData.gql'
import SpeckleViewer from '@/main/components/common/SpeckleViewer.vue' // do not import async
import {
  Filter,
  setFilterDirectly,
  setIsViewerBusy,
  setupCommitObjectViewer,
  loadObjectProperties,
  getLocalFilterState
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { PropertyInfo } from '@speckle/viewer'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import {
  StreamCommitQueryQuery,
  StreamObjectNoDataQuery
} from '@/graphql/generated/graphql'
import type { Get } from 'type-fest'
import { has } from 'lodash'
import { Nullable } from '@/helpers/typeHelpers'
import { getCamArray } from '@/main/lib/viewer/core/helpers/cameraHelper'
import CommitObjectViewerScope from '@/main/components/viewer/CommitObjectViewerScope.vue'
import PrioritizedPortal from '@/main/components/common/utility/PrioritizedPortal.vue'
import { ViewerEvent } from '@speckle/viewer'
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

type ErroredResourceData = {
  error: boolean
  message: string
}

type CommitResourceData = NonNullable<Get<StreamCommitQueryQuery, 'stream'>>

type ObjectResourceData = NonNullable<Get<StreamObjectNoDataQuery, 'stream'>>

type NonErrorDataTypes = CommitResourceData | ObjectResourceData

type AllSupportedDataTypes = ErroredResourceData | NonErrorDataTypes

type ResourceTypeValue = 'commit' | 'object'

type ResourceObjectType<T> = {
  type: ResourceTypeValue
  id: string
  data: T
}

const isErrorResource = (
  resource: ResourceObjectType<unknown>
): resource is ResourceObjectType<ErroredResourceData> => has(resource.data, 'error')

const isNotErrorResource = (
  resource: ResourceObjectType<unknown>
): resource is ResourceObjectType<NonErrorDataTypes> => !isErrorResource(resource)

const isCommitResource = (
  resource: ResourceObjectType<unknown>
): resource is ResourceObjectType<CommitResourceData> => resource.type === 'commit'

const isObjectResource = (
  resource: ResourceObjectType<unknown>
): resource is ResourceObjectType<ObjectResourceData> => resource.type === 'object'

export default defineComponent({
  name: 'CommitObjectViewer',
  components: {
    SpeckleViewer,
    CommitObjectViewerScope,
    PrioritizedPortal,
    CommitToolbar: () => import('@/main/toolbars/CommitToolbar.vue'),
    ObjectToolbar: () => import('@/main/toolbars/ObjectToolbar.vue'),
    MultipleResourcesToolbar: () =>
      import('@/main/toolbars/MultipleResourcesToolbar.vue'),
    CommitEdit: () => import('@/main/dialogs/CommitEdit.vue'),
    StreamOverlayViewer: () =>
      import('@/main/components/viewer/dialogs/StreamOverlayViewer.vue'),
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder.vue'),
    PreviewImage: () => import('@/main/components/common/PreviewImage.vue'),
    ViewerControls: () => import('@/main/components/viewer/ViewerControls.vue'),
    ObjectSelection: () => import('@/main/components/viewer/ObjectSelection.vue'),
    ResourceGroup: () => import('@/main/components/viewer/ResourceGroup.vue'),
    ViewsDisplay: () => import('@/main/components/viewer/ViewsDisplay.vue'),
    ViewerFilters: () => import('@/main/components/viewer/ViewerFilters.vue'),
    // ViewerFiltersLegacy: () =>
    //   import('@/main/components/viewer/ViewerFilters-Legacy.vue'),
    ViewerBubbles: () => import('@/main/components/viewer/ViewerBubbles.vue'),
    CommentAddOverlay: () => import('@/main/components/viewer/CommentAddOverlay.vue'),
    CommentsOverlay: () => import('@/main/components/viewer/CommentsOverlay.vue')
  },
  props: {
    streamId: {
      type: String,
      required: true
    },
    /**
     * Commit or Object ID
     */
    resourceId: {
      type: String,
      required: true
    },
    isEmbed: {
      type: Boolean,
      default: false
    },
    hideControls: {
      type: Boolean,
      default: false
    },
    hideSelectionInfo: {
      type: Boolean,
      default: false
    },
    noScroll: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { viewer } = setupCommitObjectViewer(toRefs(props))
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          selectedCommentMetaData {
            id
            selectionLocation
          }
          selectedObjects
          currentFilterState
          sectionBox
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    return {
      viewer,
      viewerState,
      isCommitResource,
      isObjectResource,
      isErrorResource,
      isNotErrorResource,
      formatBranchNameForURL
    }
  },
  data: () => ({
    firstCallToCam: false,
    camToSet: null as Nullable<number[]>,
    filterToSet: null as Nullable<Filter>,
    loadedModel: false,
    loadProgress: 0,
    showCommitEditDialog: false,
    views: [] as Record<string, unknown>[],
    objectProperties: null as Nullable<PropertyInfo[]>,
    resources: [] as ResourceObjectType<AllSupportedDataTypes>[],
    showAddOverlay: false,
    viewerBusy: false
  }),
  computed: {
    topOffsetStyle(): string {
      if (this.isEmbed) return 'top: 0;'
      return !this.$vuetify.breakpoint.smAndDown ? 'top: -64px;' : 'top: -56px;'
    },
    isCommit(): boolean {
      if (this.isMultiple) return false
      return this.firstResource?.type === 'commit'
    },
    isObject(): boolean {
      if (this.isMultiple) return false
      return this.firstResource?.type === 'object'
    },
    isMultiple(): boolean {
      if (this.resources.length === 0) return false
      if (this.resources.length > 1) return true
      return false
    },
    firstResource(): Nullable<ResourceObjectType<AllSupportedDataTypes>> {
      return this.resources[0] || null
    },
    singleResourceError(): boolean {
      if (this.resources.length !== 1) return false
      const resource = this.resources[0]
      if (!isErrorResource(resource)) return false
      return resource.data.error
    },
    overlay(): Nullable<string> {
      return this.$route.query.overlay ? (this.$route.query.overlay as string) : null
    }
  },
  watch: {
    'viewerState.currentFilterState'(newVal, oldVal) {
      if (!newVal && !oldVal) return
      this.updateUrl()
    }
  },
  async mounted() {
    this.$eventHub.$emit('page-load', true)
    this.resources.push({
      type: this.resolveResourceType(this.resourceId),
      id: this.resourceId,
      data:
        this.resolveResourceType(this.resourceId) === 'commit'
          ? await this.loadCommit(this.resourceId)
          : await this.loadObject(this.resourceId)
    })

    if (this.overlay) {
      const ids = this.overlay.split(',')
      for (const id of ids) {
        const cleanedId = id.replace(/\s+/g, '')
        if (!cleanedId || cleanedId === '') continue
        const resType = this.resolveResourceType(cleanedId)
        this.resources.push({
          type: resType,
          id: cleanedId,
          data:
            resType === 'commit'
              ? await this.loadCommit(cleanedId)
              : await this.loadObject(cleanedId)
        })
      }
    }

    // If global variables commit, redirect to globals editor page
    if (
      !this.isEmbed &&
      this.resources.length === 1 &&
      isCommitResource(this.resources[0]) &&
      this.resources[0].data.commit?.branchName === 'globals'
    ) {
      this.$router.push(
        `/streams/${this.streamId}/globals/${this.resources[0].data.commit.id}`
      )
      return
    }

    this.$eventHub.$emit('page-load', false)
    this.firstCallToCam = true
    this.camToSet = null
    this.filterToSet = null

    if (this.$route.query?.c) {
      this.camToSet = JSON.parse(this.$route.query.c as string)
    }

    if (this.$route.query?.filter) {
      this.filterToSet = JSON.parse(this.$route.query.filter as string)
    }

    setTimeout(() => {
      for (const resource of this.resources) {
        if (isErrorResource(resource)) continue

        let modelId: string | undefined = undefined
        if (isCommitResource(resource)) {
          modelId = resource.data.commit?.referencedObject
        } else if (isObjectResource(resource)) {
          modelId = resource.data.object?.id
        }

        if (modelId) {
          this.loadModel(modelId)
        }
      }

      this.viewer.on(
        ViewerEvent.SectionBoxChanged,
        debounce(() => {
          this.updateUrl()
        }, 1000)
      )

      this.viewer.on(ViewerEvent.Busy, (val: boolean) => {
        setIsViewerBusy(!!val)
        this.viewerBusy = val
        if (!val && this.camToSet) {
          setTimeout(() => {
            if (!this.camToSet) return

            this.viewer.setView({
              position: new THREE.Vector3(
                this.camToSet[0],
                this.camToSet[1],
                this.camToSet[2]
              ),
              target: new THREE.Vector3(
                this.camToSet[3],
                this.camToSet[4],
                this.camToSet[5]
              )
            })

            // NOTE: disabled because ortho camera is not working with comment bubbles intersections properly
            // if (this.camToSet[6] === 1) {
            // this.viewer.cameraHandler.activeCam.controls.zoom(this.camToSet[7], true)
            // }
            this.camToSet = null
          }, 200)
        }

        if (!val && this.filterToSet) {
          setTimeout(() => {
            if (!this.filterToSet) return

            setFilterDirectly({ filter: this.filterToSet })
            this.filterToSet = null
          }, 200)
        }
      })

      this.viewer.cameraHandler.controls.addEventListener(
        'rest',
        debounce(() => {
          if (this.isEmbed) return
          if (!(this.$route.name === 'commit' || this.$route.name === 'object')) {
            return
          }
          if (this.firstCallToCam) {
            this.firstCallToCam = false
            return
          }
          if (this.camToSet) return
          if (this.viewerState.selectedCommentMetaData) {
            return
          }

          const c = getCamArray(this.viewer)
          const fullQuery = { ...this.$route.query }
          delete fullQuery.c
          delete fullQuery.cId
          this.$router
            .replace({
              path: this.$route.path,
              query: { ...fullQuery, c: JSON.stringify(c) }
            })
            .catch(() => {})
        }, 1000)
      )

      this.$emit('models-loaded')
    }, 300)
  },
  methods: {
    updateUrl() {
      if (this.isEmbed) return

      if (this.viewerState.selectedCommentMetaData) {
        this.$router
          .replace({
            path: this.$route.path,
            query: { cId: this.viewerState.selectedCommentMetaData.id }
          })
          .catch(() => {})
        return
      }

      // TODO: remove comment if there's no selected comment

      const hasSectionBox = this.viewerState.sectionBox !== null
      const hasFilters = this.viewerState.currentFilterState !== null
      const hasComment = this.viewerState.selectedCommentMetaData !== null

      if (!hasSectionBox && !hasFilters) {
        const fullQuery = { ...this.$route.query }
        delete fullQuery.filter
        if (!hasComment) delete fullQuery.cId
        this.$router.replace({
          path: this.$route.path,
          query: { ...fullQuery }
        })
        return
      }
      const fullQuery = { ...this.$route.query }
      delete fullQuery.filter
      if (!hasComment) delete fullQuery.cId
      this.$router
        .replace({
          path: this.$route.path,
          query: { ...fullQuery, filter: JSON.stringify(getLocalFilterState()) }
        })
        .catch(() => {})
    },
    resolveResourceType(resourceId: string): ResourceTypeValue {
      return resourceId.length === 10 ? 'commit' : 'object'
    },
    async loadCommit(id: string) {
      try {
        const res = await this.$apollo.query({
          query: streamCommitQuery,
          variables: { streamId: this.streamId, id }
        })
        if (res.data.stream.commit === null) throw new Error()
        return res.data.stream
      } catch (e) {
        this.$eventHub.$emit('notification', { text: `Failed to load commit ${id}` })
        return { error: true, message: `Failed to load commit ${id}` }
      }
    },
    async loadObject(id: string) {
      try {
        const res = await this.$apollo.query({
          query: streamObjectQuery,
          variables: { streamId: this.streamId, id }
        })
        if (res.data.stream.object === null) throw new Error()
        return res.data.stream
      } catch (e) {
        this.$eventHub.$emit('notification', { text: `Failed to load object ${id}` })
        return { error: true, message: `Failed to load object ${id}` }
      }
    },
    async loadModel(objectId: string) {
      await this.viewer.loadObject(
        `${window.location.origin}/streams/${this.streamId}/objects/${objectId}`
      )
      this.viewer.zoom(undefined, undefined, true)

      this.loadedModel = true
      this.setFilters()
      this.setViews()
    },
    async addResources(ids: string[]) {
      for (const id of ids) {
        await this.addResource(id)
      }
    },
    async addResource(resId: string) {
      this.showAddOverlay = false
      const resType = this.resolveResourceType(resId)
      const existing = this.resources.findIndex((res) => res.id === resId)

      if (existing !== -1) {
        this.$eventHub.$emit('notification', {
          text: `${
            resType.charAt(0).toUpperCase() + resType.slice(1)
          } is already loaded.`
        })
        return
      }
      const resource = {
        type: resType,
        id: resId,
        data:
          resType === 'commit'
            ? await this.loadCommit(resId)
            : await this.loadObject(resId)
      }
      this.resources.push(resource)
      this.$mixpanel.track('Viewer Action', {
        type: 'action',
        name: 'add',
        resourceType: resource.type
      })
      // TODO add to url
      const fullQuery = { ...this.$route.query }
      delete fullQuery.overlay
      if (this.overlay) {
        const arr = this.overlay
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
        resource.type === 'commit'
          ? resource.data.commit.referencedObject
          : resource.data.object.id
      )
    },
    async removeResource(resource: ResourceObjectType<AllSupportedDataTypes>) {
      const index = this.resources.findIndex((res) => resource.id === res.id)
      if (index === -1) return // err

      if (
        !isErrorResource(resource) &&
        (isCommitResource(resource) || isObjectResource(resource))
      ) {
        const url = `${window.location.origin}/streams/${resource.data.id}/objects/${
          isCommitResource(resource)
            ? resource.data.commit?.referencedObject
            : resource.data.object?.id
        }`

        this.$mixpanel.track('Viewer Action', {
          type: 'action',
          name: 'remove',
          resourceType: resource.type
        })

        await this.viewer.unloadObject(url)
        this.viewer.zoom(undefined, undefined, true)
      }
      this.resources.splice(index, 1)
      this.setFilters()
      this.setViews()
      if (this.overlay) {
        const arr = this.overlay
          .split(',')
          .map((id) => id.replace(/\s+/g, ''))
          .filter((id) => id && id !== '' && id !== resource.id)

        const fullQuery = { ...this.$route.query }
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
      this.views.push(...this.viewer.getViews())
    },
    async setFilters() {
      try {
        // repopulate object props
        loadObjectProperties()
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: 'Failed to get object properties from viewer.'
        })
      }
    },
    captureProgress(args: { progress: number }) {
      this.loadProgress = args.progress * 100
    }
  }
})
</script>
