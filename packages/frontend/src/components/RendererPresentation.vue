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
      style="position: absolute; "
      :style= "[ (maximized&& loadProgress==100 && allLoaded ==1) ? {'padding-left': '128px'} : {'padding-left': '28px'} ]"
      id="rendererparent"
      ref="rendererparent"
      :class="`${fullScreen ? 'fullscreen' : ''} ${darkMode ? 'dark' : ''}` "
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
              <v-icon>mdi-play</v-icon>
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
                Select Layer
              </v-tooltip>
            </template>
            <v-list dense>
              
              <v-list-item v-for="vis in branches.names" @click="showVis(vis)"  
              :style= "[!display.branchName.includes(vis) ? {} : { background: '#757575' }]">
                <v-list-item-title>{{ vis }}</v-list-item-title>
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
              </v-card-text>
            </v-card>
          </v-dialog>
          <v-dialog
            v-model="showPublishDialog"
            width="500"
            :fullscreen="$vuetify.breakpoint.smAndDown"
            >
            <v-card>
              <v-toolbar>
                <v-toolbar-title>Confirmation</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="showPublishDialog = false"><v-icon>mdi-close</v-icon></v-btn>
              </v-toolbar>

              <v-card-text class="pt-2">
                You can always convert it back to draft by removing 
                specials symbols from the branch name
              </v-card-text>
              <v-btn @click="publish_pres()"
              color="primary"
              text
              rounded
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
      fixed
      mini-variant-width="56"
      :fullscreen="$vuetify.breakpoint.smAndDown"
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
              <b>  {{$route.params.branchName.split("presentations/")[1]}}</b></span> 
          
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
          <v-btn small style="height: 100%; " class="elevation-0" v-if="status==0" @click="slideDelete(slide.index)">
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

          <v-list-item @click="showPublishDialog = !showPublishDialog" class="primary" >
            <v-list-item-content>
              <v-list-item-title>Publish presentation</v-list-item-title>
            </v-list-item-content>

          </v-list-item>

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
    objectExistingUrl: {
      type: String,
      default: null
    },
    branchId: {
      type: String,
      default: null
    },
    branchDesc: {
      type: String,
      default: null
    },
    presentationData: {
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
      status: 0,
      branchQuery: null,
      objectQuery: null,
      branches: {names:[], url: [], uuid:[], objId:[], visible:[] },
      display: {index: [], branchName: [], message:"" },
      actions: {pastBranch: null, currentMessage: null, currentSlideNum: null, objectId: null },
      slidesSaved: null

    }
  },
  computed: {
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
      var branch = this.$route.params.branchName
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
        setTimeout(() => { // to avoid "ghost items"
          window.__viewer.sceneManager.objects.forEach(item=>{
            this.hide(item,0) 
          })
        },1000)
      }
    },
    objectQuery(val){
      //console.log(val)
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
      let previewUrl = this.objectExistingUrl.replace('streams', 'preview') + '/' + angle
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
            //this.zoomEx()
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
      window.__viewer.sceneManager.removeAllObjects()
      if (this.presentationData) {
        this.slidesSaved = JSON.parse(JSON.parse(this.presentationData).json)
        if(this.$route.params.branchName.includes("✓")) this.status = 1; else this.status = 0
      }
      else this.slidesSaved = []
      console.log(this.slidesSaved)
      this.hasLoadedModel = true
      window.__viewerLastLoadedUrl = this.objectExistingUrl
      let start_url =   window.location.origin + "/streams/" + this.$route.params.streamId //+ "/branches/"  //"http://localhost:3000/streams/57ff4b8873/branches/ "

      ////////////////////////////////////////////////
      /*
      let something = null
      if (something) { //} (this.status == 1){
        var count = 0
        this.branchQuery.forEach(obj=> { // run loop for each branch name
          //// fill all the branch lists and upload objects
          if (!obj.name.includes('presentations/') && obj.name!='globals' && obj.commits.items[0]) {
            if (this.branches.uuid && this.branches.uuid[this.branches.uuid.length-1] && this.branches.uuid[this.branches.uuid.length-1].length == 0) {
              //console.log(window.__viewer.sceneManager.objects)
            }

            this.branches.names.push(obj.name) 
            this.branches.visible.push(1) 
            this.branches.objId.push(obj.commits.items[0].referencedObject)
            this.branches.uuid.push(obj.commits.items[0].id)
            this.branches.url.push(start_url + "/objects/" +   obj.commits.items[0].referencedObject)
            window.__viewer.loadObject(start_url + "/objects/" +   obj.commits.items[0].referencedObject)
          }
          count += 1
        })
      }*/
      /////////////////////////////////////////////////////  getting objects and uuid

      //this.branchQuery.forEach(obj=> { // run loop for each branch name // OLD
      let range = Array.from(new Array(this.branchQuery.length+2), (x, i) => i )
      var temp = []
      for (let i in range){
        setTimeout(() => {
          
          console.log(i-1)
          var obj = this.branchQuery[i-1]
          //// fill all the branch lists and upload objects
          if (obj && !obj.name.includes('presentations/') && obj.name!='globals' && obj.commits.items[0]) {

            if (this.objectQuery) {
              if (this.objectQuery.object && this.objectQuery.object.data) temp.push(this.objectQuery.object.data) //fill this list 1 iteration later
              else temp.push([]) 
            }
            console.log("Loading branch: " + obj.name)
            window.__viewer.loadObject(start_url + "/objects/" +   obj.commits.items[0].referencedObject)

            this.branches.names.push(obj.name) 
            this.branches.visible.push(0) 
            this.branches.objId.push(obj.commits.items[0].referencedObject)
            this.branches.url.push(start_url + "/objects/" +   obj.commits.items[0].referencedObject)

            this.actions.objectId = obj.commits.items[0].referencedObject
            this.$apollo.queries.objectQuery.refetch()
            this.loadProgress = 90
            
          }else if (i==range[range.length-1]) {
            temp.push(this.objectQuery.object.data) //add the last item
            //console.log(temp)

            temp.forEach(obj=>{ // all of uuid s
              //console.log(obj['@data'])
              this.branches.uuid.push([])
              if (obj['@data']){
                obj['@data'].forEach(sub_obj=>{
                  var count = 0
                  sub_obj.forEach(item=>{
                    this.branches.uuid[this.branches.uuid.length-1].push(sub_obj[count].referencedId)
                    count +=1
                  })
                })
              } 
            })
            this.allLoaded = 1
          }
        }, i++ * 1000);
      } //) OLD

      console.log(this.branches)
      this.loadProgress = 100
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
    



    showVis(name){
      let index = this.branches.names.indexOf(name) 
      let start_url = window.location.origin + "/streams/" + this.$route.params.streamId 

      ////////////////////////////////////////////// SHOW or upload DATA 
      if (!this.branches.visible[index] == 1  )  {
        console.log("show "+ name)
        this.branches.visible[index] = 1 
        this.display.index.push(index)
        this.display.branchName.push(name)
      } else {    //////////////////////////////////////////////  HIDE DATA
        console.log("hide "+ name)
        this.branches.visible[index] = 0 
        this.display.index.splice(this.display.index.indexOf(index), 1)
        this.display.branchName.splice(this.display.branchName.indexOf(name), 1)
      }
      console.log("Displayed branches: " + this.display.branchName.toString())

      this.branches.uuid[index].forEach(obj=>{
        window.__viewer.sceneManager.objects.forEach(item=>{
          if (item.uuid == obj) this.hide(item, this.branches.visible[index]) //reverse visibility
        })
      })

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
    },
    slideSwitch(num,id){
      // update slider counter, display message, update branches (visibility)
      if (!this.actions.currentSlideNum && this.actions.currentSlideNum!=0 ) { // set the starting number, important if using the arrows
        //console.log("switch with arrows")
        if (num==1) this.actions.currentSlideNum = -1
        else this.actions.currentSlideNum = this.slidesSaved.length
      } 
      if (num<-50) this.actions.currentSlideNum = id // if num (arrow switcher) is ignored, slide was clicked from the list 
      else this.actions.currentSlideNum += num
      
      if (this.actions.currentSlideNum >=this.slidesSaved.length) this.actions.currentSlideNum = 0
      if (this.actions.currentSlideNum <0) this.actions.currentSlideNum = this.slidesSaved.length -1

      console.log(this.actions.currentSlideNum)

      let index = this.actions.currentSlideNum
      this.actions.currentMessage = ""

      // reset branch visibilities 
      this.display.index = []
      this.display.branchName = []

      var count = 0
      this.branches.visible.forEach(br=>{ 
        if (br == 1) this.showVis(this.branches.names[count])
        count +=1
       })

      this.display.message = this.slidesSaved[index].msg
      window.__viewer.interactions.setLookAt(this.slidesSaved[index].cam_position,this.slidesSaved[index].target)

      if (this.slidesSaved[index].branches && this.slidesSaved[index].branches.length>0){ // look into the slide data
        var count = 0
        this.slidesSaved[index].branches.forEach(obj=>{ // look at each branch data for the slide
          if (this.slidesSaved[index].visibilities[count] == 1 ) {
            this.showVis(obj)
          }
          count +=1
        })
      }
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
        visibilities: this.branches.visible, 
        msg: this.actions.currentMessage
      }
      this.slidesSaved.push( JSON.parse(JSON.stringify(slide)) )
      this.actions.currentMessage = ""
      this.actions.currentSlideNum = this.slidesSaved.length-1
      this.display.message = this.slidesSaved[this.slidesSaved.length-1].msg

      let slides_draft = {status:'--draft--', json: JSON.stringify(this.slidesSaved) } // to eliminate "observer" type
      //console.log(typeof(slides_draft))

      this.$apollo.mutate({
        mutation: gql`
          mutation branchUpdate($params: BranchUpdateInput!) {
            branchUpdate(branch: $params)
          }
        `,
        variables: {
          params: {
            streamId: this.$route.params.streamId,
            id: this.branchId,
            name: this.$route.params.branchName,
            description: this.branchDesc,
            presentationData: slides_draft
          }
        }
      })

    },
    publish_pres(){
      let slides_ready = {status:'--ready--', json: JSON.stringify(this.slidesSaved) } 
      let new_name = this.$route.params.branchName +" "+ "✓"
      //console.log(slides_ready)
      // save and publish
        this.$apollo.mutate({
          mutation: gql`
            mutation branchUpdate($params: BranchUpdateInput!) {
              branchUpdate(branch: $params)
            }
          `,
          variables: {
            params: {
              streamId: this.$route.params.streamId,
              id: this.branchId,
              name: new_name,
              description: this.branchDesc,
              presentationData: slides_ready
            }
          }
        })
        //this.$emit('refetch-branches')
        //this.$matomo && this.$matomo.trackPageView('branch/create')
        this.$router.push( `/streams/${this.$route.params.streamId}/branches/${new_name}` )
        //window.location.href = (window.location.origin + "/streams/" + this.$route.params.streamId + "/branches/"+ this.$route.params.branchName)
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
      this.display.message = this.slidesSaved[index].msg

      let slides_draft = {status:'--draft--', json: JSON.stringify(this.slidesSaved) } // to eliminate "observer" type

      this.$apollo.mutate({
        mutation: gql`
          mutation branchUpdate($params: BranchUpdateInput!) {
            branchUpdate(branch: $params)
          }
        `,
        variables: {
          params: {
            streamId: this.$route.params.streamId,
            id: this.branchId,
            name: this.$route.params.branchName,
            description: this.branchDesc,
            presentationData: slides_draft
          }
        }
      })
      
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