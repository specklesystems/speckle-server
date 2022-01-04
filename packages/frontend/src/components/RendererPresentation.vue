<template lang="html">

  <v-sheet style="height: 100%; position: relative" class="transparent">


    <v-menu v-if="!embeded" bottom left close-on-click offset-y>
      <template #activator="{ on: onMenu, attrs: menuAttrs }">
        <v-tooltip left color="primary">
          <template #activator="{ on: onTooltip, attrs: tooltipAttrs }">
            <v-btn
              style="position: absolute; bottom: 1em; right: 1em; z-index: 3"
              color="primary"
              fab
              x-small
              v-bind="{ ...tooltipAttrs, ...menuAttrs }"
              v-on="{ ...onTooltip, ...onMenu }"
            >
              <v-icon small>mdi-share-variant</v-icon>
            </v-btn>
          </template>
          Embed 3D Viewer
        </v-tooltip>
      </template>
      <v-list dense>
        <v-list-item @click="copyIFrame">
          <v-list-item-title>Copy iframe</v-list-item-title>
        </v-list-item>
        <v-list-item @click="copyEmbedUrl">
          <v-list-item-title>Copy URL</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-alert
      v-show="showAlert"
      text
      type="warning"
      dismissible
      dense
      style="position: absolute; z-index: 20; width: 100%"
      class="caption"
    >
      {{ alertMessage }}
    </v-alert>
    <div
      id="rendererparent"
      ref="rendererparent"
      :class="`${fullScreen ? 'fullscreen' : ''} ${darkMode ? 'dark' : ''}` "
      style="position: absolute; "
      :style= "[ (maximized&& loadProgress==100 && allLoaded ==1) ? {'padding-left': '128px'} : {'padding-left': '28px'} ]"
    >
      <v-fade-transition>
        <div v-show="!hasLoadedModel" class="overlay cover-all">
          <transition name="fade">
            <div v-show="hasImg" ref="cover" class="overlay-abs bg-img"></div>
          </transition>
          <div class="overlay-abs radial-bg"></div>
          <div class="overlay-abs" style="pointer-events: none">
            <v-btn
              color="primary"
              class="vertical-center"
              style="pointer-events: all"
              fab
              small
              @click="load()"
            >
              <v-icon>mdi-play-pause</v-icon>
            </v-btn>
          </div>
        </div>
      </v-fade-transition>
      <v-progress-linear
        v-if="hasLoadedModel && loadProgress < 99"
        v-model="loadProgress"
        height="4"
        rounded
        class="vertical-center elevation-10"
        style="position: absolute; width: 80%; left: 10%; opacity: 0.5"
      ></v-progress-linear>

      <v-card
        v-show="hasLoadedModel && loadProgress >= 99 && allLoaded ==1"
        style="position: absolute; bottom: 0px; z-index: 2; width: 100%"
        class="pa-0 text-center transparent elevation-0 pb-3"
      >
        <v-btn-toggle class="elevation-0" style="z-index: 100">
          <v-btn
            v-if="selectedObjects.length !== 0 && (showSelectionHelper || fullScreen)"
            small
            color="primary"
            @click="showObjectDetails = !showObjectDetails"
          >
            <span v-if="!isSmall">Selection Details</span>
            <v-icon v-else small>mdi-cube</v-icon>
            ({{ selectedObjects.length }})
          </v-btn>
          <v-btn
            v-tooltip="`Toggle between perspective or ortho camera.`"
            small
            :color="`${perspectiveMode ? 'blue' : ''}`"
            @click="toggleCamera()"
          >
            <v-icon small>mdi-perspective-less</v-icon>
            <!-- <span class="caption">Perspective</span> -->
          </v-btn>
          <v-menu top close-on-click offset-y style="z-index: 100">
            <template #activator="{ on: onMenu, attrs: menuAttrs }">
              <v-tooltip top>
                <template #activator="{ on: onTooltip, attrs: tooltipAttrs }">
                  <v-btn
                    small
                    v-bind="{ ...tooltipAttrs, ...menuAttrs }"
                    v-on="{ ...onTooltip, ...onMenu }"
                  >
                    <v-icon small>mdi-camera</v-icon>
                  </v-btn>
                </template>
                Select view
              </v-tooltip>
            </template>

            <v-list dense>
              <v-list-item @click="setView('top')">
                <v-list-item-title>Top</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setView('front')">
                <v-list-item-title>Front</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setView('back')">
                <v-list-item-title>Back</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setView('left')">
                <v-list-item-title>Left</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setView('right')">
                <v-list-item-title>Right</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn v-bind="attrs" small v-on="on" @click="zoomEx()">
                <v-icon small>mdi-cube-scan</v-icon>
              </v-btn>
            </template>
            Focus entire model
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn v-bind="attrs" small @click="sectionToggle()" v-on="on">
                <v-icon small>mdi-scissors-cutting</v-icon>
              </v-btn>
            </template>
            Show / Hide Section plane
          </v-tooltip>
          <v-tooltip v-if="!embeded" top>
            <template #activator="{ on, attrs }">
              <v-btn small v-bind="attrs" @click="fullScreen = !fullScreen" v-on="on">
                <v-icon small>{{ fullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
              </v-btn>
            </template>
            Full screen
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn v-bind="attrs" small @click="showHelp = !showHelp" v-on="on">
                <v-icon small>mdi-help</v-icon>
              </v-btn>
            </template>
            Show viewer help
          </v-tooltip>

          <v-menu top close-on-click offset-y style="z-index: 100" >
            <template #activator="{ on: onMenu, attrs: menuAttrs }">
              <v-tooltip top>
                <template #activator="{ on: onTooltip, attrs: tooltipAttrs }">
                  
                  <v-btn  
                    small
                    v-bind="{ ...tooltipAttrs, ...menuAttrs }"
                    v-on="{ ...onTooltip, ...onMenu }"
                  >
                    <v-icon small>mdi-layers-triple</v-icon>
                  </v-btn>
                </template>
                Select/animate Layer 
              </v-tooltip>
            </template>
            
            <v-list dense >
              <v-list-item  @click.stop v-for="(vis,index) in branches.names" link style="height:40px; " class="pr-0 mr-0 pt-0 mb-0"
              :style= "[!display.branchName.includes(vis) ? {} : { background: '#757575' }]">
                <v-list-item-content @click="showVis(vis)" >
                  <v-list-item-title style="text-align: left;"  >{{ vis }}</v-list-item-title>
                </v-list-item-content>

                <v-btn small style="height: 100%;" class="elevation-0; rounded-0" @click="addBranchAnimation(vis)"
                :style="[!display.animated.includes(vis) ? {} : { background: '#757575' }]">
                    <v-icon style="opacity: 0.9" color="white" small >
                      mdi-animation-outline</v-icon>
                  </v-btn>
                  
              </v-list-item>
            </v-list>
          </v-menu>
          <v-tooltip top >
            <template #activator="{ on, attrs }">
              <v-btn  v-bind="attrs" small @click="slideSwitch(-1,-100)" v-on="on">
                <v-icon small>mdi-arrow-left-bold</v-icon>
              </v-btn>
            </template>
            Previous slide
          </v-tooltip>
          
          <input v-model="display.message" readonly class="pl-2 pr-2 mr-0.5" style="color: white; text-align: center; opacity: 0.8 "  />

          <v-tooltip top >
            <template #activator="{ on, attrs }">
              <v-btn  v-bind="attrs" small @click="slideSwitch(1,-100)" v-on="on">
                <v-icon small>mdi-arrow-right-bold</v-icon>
              </v-btn>
            </template>
            Next slide
          </v-tooltip>

          <v-dialog
            v-model="showObjectDetails"
            width="500"
            :fullscreen="$vuetify.breakpoint.smAndDown"
          >
            <v-card>
              <v-toolbar>
                <v-toolbar-title>Selection Details</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="showObjectDetails = false"><v-icon>mdi-close</v-icon></v-btn>
              </v-toolbar>
              <v-sheet>
                <div v-if="selectedObjects.length !== 0">
                  <object-simple-viewer
                    v-for="(obj, ind) in selectedObjects"
                    :key="obj.id + ind"
                    :value="obj"
                    :stream-id="$route.params.streamId"
                    :key-name="`Selected Object ${ind + 1}`"
                    force-show-open-in-new
                    force-expand
                  />
                </div>
              </v-sheet>
            </v-card>
          </v-dialog>
          <v-dialog v-model="showHelp" max-width="290">
            <v-card>
              <v-card-text class="pt-7">
                <v-icon class="mr-2">mdi-rotate-orbit</v-icon>
                Use your
                <b>left mouse button</b>
                to rotate the view.
                <br />
                <br />
                <v-icon class="mr-2">mdi-pan</v-icon>
                Use your
                <b>right mouse button</b>
                to pan the view.
                <br />
                <br />
                <v-icon class="mr-2">mdi-cursor-default-click</v-icon>
                <b>Double clicking an object</b>
                focus it in the camera view.
                <br />
                <br />
                <v-icon class="mr-2">mdi-cursor-default-click-outline</v-icon>
                <b>Double clicking on the background</b>
                will focus again the entire scene.
                <br />
                <br />
                <v-icon class="mr-2">mdi-layers-triple</v-icon>
                <b>Selecting the layer from the list</b>
                will show/hide the objects.
                <br />
                <br />
                <v-icon class="mr-2">mdi-animation-outline</v-icon>
                <b>Selecting the animation trigger of the layer</b>
                will animate all objects it contains.
              </v-card-text>
            </v-card>
          </v-dialog>
          <v-dialog
            v-model="showPublishDialog"
            width="500"
            >
            <v-card>
              <v-toolbar>
                <v-toolbar-title>PUBLISH</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="showPublishDialog = false"><v-icon>mdi-close</v-icon></v-btn>
              </v-toolbar>

              <v-card-text class="pt-2">
                Publishing the presentation will remove editing tools from display. You can always convert it back to draft 
                by removing specials symbols from the commit message (EDIT function at the top right corner).
              </v-card-text>
              <v-btn @click="publish_pres()"
              color="primary"
              text
              align="center"
            >
              PUBLISH
            </v-btn>
              <v-sheet>
                <div>
                </div>
              </v-sheet>
            </v-card>
          </v-dialog>
        </v-btn-toggle>
      </v-card>
    </div>


    <v-navigation-drawer 
      permanent
      :mini-variant="maximized && loadProgress==100 && allLoaded ==1 ? false : true"
      :expand-on-hover="false"
      floating
      :color="`${$vuetify.theme.dark ? 'grey darken-4' : 'grey lighten-4'}`"
      :dark="$vuetify.theme.dark"
      style="z-index: 200"
      class="overlay-abs"
      :class=" fullScreen ? 'fullscreen' : '' "
      fixed
      mini-variant-width="56"
    >
      <v-toolbar class="transparent elevation-0" v-show="hasLoadedModel " link @click="maximized=!maximized">
        <v-toolbar-title class="space-grotesk primary--text" >
            <v-img
              class="mt-2 hover-tada"
              width="24"
              src="@/assets/specklebrick.png"
              style="display: inline-block"
            />
            <span class="pb-4 pl-1" v-show="maximized && loadProgress==100 && allLoaded ==1">
              <b>  {{branchId.split("presentations/")[1]}}</b></span> 
          
        </v-toolbar-title>
      </v-toolbar>

      <v-list v-show="maximized && loadProgress==100 && allLoaded ==1" >

        <v-list-item v-for="slide in slidesSaved" link style="height: 59px" class="pr-0 mr-0">
          <v-list-item-content  @click="slideSwitch(-100,slide.index)">
            <v-list-item-title style="text-align: left;" :class= "[slide.index == actions.currentSlideNum ? 'primary--text' : '' ]"> 
              {{slide.index+1}}. {{slide.msg}} 
              </v-list-item-title>
            <v-list-item-subtitle style="text-align: left;" class="caption">{{slide.msgSecondary}}</v-list-item-subtitle>
          </v-list-item-content>
          <v-btn small style="height: 100%; " class="elevation-0 rounded-0" v-if="status==0" @click="slideDelete(slide.index)">
            <v-icon color="error" small>mdi-delete-outline</v-icon>
          </v-btn>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item class="pr-0 mr-0 pl-0 " style="height: 59px" v-if="status==0"> 
          <v-list-item-content > 
            <input v-model="actions.currentMessage" 
            
            placeholder="type description here" 
            class="ml-0 pl-4 mr-0 pr-2" 
            style="color: white; text-align: left; background-color:#383838 ; opacity: 0.8; outline: none; height: 59px  "  />
          </v-list-item-content>
          <v-btn small class="elevation-0 pt-0 mt-0" style="height: 59px" @click="slideCreate()">
            <v-icon color="primary" small>mdi-movie-open-plus-outline</v-icon>
          </v-btn>
        </v-list-item>

      </v-list>

      <template #append >
        <v-list dense v-if="maximized && status==0 && loadProgress==100 && allLoaded ==1"  >
          <v-btn @click="publish_pres()" width="128px" class="primary rounded-0" >Publish</v-btn>
          <v-divider class="vertical-divider"
              vertical>
            </v-divider>
          <v-btn @click="save_pres()" width="127px" class="primary rounded-0" > Save</v-btn>

        </v-list>
      </template>

    </v-navigation-drawer>

  </v-sheet>
</template>
<script>
import throttle from 'lodash.throttle'
import { Viewer } from '@speckle/viewer'
import ObjectSimpleViewer from './ObjectSimpleViewer'
import gql from 'graphql-tag'
import objectQueryGlobals from '../graphql/objectSingle.gql'
import crs from 'crypto-random-string'

export default {
  components: { ObjectSimpleViewer },
  props: {
    autoLoad: {
      type: Boolean,
      default: false
    },
    objectUrl: {
      type: String,
      default: null
    },
    objectId: {
      type: String,
      default: null
    },
    status: {
      type: Number,
      default: null
    },
    objectExistingUrl: {
      type: String,
      default: null
    },
    branchId: {
      type: String,
      default: null
    },
    branchName: {
      type: String,
      default: null
    },
    branchDesc: {
      type: String,
      default: null
    },
    unloadTrigger: {
      type: Number,
      default: 0
    },
    showSelectionHelper: {
      type: Boolean,
      default: false
    },
    embeded: {
      type: Boolean,
      default: false
    }
  },
  apollo: {
    branchQuery: {
      query: gql`
        query smth($id: String!) {
          stream(id: $id) {
            id
            isPublic
            name
            branches {
              totalCount
              items {
                id
                name
                description
                commits {
                  items {
                    id
                    referencedObject
                    branchName
                  }
                }
              }
            }
          }
        }
      `,
      update: (data) => data.stream.branches.items,
      variables() {
        return {
          id: this.$route.params.streamId ,
        }
      }
    },
    objectQuery: {
      query: gql`
        query object($streamId: String!, $id: String!){
          stream(id: $streamId) {
            id
            object(id: $id) {
              totalChildrenCount
              id
              data
            }
          }
        }
      `,
      update: (data) => data.stream,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.actions.objectId
        }
      },
      skip() {
        return this.actions.objectId == null
      }
    },
    object: {
      query: objectQueryGlobals,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.objectId
        }
      },
      update(data) {
        delete data.stream.object.data.__closure
        this.globalsArray = this.nestedGlobals(data.stream.object.data)
        return data.stream.object
      },
      skip() {
        return this.objectId == null
      }
    }
  },
  data() {
    return {
      hasLoadedModel: false,
      loadProgress: 0,
      fullScreen: false,
      showHelp: false,
      alertMessage: null,
      showAlert: false,
      selectedObjects: [],
      showObjectDetails: false,
      hasImg: false,
      namedViews: [],

      allLoaded: 0,
      maximized: false,
      showPublishDialog: false,
      branchQuery: null,
      objectQuery: null,
      branches: {names:[], ids:[], url: [], uuid:[], objId:[], visible:[], animated:[] },
      display: {index: [], branchName: [], animated: [], message:"" },
      actions: {pastBranch: null, currentMessage: null, currentSlideNum: null, objectId: null, objectIds:[], alreadyAnimated: [] },
      slidesSaved: null,
      perspectiveMode: true,

      
      sample: {
        Region: 'London',
        Latitude: '0',
        Longitude: '0',
        'Project Code': 'TX-023',
        Climate: {
          'Summer DBT [C]': 35,
          'Summer WBT [C]': 20,
          'Winter DBT [C]': -4,
          'Winter WBT [C]': -4
        }
      },
      globalsArray: [],
      globalsArray2: [],
      globalsAreValid: true,
      saveDialog: false,
      deleteEntries: false,
      saveValid: true,
      saveLoading: false,
      nameRules: [(v) => (v && v.length >= -1) || 'Message must be at least -1 characters'],
      saveMessage: null,
      saveError: null,
      newCommitId: null,
      newCommitId2: null,
      status_updated: 0

    }
  },
  computed: {
    canSave() {
      return (
        this.globalsAreValid //&& (this.userRole === 'stream:contributor' || this.userRole === 'stream:owner')
      )
    },
    //globalsCommit() {
    //  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    //  this.globalsAreValid = true
    //  let base = this.globalsToBase(this.globalsArray)
    //  return base
    //},
    isSmall() {
      return this.$vuetify.breakpoint.name == 'xs' || this.$vuetify.breakpoint.name == 'sm'
    },
    darkMode() {
      return this.$vuetify.theme.dark
    },
    url() {
      var stream = this.$route.params.streamId
      var base = `${window.location.origin}/embed?stream=${stream}`
      var object = this.$route.params.objectId
      if (object) return base + `&object=${object}`
      var commit = this.$route.params.commitId
      if (commit) return base + `&commit=${commit}`
      var branch = this.branchName
      if (branch) return base + `&branch=${encodeURI(branch)}`
      return base
    },
    embedUrl() {
      return this.url
    }
  },
  watch: {
    unloadTrigger() {
      this.unloadData()
    },
    fullScreen() {
      setTimeout(() => window.__viewer.onWindowResize(), 20)
    },
    loadProgress(newVal) {
      if (newVal >= 99) {
        let views = window.__viewer.interactions.getViews()
        this.namedViews.push(...views)
      }
      if (newVal==100 && this.allLoaded ==1) {
        setTimeout(() => { // to avoid "ghost items" left visible
          window.__viewer.sceneManager.objects.forEach(item=>{
            //cosole.log(item)
            this.hide(item,0) 
          })
        },1000)
      }
    },
    allLoaded(newVal){
      if (newVal==1 && this.loadProgress ==100) {
        //cosole.log(window.__viewer.sceneManager.objects)
        setTimeout(() => { // to avoid "ghost items"
          window.__viewer.sceneManager.objects.forEach(item=>{
            //console.log(item)
            this.hide(item,0) 
          })
        },1000)
      }
      
    },
    objectQuery(val){
      let obj = this.objectQuery.object.data
      this.branches.uuid.push([])

      if (obj['@data']){
        obj['@data'].forEach(sub_obj=>{
          var count = 0
          sub_obj.forEach(item=>{
            //infinite nesting of objects
            if (item.referencedId) this.branches.uuid[this.branches.uuid.length-1].push(item.referencedId)
            if (!item.referencedId){
              item.forEach(sub_item=>{
                if (sub_item.referencedId) this.branches.uuid[this.branches.uuid.length-1].push(sub_item.referencedId)
                if (!sub_item.referencedId){
                  sub_item.forEach(sub_sub_item=>{
                    if (sub_sub_item.referencedId) this.branches.uuid[this.branches.uuid.length-1].push(sub_sub_item.referencedId)
                  })
                }
              })
            }
            count +=1
          })
        })
      } 
      // remove item that was used from the list, assign the new one
      this.actions.objectIds.splice(0,1)
      this.actions.objectId = this.actions.objectIds[0]
      this.$apollo.queries.objectQuery.refetch()
      this.allLoaded = 1
    },
    newCommitId2(){
      console.log("New published commit! " + this.newCommitId2.data.commitCreate)
      window.location.href = window.location.origin + "/streams/" + this.$route.params.streamId + "/commits/" + this.newCommitId2.data.commitCreate 
    }
  },
  // TODO: pause rendering on destroy, reinit on mounted.
  async mounted() {
    // NOTE: we're doing some globals and dom shennanigans in here for the purpose
    // of having a unique global renderer and it's container dom element. The principles
    // are simple enough:
    // - create a single 'renderer' container div
    // - initialise the actual renderer **once** (per app lifecycle, on refresh it's fine)
    // - juggle the container div out of this component's dom when the component is managed out by vue
    // - juggle the container div back in of this component's dom when it's back.
    let renderDomElement = document.getElementById('renderer')
    if (!renderDomElement) {
      renderDomElement = document.createElement('div')
      renderDomElement.id = 'renderer'
    }
    this.domElement = renderDomElement
    this.domElement.style.display = 'inline-block'
    this.$refs.rendererparent.appendChild(renderDomElement)
    if (!window.__viewer) {
      window.__viewer = new Viewer({ container: renderDomElement })
    }
    window.__viewer.onWindowResize()
    if (window.__viewerLastLoadedUrl !== this.objectUrl) {
      window.__viewer.sceneManager.removeAllObjects()
      window.__viewerLastLoadedUrl = null
      this.getPreviewImage().then().catch()
    } else {
      this.hasLoadedModel = true
      this.loadProgress = 100
      this.setupEvents()
    }
    if (this.$route.query.embed) {
      this.fullScreen = true
      //TODO: Remove overflow from window
      document.body.classList.add('no-scrollbar')
    }
    if (window.__viewer.activeCam === 'ortho') this.perspectiveMode = false

  },
  beforeDestroy() {
    // NOTE: here's where we juggle the container div out, and do cleanup on the
    // viewer end.
    // hide renderer dom element.
    this.domElement.style.display = 'none'
    // move renderer dom element outside this component so it doesn't get deleted.
    document.body.appendChild(this.domElement)
  },
  methods: {
    async getPreviewImage(angle) {
      angle = angle || 0
      let previewUrl = null
      if (this.objectExistingUrl) previewUrl = this.objectExistingUrl.replace('streams', 'preview') + '/' + angle
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
    },
    toggleCamera() {
      window.__viewer.toggleCameraProjection()
      this.perspectiveMode = !this.perspectiveMode
    },
    zoomEx() {
      window.__viewer.interactions.zoomExtents()
    },
    setView(view) {
      window.__viewer.interactions.rotateTo(view)
    },
    setNamedView(id) {
      window.__viewer.interactions.setView(id)
    },
    sectionToggle() {
      window.__viewer.interactions.toggleSectionBox()
    },
    setupEvents() {
      window.__viewer.on('load-warning', ({ message }) => {
        this.alertMessage = message
        this.showAlert = true
      })
      window.__viewer.on(
        'load-progress',
        throttle(
          function (args) {
            this.loadProgress = args.progress * 100
            this.zoomEx()
          }.bind(this),
          200
        )
      )
      window.__viewer.on('select', (objects) => {
        // console.log(objects)
        this.selectedObjects.splice(0, this.selectedObjects.length)
        this.selectedObjects.push(...objects)
        this.$emit('selection', this.selectedObjects)
      })
      
    },
    load() {
      /// for "globals"
      // if no commits yet
      if (!this.objectId) {
        console.log("no commits read")
        this.globalsArray = this.nestedGlobals(this.sample)
      }
      else console.log(this.objectId)
      console.log(this.status)

      let commitData = null
      this.globalsArray.forEach(obj=>{
        if (obj.key =="json" && obj.value && obj.value.length>0) commitData = [...obj.value]
      })
      console.log(commitData)
      
      //if(this.commitMsg.includes("✓")) this.status = 1; else this.status = 0
        //  this.slidesSaved = JSON.parse(JSON.parse(this.presentationData).json)
      if (commitData)  this.slidesSaved = commitData
      else this.slidesSaved = []
      //console.log(this.slidesSaved)
      //get unique branch ids from the presentation slides
      var listBranchesInPresentation = []
      var listBranchesInPresentationQuery = []
      if (this.status==1) {
        this.slidesSaved.forEach(obj=>{
          let count = 0
          obj.branchesIds.forEach(item=>{
            if (obj.visibilities && obj.visibilities[count]==1 && !listBranchesInPresentation.includes(item)) listBranchesInPresentation.push(item)
            count+=1
          })
        })
      }
      // re-assign branch query results, select only necessary
      this.branchQuery.forEach(obj=>{
        if (listBranchesInPresentation.includes(obj.id)) listBranchesInPresentationQuery.push(obj)
      })
      this.hasLoadedModel = true
      window.__viewerLastLoadedUrl = this.objectExistingUrl
      let start_url =   window.location.origin + "/streams/" + this.$route.params.streamId 

      ///// filling branch list from branchQuery data
      let obj = null
      if (this.status ==0) {obj = this.branchQuery} else {obj = listBranchesInPresentationQuery}
      var i = 0
      obj.forEach(obj=>{
        //// fill all the branch lists and upload objects
        if (obj && !obj.name.includes('presentations/') && obj.name!='globals' && obj.commits.items[0]) {
          //console.log("Loading branch: " + obj.name)
          window.__viewer.loadObject(start_url + "/objects/" +   obj.commits.items[0].referencedObject)
          this.branches.names.push(obj.name) 
          this.branches.ids.push(obj.id) 
          this.branches.visible.push(0) 
          this.branches.objId.push(obj.commits.items[0].referencedObject)
          this.branches.url.push(start_url + "/objects/" +   obj.commits.items[0].referencedObject)
          this.branches.animated.push(0)

          this.actions.objectIds.push(obj.commits.items[0].referencedObject)
          // initiate query only the first time
          if (this.branches.names.length==1) this.actions.objectId = obj.commits.items[0].referencedObject, this.$apollo.queries.objectQuery.refetch()
        }
        i+=1
      })
      //console.log(this.branches)
      this.maximized = true
      this.setupEvents()

    },
    unloadData() {
      window.__viewer.sceneManager.removeAllObjects()
      this.hasLoadedModel = false
      this.loadProgress = 0
      this.namedViews.splice(0, this.namedViews.length)
    },
    copyEmbedUrl() {
      navigator.clipboard.writeText(this.embedUrl).then(() => {
        //TODO: Show vuetify notification
      })
    },
    copyIFrame() {
      var frameCode = `<iframe src="${this.embedUrl}" width=600 height=400></iframe>`
      navigator.clipboard.writeText(frameCode).then(() => {
        //TODO: Show vuetify notification
      })
    },
    
    showVis(name, id){
      let index = 0
      if(name=="") index = this.branches.ids.indexOf(id), name = this.branches.names[index]
      else index = this.branches.names.indexOf(name) 
      let start_url = window.location.origin + "/streams/" + this.$route.params.streamId 

      ////////////////////////////////////////////// SHOW DATA 
      if (!this.branches.visible[index] == 1  )  {
        //console.log("show "+ name)
        this.branches.visible[index] = 1 
        this.display.index.push(index)
        this.display.branchName.push(name)
      } else {    //////////////////////////////////////////////  HIDE DATA
        //console.log("hide "+ name)
        this.branches.visible[index] = 0 
        this.display.index.splice(this.display.index.indexOf(index), 1)
        this.display.branchName.splice(this.display.branchName.indexOf(name), 1)
      }

      /////// if branch is animated, animate only if not already on
      if (this.branches.visible[index] ==1 && this.branches.animated[index] == 1){
        if (!this.actions.alreadyAnimated.includes(this.branches.names[index])) this.animate(this.branches.uuid[index],this.branches.names[index])
      }else if(this.branches.uuid[index] && this.branches.uuid[index][0]) {
        this.branches.uuid[index].forEach(obj=>{
          window.__viewer.sceneManager.objects.forEach(item=>{
            if (item.uuid == obj) this.hide(item, this.branches.visible[index]) //set new visibility
          })
        })
      }
     
    },
    hide(obj,i){
      //console.log(obj)
      if (i==0) {
        obj.visible = false 
        if (obj.scale) obj.scale.x=0, obj.scale.y=0, obj.scale.z=0
      }
      if (i==1) {
        obj.visible = true
        if (obj.scale) obj.scale.x=1, obj.scale.y=1, obj.scale.z=1
      }
      window.__viewer.needsRender = true
    },
    slideSwitch(num,id){
      // update slider counter: set the start number if null (important if using the arrows)
      if (!this.actions.currentSlideNum && this.actions.currentSlideNum!=0 ) { 
        if (num==1) {this.actions.currentSlideNum = -1} else {this.actions.currentSlideNum = this.slidesSaved.length}
      } 
      // if num (arrow switcher) is ignored, slide was clicked from the list. Else: increment by 1/-1
      if (num<-50) {this.actions.currentSlideNum = id } else {this.actions.currentSlideNum += num}
      // if number outside boundaries, reset 
      if (this.actions.currentSlideNum >=this.slidesSaved.length) this.actions.currentSlideNum = 0
      if (this.actions.currentSlideNum <0) this.actions.currentSlideNum = this.slidesSaved.length -1

      let index = this.actions.currentSlideNum
      this.actions.currentMessage = ""
      // reset scene branch visibilities and animations to none
      this.actions.alreadyAnimated = [...this.display.animated]
      this.display.index = []
      this.display.branchName = []
      this.display.animated = []
      
      // hide all visible branches, remove all animation
      var count = 0 //for branches in the scene 
      this.branches.visible.forEach(br=>{ 
        if (br == 1) this.showVis(this.branches.names[count])
        if (this.branches.animated[count] == 1) this.branches.animated[count] = 0
        ///// set animations and visibilities; SLIDES LIST OF BRANCHES IS NOT SYNC WITH CURRENTLY LOADED BRANCHES 
        let sub_count = 0 // for slides, list of branches inside each
        this.slidesSaved[index].branchesIds.forEach(slideItem=>{
          if (this.branches.ids[count] == slideItem){
            //animation setting
            if(this.slidesSaved[index].animated && this.slidesSaved[index].animated[sub_count]) {
              this.branches.animated[count] = this.slidesSaved[index].animated[sub_count]
              this.display.animated.push(this.branches.names[count])//, console.log(this.display.animated)
            } else {
              this.branches.animated[count] = 0
              this.display.animated.splice(this.display.animated.indexOf(this.branches.names[count]), 1)//, console.log(this.display.animated)
            }
            // visibility switch if the branch became visible
            if (this.slidesSaved[index].visibilities && this.slidesSaved[index].visibilities[sub_count] && this.slidesSaved[index].visibilities[sub_count]==1) this.showVis("",slideItem)
          }
          sub_count+=1
        })
        count +=1
       })
      // set camera view 
      this.display.message = this.slidesSaved[index].msg
      window.__viewer.interactions.setLookAt(this.slidesSaved[index].cam_position,this.slidesSaved[index].target)
    },
    slideCreate(){
      let cam = window.__viewer.sceneManager.viewer.camera.matrix.elements
      let contr = window.__viewer.sceneManager.viewer.controls
      var len = 0
      if (this.slidesSaved) len = this.slidesSaved.length
      
      let slide = {
        index: len,
        cam_position: { x: cam[12],y: cam[13],z: cam[14] }, 
        target: contr._target, 
        branches: this.branches.names, 
        branchesIds: this.branches.ids, 
        visibilities: this.branches.visible, 
        msg: this.actions.currentMessage,
        animated: this.branches.animated,
      }
      this.slidesSaved.push( JSON.parse(JSON.stringify(slide)) )
      this.actions.currentMessage = ""
      this.actions.currentSlideNum = this.slidesSaved.length-1
      this.display.message = this.slidesSaved[this.slidesSaved.length-1].msg

      let slides_draft = {status: 0, json: [...this.slidesSaved] } // to eliminate the "observer" type
      this.globalsArray = this.nestedGlobals( {status: 0, json: [...this.slidesSaved] } )

    },
    save_pres(){
      this.saveGlobals(0)  
      //window.location.href = window.location.origin + "/streams/" + this.$route.params.streamId + "/commits/" + this.branchName 
    },
    async publish_pres(){
      let slides_ready = {status: 1, json: [...this.slidesSaved] } 
      //this.new_commitMsg = "✓" +" "+ "Presentation updated: " + this.slidesSaved.length.toString() + " slides"
      console.log(this.branchId)
      /*
      await this.$apollo.mutate({
        mutation: gql`
          mutation commitUpdate($params: CommitUpdateInput!) {
            commitUpdate(commit: $params)
          }
        `,
        variables: {
          params: {
            streamId: this.$route.params.streamId,
            id: this.$route.params.commitId,
            message: this.new_commitMsg
          }
        }
      })
      */
      this.saveGlobals(1)
      //window.location.href = window.location.origin + "/streams/" + this.$route.params.streamId + "/branches/" + new_name 
    },
    slideDelete(index){
      if(this.slidesSaved) {
        this.slidesSaved.splice(index, 1)
        var count = 0
        this.slidesSaved.forEach(obj=>{ //reset indices 
          obj.index = count
          count +=1
        })
      }
      if (this.slidesSaved[index] && this.slidesSaved[index].msg) this.display.message = this.slidesSaved[index].msg
      else this.display.message = ""

      let slides_draft = {status: 0, json: [...this.slidesSaved]  } // to eliminate "observer" type
      this.globalsArray = this.nestedGlobals( {status: 0, json: [...this.slidesSaved] } )
      
    },
    addBranchAnimation(name){
      let index = this.branches.names.indexOf(name) 
      let start_url = window.location.origin + "/streams/" + this.$route.params.streamId 
      ////////////////////////////////////////////// ADD DATA to branches 
      if (this.branches.animated[index] == 0 ) { this.branches.animated[index] = 1, this.display.animated.push(this.branches.names[index]) }
      else { this.branches.animated[index] = 0, this.display.animated.splice( this.display.animated.indexOf(name) ,1) }
      // if branch is visible and became animated: hide all, then animate
      if (this.branches.visible[index] == 1 && this.branches.animated[index] == 1){
        this.branches.uuid[index].forEach(obj=>{
          window.__viewer.sceneManager.objects.forEach(item=>{
            if (item.uuid == obj) this.hide(item, 0) //set new visibility
          })
        })
        this.animate(this.branches.uuid[index],this.branches.names[index])
      // if branch is visible and animation removed: show all objects
      } else if (this.branches.visible[index] == 1 && this.branches.animated[index] == 0){
        this.branches.uuid[index].forEach(obj=>{
          window.__viewer.sceneManager.objects.forEach(item=>{
            if (item.uuid == obj) this.hide(item, 1) //set new visibility
          })
        })
      }
    },
    animate(objects, brName){ 
      var startSlide = this.actions.currentSlideNum
      let range = []
      if(objects) range = Array.from(new Array(objects.length), (x, i) => i )
      for (let i in range) {
        setTimeout(() => {
          i-=1
          // stop if slide was changed, and this branch is not anymore animated
          if (startSlide != this.actions.currentSlideNum && !this.display.animated.includes(brName)) i = -1
          // hide all objects in the layer
          var count = 0
          objects.forEach(obj=> {
            window.__viewer.sceneManager.objects.forEach(item=>{
              if (item.uuid == obj && count != i && item.visible ==1 ) this.hide(item,0)
              else if (item.uuid == obj && count == i && item.visible ==0) {
                this.hide(item,1)
                // if animation finished, remove from "already animated" list
                //if (i==objects.length-1) this.actions.alreadyAnimated.splice(this.actions.alreadyAnimated.indexOf(brName),1)
              }
            })
            count+=1
          })

        }, 
        i++ * 100);
      } 
    },
    //////////////////////////////////////////////////////////////////////////////////////// GLOBALS APPROACH ///////////////////////////////////////////////////////////////

    async saveGlobals(val) {
      //if (!this.$refs.form.validate()) return 
      let commitObject = this.globalsToBase(this.globalsArray)
      console.log(commitObject)

      //extract and modify data from globalsArray
      let globalsArray_data = null
      this.globalsArray.forEach(obj=>{
        if (obj.key =="json" && obj.value && obj.value.length>0) globalsArray_data = [...obj.value]
      })
      this.globalsArray2 = this.nestedGlobals( {status: 1, json: [...globalsArray_data] } )
      let commitObject2 = this.globalsToBase(this.globalsArray2)
      console.log(commitObject2)

      let slide_num = this.slidesSaved.length.toString()

      try {
        
        this.loading = true
        //this.$matomo && this.$matomo.trackPageView('globals/save')
        let res = await this.$apollo.mutate({
          mutation: gql`
            mutation ObjectCreate($params: ObjectCreateInput!) {
              objectCreate(objectInput: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.$route.params.streamId,
              objects: [ commitObject ]
            }
          }
        })
        console.log(res)
        
        this.newCommitId = await this.$apollo.mutate({
          mutation: gql`
            mutation CommitCreate($commit: CommitCreateInput!) {
              commitCreate(commit: $commit)
            }
          `,
          variables: {
            commit: {
              streamId: this.$route.params.streamId,
              branchName: this.branchName,
              objectId: res.data.objectCreate[0],
              message: slide_num[slide_num.length-1]==1 ? "Presentation updated: " + slide_num + ' slide' : "Presentation updated: " + slide_num + ' slides' ,
              sourceApplication: 'web'
            }
          }
        })

        if (val==1){
          
          this.loading = true
          //this.$matomo && this.$matomo.trackPageView('globals/save')
          let res2 = await this.$apollo.mutate({
            mutation: gql`
              mutation ObjectCreate($params: ObjectCreateInput!) {
                objectCreate(objectInput: $params)
              }
            `,
            variables: {
              params: {
                streamId: this.$route.params.streamId,
                objects: [ commitObject2 ]
              }
            }
          })
          console.log(res2)

        
          this.newCommitId2 = await this.$apollo.mutate({ // will rewrite the commit ID for link redirecting
            mutation: gql`
              mutation CommitCreate($commit: CommitCreateInput!) {
                commitCreate(commit: $commit)
              }
            `,
            variables: {
              commit: {
                streamId: this.$route.params.streamId,
                branchName: this.branchName,
                objectId: res2.data.objectCreate[0],
                message: slide_num[slide_num.length-1]==1 ? "PUBLISHED: " + slide_num + ' slide' : "PUBLISHED: " + slide_num + ' slides' ,
                sourceApplication: 'web'
              }
            }
          })
          //this.status_updated = 1
        }

        this.saveLoading = false
        this.saveDialog = false
      } catch (err) {
        this.saveLoading = false
        this.saveError = err
        console.log(err)
      }
    },
    
    nestedGlobals(data) {
      if (!data) return []
      let entries = Object.entries(data)
      let arr = []
      for (let [key, val] of entries) {
        if (key.startsWith('__')) continue
        if (['totalChildrenCount', 'speckle_type', 'id'].includes(key)) continue

        if (!Array.isArray(val) && typeof val === 'object' && val !== null) {
          if (val.speckle_type && val.speckle_type === 'reference') {
            arr.push({
              key,
              valid: true,
              id: crs({ length: 10 }),
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object' //TODO: handle references
            })
          } else {
            arr.push({
              key,
              valid: true,
              id: crs({ length: 10 }),
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object'
            })
          }
        } else {
          arr.push({
            key,
            valid: true,
            id: crs({ length: 10 }),
            value: val,
            type: 'field'
          })
        }
        //console.log(arr)
      }

      return arr
    },
    globalsToBase(arr) {
      let base = {
        // eslint-disable-next-line camelcase
        speckle_type: 'Base',
        id: null
      }

      for (let entry of arr) {

        if (!entry.value && !entry.globals) continue

        if (entry.valid !== true) {
          this.globalsAreValid = false
          return null
        }

        if (Array.isArray(entry.value)) base[entry.key] = entry.value
        else if (entry.type == 'object') {
          base[entry.key] = this.globalsToBase(entry.globals)
        } else if (typeof entry.value === 'string' && entry.value.includes(',')) {
          base[entry.key] = entry.value
            .replace(/\s/g, '')
            .split(',')
            .map((el) => (isNaN(el) ? el : parseFloat(el)))
        } else if (typeof entry.value === 'boolean') {
          base[entry.key] = entry.value
        } else {
          base[entry.key] = isNaN(entry.value) ? entry.value : parseFloat(entry.value)
        }
      }

      return base
    },
    resetGlobals() {
      this.deleteEntries = false
      this.globalsArray = this.object?.data
        ? this.nestedGlobals(this.object.data)
        : this.nestedGlobals(this.sample)
    },
    clearGlobals() {
      this.globalsArray = this.nestedGlobals({ placeholder: 'something cool goes here...' })
    },
    addProp(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)
      globals.splice(globals.length, 0, kwargs.field)
    },
    removeProp(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)
      globals.splice(kwargs.index, 1)
    },
    fieldToObject(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)

      globals.splice(kwargs.index, 1, kwargs.obj)
    },
    objectToField(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)

      globals.splice(kwargs.index, 1, ...kwargs.fields)
    },
    getNestedGlobals(path) {
      let entry = this.globalsArray
      if (!path) return entry

      let depth = path.length

      if (depth > 0) {
        let id = path.shift()
        entry = entry.find((e) => e.id == id)
      }

      if (depth > 1) {
        path.forEach((id) => {
          entry = entry.globals.find((e) => e.id == id)
        })
      }

      if (!Array.isArray(entry)) entry = entry.globals

      return entry
    },





  }
}
</script>
<style>
.top-left {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
}
.top-right {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
}
#rendererparent {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
}
.fullscreen {
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 10;
  /*background-color: rgb(58, 59, 60);*/
  background-color: rgb(238, 238, 238);
}
.dark {
  background-color: rgb(58, 59, 60) !important;
}
#renderer {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.overlay {
  position: relative;
  z-index: 2;
  text-align: center;
}
.overlay-abs {
  position: absolute;
  z-index: 2;
  text-align: center;
  width: 100%;
  height: 100%;
}
.bg-img {
  background-position: center;
  background-repeat: no-repeat;
  /*background-attachment: fixed;*/
}
.cover-all {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
}
.radial-bg {
  transition: all 0.5s ease-out;
  background: radial-gradient(
    circle,
    rgba(60, 94, 128, 0.8519782913165266) 0%,
    rgba(63, 123, 135, 0.13489145658263302) 100%
  );
  opacity: 1;
}
.radial-bg:hover {
  background: radial-gradient(
    circle,
    rgba(60, 94, 128, 0.8519782913165266) 0%,
    rgba(63, 123, 135, 0.13489145658263302) 100%
  );
  opacity: 0.5;
}
.vertical-center {
  margin: 0;
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  z-index: 2;
}
</style>