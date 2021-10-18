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
      :class="`${fullScreen ? 'fullscreen' : ''} ${darkMode ? 'dark' : ''}`"
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
        v-show="hasLoadedModel && loadProgress >= 100"
        style="position: absolute; bottom: 0px; z-index: 2; width: 100%"
        class="pa-0 text-center transparent elevation-0 pb-3"
      >
        <v-btn-toggle class="elevation-0" style="z-index: 100">

            <span v-if="showAnimationPanel"
              class="text font-weight-light ml-1 mb-0 mt-0"
              style="z-index: 100"
              v-text=""
            ></span>
            <span v-if="showAnimationPanel" class="subheading font-weight-light mr-1" style="z-index: 100"> Animation </span>
            
            <v-slider v-if="showAnimationPanel" class="mb-0 mt-0 pb-0 pt-0" style="z-index: 100; width: 400px; height: 0px" 
                v-model="animVal"
                :thumb-color="animSlider.color"
                :max="animSlider.max"
                :min="animSlider.min"
              ></v-slider>
              
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
              <v-divider v-if="userViews.length !== 0"></v-divider>
              <v-list-item v-for="view in userViews" :key="view.id" @click="setNamedView(view.id)">
                <v-list-item-title>{{ view.name }}</v-list-item-title>
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

          
          <v-menu top close-on-click offset-y style="z-index: 100">
            <template #activator="{ on: onMenu, attrs: menuAttrs }">
              <v-tooltip top>
                <template #activator="{ on: onTooltip, attrs: tooltipAttrs }">
                  <v-btn color="primary" 
                    small
                    v-bind="{ ...tooltipAttrs, ...menuAttrs }"
                    v-on="{ ...onTooltip, ...onMenu }"
                  >
                    <v-icon small>mdi-layers-triple</v-icon>
                  </v-btn>
                </template>
                Select Analysis Layer
              </v-tooltip>
            </template>
            <v-list dense>
              <v-list-item @click="showVis()">
                <v-list-item-title>No added properties</v-list-item-title>
              </v-list-item>
              <v-divider v-if="allVisuals.length !== 0"></v-divider>
              <v-list-item v-for="vis in allVisuals" @click="showVis(vis)">
                <v-list-item-title>{{ vis }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="nextView(-1)" v-on="on">
                <v-icon small>mdi-arrow-left-bold</v-icon>
              </v-btn>
            </template>
            Previous View
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="nextView(1)" v-on="on">
                <v-icon small>mdi-arrow-right-bold</v-icon>
              </v-btn>
            </template>
            Next View
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="nextSlide(-1)" v-on="on">
                <v-icon small>mdi-skip-previous-circle</v-icon>
              </v-btn>
            </template>
            Previous Slide
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="nextSlide(1)" v-on="on">
                <v-icon small>mdi-skip-next-circle</v-icon>
              </v-btn>
            </template>
            Next Slide
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
        </v-btn-toggle>
      </v-card>
    </div>
  </v-sheet>
</template>
<script>
import throttle from 'lodash.throttle'
import { Viewer } from '@speckle/viewer'
import ObjectSimpleViewer from './ObjectSimpleViewer'
import StreamQuery from '../graphql/stream.gql'

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
  data() {
    return {
      streamQuery: StreamQuery,
      hasLoadedModel: false,
      loadProgress: 0,
      fullScreen: false,
      showHelp: false,
      alertMessage: null,
      showAlert: false,
      selectedObjects: [],
      showObjectDetails: false,
      showAnimationPanel: false,
      hasImg: false,
      namedViews: [],
      userViews: [],
      viewsPlayed: -1,
      allVisuals: [],
      defaultObj: [],
      animObj: [],
      visObj: [],
      activeObj: null,
      animSlider: { label: 'Time', color: 'primary', min: 5, max: 5 },
      animVal: 2,
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
    animVal(val) {
      if (this.activeObj) this.activeObj.visible = false
      /*
      let range = Array.from(new Array(this.animSlider.max-this.animSlider.min+1), (x, i) => i + this.animSlider.min)
      let ind = range.indexOf(val)
      this.activeObj = this.animObj[ind]
      this.activeObj.visible = true
      console.log(val)
      console.log(ind) */
      
      this.animObj.forEach(obj => {
        if (obj.userData.userAnimation && obj.userData.userAnimation == val)  {
          obj.visible = true 
          this.activeObj = obj 
          return
        }
      })
    },
    loadProgress(newVal) {
      if (newVal >= 99) {
        let views = window.__viewer.interactions.getViews()
        this.namedViews.push(...views)

        //get user views
        let tempViews = window.__viewer.sceneManager.views
        let ids = []
        tempViews.forEach(obj => {
          let currentID = parseInt(obj.applicationId)
          console.log("__________________")
          console.log(currentID)
          if (obj.userSlides) console.log(obj.userSlides[0])

          if (ids.includes(currentID) && (!obj.userSlides )) console.log("view deleted") // do nothing, if the view already exists, and the new view doesn't have extra properties
          else {
          if (obj.userSlides) console.log(obj.userSlides[0])
            if (ids.includes(currentID)) { //delete existing duplicate view 
              console.log("delete existing view")
              let index = ids.indexOf(currentID)
              ids.splice(index, 1)
              this.userViews.splice(index, 1)
            }
            ids.push(currentID)
            obj.applicationId = currentID
            this.userViews.push(obj)
          }
        })
        this.userViews.sort((a, b) => a.applicationId < b.applicationId ? - 1 : Number(a.applicationId > b.applicationId))
        console.log(this.userViews)

        //display from the beginning only the main model, no visuals 
        console.log("objects")
        console.log(window.__viewer.sceneManager.objects)
        let set = new Set() 
        window.__viewer.sceneManager.objects.forEach((item) => {
          if (item.userData.userVisuals && item.userData.userVisuals.length > 0 && item.userData.userVisuals[0]!='') { 
            item.visible = false
            item.userData.userVisuals.forEach( obj => { if (obj && obj!=0 && obj!='Animation' && !item.userData.userVisuals.includes('Animation')) set.add(obj) } )

            if (item.userData.userVisuals.includes('Animation')) {
              console.log(item.userData.userAnimation)
              if (item.userData.userAnimation < this.animSlider.min) this.animSlider.min = item.userData.userAnimation
              if (item.userData.userAnimation > this.animSlider.max) this.animSlider.max = item.userData.userAnimation
              this.animObj.push(item)
            }else this.visObj.push(item)
          } else { this.defaultObj.push(item), item.visible = true }
        })
        //console.log(this.animObj)
        this.animObj.sort((a, b) => a.userData.userAnimation < b.userData.userAnimation ? - 1 : Number(a.userData.userAnimation > b.userData.userAnimation))
        //console.log(this.animObj)
        this.allVisuals = Array.from(set)
        console.log("All Visuals:")
        console.log(this.allVisuals)

        console.log("DefaultObj: ")
        console.log(this.defaultObj)
        console.log("VisObj: ")
        console.log(this.visObj)
        console.log("AnimObj: ")
        console.log(this.animObj)
      }
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
      let previewUrl = this.objectUrl.replace('streams', 'preview') + '/' + angle
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
    showVis(visId){
      console.log(window.__viewer.sceneManager.objects)
      window.__viewer.interactions.deselectObjects()
      console.log(this.userViews)
      window.__viewer.sceneManager.objects.forEach(obj => {
        let propertyGroup = obj.userData.userVisuals
        if ( !propertyGroup || propertyGroup.length==0 || propertyGroup.includes(visId) || propertyGroup[0] == '' ) { //show obj if no Visual property OR property empty OR includes needed value OR empty atring inside
          obj.visible = true 
        } else { 
          obj.visible = false 
        }
      })
    },
    nextView(num) {
      this.viewsPlayed += num 
      if (this.userViews.length ==0 ) return
      if (this.viewsPlayed >= this.userViews.length) this.viewsPlayed = 0
      if (this.viewsPlayed <0 ) this.viewsPlayed = this.userViews.length -1
      window.__viewer.interactions.setView(this.userViews[this.viewsPlayed].id)
      console.log(this.userViews[this.viewsPlayed].applicationId)
    },
    nextSlide(num) {
      this.viewsPlayed += num
      if (this.userViews.length == 0 ) return // exit if no views saved 
      if (this.viewsPlayed >= this.userViews.length ) this.viewsPlayed = 0 
      if (this.viewsPlayed <0 ) this.viewsPlayed = this.userViews.length -1
      
      //console.log(this.viewsPlayed)
      
      window.__viewer.interactions.setView(this.userViews[this.viewsPlayed].id)
      let filterGroup = []
      if (this.userViews[this.viewsPlayed].userSlides) filterGroup = this.userViews[this.viewsPlayed].userSlides // set of visuals attached to the view 
      
      window.__viewer.interactions.deselectObjects()
      if (this.activeObj) this.activeObj.visible = false

      if (filterGroup.includes('Animation')) {
        this.showAnimationPanel = true
        this.animVal = this.animSlider.min 
        this.activeObj = this.animObj[0]
        this.activeObj.visible = true

        //let range = Array.from(new Array(this.animSlider.max-this.animSlider.min+1), (x, i) => i + this.animSlider.min)
        //console.log("range:")
        //console.log(range)
        //range.forEach(i =>  { this.doSetTimeout(i) } )
        //for ( let item = this.animSlider.min; item <=this.animSlider.max; item++) { 
        //  this.doSetTimeout(item) 
        //  if (item==this.animSlider.max) item = this.animSlider.min
        //}

      }else {
        this.showAnimationPanel = false
        this.animVal = this.animSlider.min 
        this.visObj.forEach(obj => {
          let propertyGroup = obj.userData.userVisuals
          filterGroup.forEach( fil => {
            if (!propertyGroup || propertyGroup.length==0 || propertyGroup.includes(fil) ) { //show obj if no Visual property (main model) OR property empty OR includes needed value OR empty atring inside
              obj.visible = true, this.activeObj = obj
            } else { 
              obj.visible = false 
            }
          })
        })
      }
    },
    doSetTimeout(i) {
      let objectsToIterate = this.animObj 
      let max = this.animSlider.max
      let localActiveObj = this.activeObj
      setTimeout(function() { 
        if (this.activeObj) this.activeObj.visible = false
        objectsToIterate.forEach(obj => {
          console.log(i)
          console.log(obj.userData.userAnimation)
          if ( (obj.userData.userAnimation && obj.userData.userAnimation == i) ) {
            obj.visible = true, localActiveObj = obj 
            return
          }
        })
        this.activeObj = localActiveObj
        //if (i==max) this.activeObj.visible = false
      }, 1000);
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
      if (!this.objectUrl) return
      this.hasLoadedModel = true
      window.__viewer.loadObject(this.objectUrl)
      window.__viewerLastLoadedUrl = this.objectUrl

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
    }
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
