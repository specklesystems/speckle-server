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
        v-show="hasLoadedModel && loadProgress >= 99"
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
                  
                  <v-btn  
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
              
              <v-list-item v-for="vis in branchNames_Checks" @click="showVis(vis[0])" v-if="!vis[0].includes('abracadabra') " 
              :style= "[vis[1]==0 ? {} : { background: '#757575' }]">
                <v-list-item-title>{{ vis[0] }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          
           <!-- TOFIX: ACCESS COLOR AS PRIMARY -->
          <input v-model="currentMessage" placeholder="type description here" class="pl-2 pr-2 mr-0.5" style="color: white; text-align: right;  background: #047EFB; opacity: 0.8 "  />

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="getCameraView()" v-on="on">
                <v-icon small>mdi-movie-open-plus-outline</v-icon>
              </v-btn>
            </template>
            Create a slide
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="agree()" v-on="on">
                <v-icon small>mdi-content-save</v-icon>
              </v-btn>
            </template>
            Save presentation
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="delete_pres()" v-on="on">
                <v-icon small>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            Delete presentation
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="nextCustomSlide(-1)" v-on="on">
                <v-icon small>mdi-arrow-left-bold</v-icon>
              </v-btn>
            </template>
            Previous View
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="nextCustomSlide(1)" v-on="on">
                <v-icon small>mdi-arrow-right-bold</v-icon>
              </v-btn>
            </template>
            Next View
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
/*
<v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn  v-bind="attrs" small @click="nextSlide(-1)" v-on="on">
                <v-icon small>mdi-skip-previous-circle</v-icon>
              </v-btn>
            </template>
            Previous Slide
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn   v-bind="attrs" small @click="nextSlide(1)" v-on="on">
                <v-icon small>mdi-skip-next-circle</v-icon>
              </v-btn>
            </template>
            Next Slide
          </v-tooltip>

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



          <v-slider v-if="showAnimationPanel==23" class="ml-3 mb-0 mt-0 pb-0 pt-0" style="z-index: 100; width: 400px; height: 0px" 
                v-model="animVal"
                :thumb-color="animSlider.color"
                :max="animSlider.max"
                :min="animSlider.min"
                ticks="always"
                tick-size="4"
              ></v-slider>

            <span v-if="showAnimationPanel==23"
            class="subheading font-weight-light"
            v-text="animVal"
          ></span>
            <span v-if="showAnimationPanel==23" class="subheading font-weight-light mr-3" style="z-index: 100"> :00 </span>

            <span 
            class="subheading font-weight-light ml-10 mr-10"
            v-text="textPanel"
          ></span>

          */
import throttle from 'lodash.throttle'
import { Viewer } from '@speckle/viewer'
import ObjectSimpleViewer from './ObjectSimpleViewer'
import StreamQuery from '../graphql/stream.gql'
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
      animSlider: { label: 'Time', color: 'primary', min: 10, max: 5 },
      animVal: 2,
      textPanel: "",

      branchQuery: null,
      branch_description: null,
      branchNames: [],
      branch_id: null,
      branch_name: "",
      branchUrls: [],
      branchCurrent_index: null,
      objectsCurrentGroup_ids: [],
      all_obj_ids_scene: [],
      custom_count: -1,
      branchNames_Checks: [],
      customSlides: [],   
      customSlides_parsed: [],
      currentMessage: "",
      loading: false,
      total_vis: []
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
      //console.log("Slider changed")
      
      if (this.activeObj && this.activeObj.constructor.name != "Array" && this.activeObj.userData.userAnimation != val) { // if changed manually, and needen object is not active yet
        //console.log("adjust active obj")
        if (this.activeObj) this.hide(this.activeObj,0)
        let range = Array.from(new Array(this.animSlider.max-this.animSlider.min+1), (x, i) => i + this.animSlider.min)
        let ind = range.indexOf(val)
        
        this.activeObj = this.animObj[ind]
        if (this.activeObj) this.hide(this.activeObj,1)

      } else if (this.activeObj && this.activeObj.constructor.name == "Array"){
        //console.log("Animation Array")
        this.activeObj.forEach(obj => this.hide(obj,0))
        this.activeObj =[]
        this.animObj.forEach(obj => {
          //console.log(obj.userData.userAnimation)
          if ( (obj.userData.userAnimation && obj.userData.userAnimation == val) ) {
            this.hide(obj,1)
            this.activeObj.push(obj) 
            this.hide(this.activeObj,1)
          }else{
            this.hide(obj,0)
          }
        })
      }
    },
    branchNames_Checks(val){
      console.log('layer hidden')
      console.log(val)
    },
    loadProgress(newVal) {
      if (newVal >= 99) {
        //console.log(window.__viewerLastLoadedUrl)

        

        let temp = this.branchQuery
        let count = 0
        
        //console.log(temp)

        temp.forEach(obj=> { // run loop for each branch name
        if (obj.name.includes('abracadabra')) this.branch_id = obj.id, this.branch_name = obj.name, this.branch_description = obj.description //, console.log(obj)
        if (!obj.name.includes('abracadabra')) {

          ///////////////////////////// TOFIX: DEAL WITH EMPTY BRANCHES
          ///////////////////////////// TOFIX: SPLIT BY STREAM, NOT SYMBOLS
          ///////////////////////////// TOFIX: GET URL WITHOUT AN OBJECT
          ///////////////////////////// TOFIX: ListItemCommit load
          ///////////////////////////// TOFIX: only if main branch has commits 
          ///////////////////////////// TOFIX: now only 1 branch can be treated because of ID
          let url = ""
          let start_url = ""

          if (this.objectUrl) start_url = this.objectUrl
          else start_url = "http://localhost:3000/streams/57ff4b8873/branches/ "
          url = start_url.split("/")[0] + "//" + start_url.split("/")[2] + "/" + start_url.split("/")[3] + "/" + start_url.split("/")[4] + "/objects/"
          //console.log(this.branchNames)

          if (!this.branchNames.includes(obj.name) ) { // execute only if branch is not in the list yet, basically the first load
              console.log("branch first upload ")
              window.__viewer.sceneManager.removeAllObjects()

              this.branchNames.push(obj.name) 
              ////////////////// TOFIX: set current branch to 0
              if(url && obj.commits.items[0]) this.branchUrls.push( url +  obj.commits.items[0].referencedObject) 
              else this.branchUrls.push( "" ) 
              this.branchNames_Checks.push([obj.name,0])

              // if iteration on the branch that is selected, push new objects there, otherwise push null
              //console.log(this.branchCurrent_index )
              //console.log(count)
              if (this.branchCurrent_index != count) this.objectsCurrentGroup_ids.push( [ ] )
              else {
                let allObj = []
                window.__viewer.sceneManager.objects.forEach((item) => {
                  allObj.push(item)
                })  
                this.objectsCurrentGroup_ids.push(allObj)
              }
                
          } 
          //else if (this.branch_description.length>100) {
            //if (total_urls[count]) window.__viewer.loadObject(total_urls[count])
          //}
          else{ // if branch namealready in the list, executes every time new layer is called, updates object lists
              //console.log("branch layer update ")
              //console.log(this.objectsCurrentGroup_ids[count])
              console.log("branch weird")
              if (this.branchCurrent_index == count && this.objectsCurrentGroup_ids[count].length==0) {  // only execute if branch is null
                console.log("branch layer update ")
                //console.log(count)
                //console.log(obj.name)
                let allObj = []
                let visibility = this.customSlides_parsed[this.custom_count].visibilities[count]
                window.__viewer.sceneManager.objects.forEach((item) => {
                  if (!this.all_obj_ids_scene.includes(item.uuid)){ //check if object is already uploaded to one of the other groups
                    this.all_obj_ids_scene.push(item.uuid)
                    allObj.push(item.uuid)
                    this.hide(item, 0)
                    //console.log(item.uuid)
                    //console.log(item)

                    if (this.branch_description && this.branch_description.length>100) this.hide(item, this.total_vis[count])
                  }
                })  
                this.objectsCurrentGroup_ids[count] = JSON.parse(JSON.stringify(allObj) )
                this.branchNames_Checks[count][1] = 1
              }
          }
          count +=1
        }
        })

        ////// load objects existing in the presentation
        let total_urls = []
        let c=0
        if (this.branch_description.length>100) {
          this.customSlides_parsed = JSON.parse(this.branch_description)

          this.customSlides_parsed.forEach(obj=> { //for each slide
            let cur_vis = obj.visibilities
            let c_local = 0
            obj.visibilities.forEach( sub_obj => { // go for all LATEST obj within the branch // visibility of entire branch applies 
              if (this.total_vis.length< obj.visibilities.length) this.total_vis.push(sub_obj) //first go
              if ( this.total_vis[c_local] < sub_obj )  this.total_vis[c_local] =  sub_obj
              c_local +=1
              //this.hide(item, 0) 
            })
            c+=1
          }) 
          console.log("Total vis")
          console.log(this.total_vis)
          let countt = 0
          this.total_vis.forEach(obj=> {
            if (obj==1) total_urls.push(this.branchUrls[countt]) 
            console.log(this.branchUrls[countt])
            //window.__viewer.loadObject(this.branchUrls[count])
            ////////////LOAD
            countt +=1
          })
        }
        
        

        console.log("New group of objects ")
        console.log(this.objectsCurrentGroup_ids)
        console.log(this.branchNames_Checks)

/////////////////////////
        
        let views = window.__viewer.interactions.getViews()
        this.namedViews.push(...views)

        //get user views
        this.userViews = []
        let tempViews = window.__viewer.sceneManager.views
        let ids = []
        tempViews.forEach(obj => {
          //console.log(obj.applicationId)
          let currentID = parseInt(obj.applicationId.toString().split("-")[0])
          //console.log("__________________")
          //console.log(currentID)
          if (obj.userSlides) console.log(obj.userSlides[0])

          if (ids.includes(currentID) && ((!obj.userSlides)||(obj.userSlides[0]=="0") ) ) console.log("view deleted") // do nothing, if the view already exists, and the new view doesn't have extra properties
          else {
            //console.log("consider new View")
            //if (obj.userSlides) console.log(obj.userSlides[0])
            if (ids.includes(currentID)) { //delete existing duplicate view 
              //console.log("delete existing view")
              let index = ids.indexOf(currentID)
              ids.splice(index, 1)
              this.userViews.splice(index, 1)
            }
            ids.push(currentID)
            obj.applicationId = currentID
            this.userViews.push(obj)
          }
          //console.log(this.userViews)
        })
        this.userViews.sort((a, b) => a.applicationId < b.applicationId ? - 1 : Number(a.applicationId > b.applicationId))


        // get newly loaded objects
        
        //console.log(window.__viewer.sceneManager.objects)
        /*
        let set = new Set() // set of unique animation names
        
          if (item.userData.userVisuals && item.userData.userVisuals.length > 0 && item.userData.userVisuals[0]!='') { 
            this.hide(item,1)
            item.userData.userVisuals.forEach( obj => { if (obj && obj!=0 && obj!="0" && obj!='Animation' && !item.userData.userVisuals.includes('Animation')) set.add(obj) } )

            if (item.userData.userVisuals.includes('Animation')) {
              //console.log(item.userData.userAnimation)
              if (item.userData.userAnimation < this.animSlider.min) this.animSlider.min = item.userData.userAnimation
              if (item.userData.userAnimation > this.animSlider.max) this.animSlider.max = item.userData.userAnimation
              this.animObj.push(item)
            }else this.visObj.push(item)
          } else {  }
        
        this.animVal = this.animSlider.min 
        this.animObj.sort((a, b) => a.userData.userAnimation < b.userData.userAnimation ? - 1 : Number(a.userData.userAnimation > b.userData.userAnimation))
        this.allVisuals = Array.from(set)
          */
        

        /*
        console.log("All Visuals:")
        console.log(this.allVisuals)
        

        console.log("DefaultObj: ")
        console.log(this.defaultObj)
        console.log("VisObj: ")
        console.log(this.visObj)
        console.log("AnimObj: ")
        console.log(this.animObj)
        */

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
    
    //console.log(window.__viewerLastLoadedUrl)

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
      let start_url = ""
      if(this.objectUrl) start_url = this.objectUrl
      else start_url = "http://localhost:3000/streams/57ff4b8873/branches/experiment"
      let previewUrl = start_url.replace('streams', 'preview') + '/' + angle
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
    
    nextView(num) {
      this.viewsPlayed += num 
      console.log(num)
      if (this.userViews.length ==0 ) return // exit if no views saved 
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
      window.__viewer.interactions.deselectObjects()

      let filterGroup = []
      if (this.userViews[this.viewsPlayed].userSlides) filterGroup = this.userViews[this.viewsPlayed].userSlides // set of visuals attached to the view 
      
      if (filterGroup && filterGroup.length>0) console.log(filterGroup), this.textPanel = "   " + filterGroup[filterGroup.length-1].toString() + "   " //.split("[")[1].split("]")[0] 

      if (filterGroup.includes('Animation') && this.activeObj.constructor.name != "Array") {
        this.showAnimationPanel = true
        this.animVal = this.animSlider.min 
        this.activeObj = this.animObj[0]
        this.hide(this.activeObj,1)
        this.animate() 

      }else {
        // hide all animated objects
        this.showAnimationPanel = false
        this.animVal = this.animSlider.min 
        if (this.activeObj && this.activeObj.constructor.name == "Array"){
          console.log("Animation Array")
          this.activeObj.forEach(obj => this.hide(obj,0))
          this.activeObj =[]
          this.animObj.forEach(obj => this.hide(obj,0)  )
        }
      } 
      if (this.activeObj) { this.hide(this.activeObj,0) }
      this.visObj.forEach(obj => {
          this.hide(obj,0)
          let propertyGroup = obj.userData.userVisuals
          
          filterGroup.forEach( fil => {
            if (!propertyGroup || propertyGroup.length==0 || propertyGroup.includes(fil) ) { //show obj if no Visual property (main model) OR property empty OR includes needed value OR empty atring inside
              this.hide(obj,1), this.activeObj = obj, this.hide(this.activeObj,1)
            } 
          })
        })
      
    },
    animate(){ 
      let range = Array.from(new Array(this.animSlider.max-this.animSlider.min), (x, i) => i + this.animSlider.min)
      //console.log(range)
      //console.log(this.animSlider.min)
      //console.log(this.animSlider.max)
      for (let i in range) {
        setTimeout(() => {
          //console.log("TIMEOUT running")
          //console.log(i+this.animSlider.min)
          if (this.activeObj) this.hide(this.activeObj,0)
          this.activeObj =[]
          this.animObj.forEach(obj => {
            //console.log(obj.userData.userAnimation)
            if ( (obj.userData.userAnimation && obj.userData.userAnimation <= i+this.animSlider.min) ) {
              this.hide(obj,1)
              //console.log(obj)
              this.activeObj.push(obj) 
              //console.log(this.activeObj)
              this.hide(this.activeObj,1)
            }else{
              this.hide(obj,0)
            }
          })
          //this.animVal = i+this.animSlider.min
          //console.log("slider reset to: ")
          //console.log(this.animVal)
          //console.log(this.activeObj)
        }, 
        i++ * 200);
      } //console.log(this.activeObj)
    },
    checks(){
      this.loadProgress = 99
    },







    async agree() {
      //if (!this.$refs.form.validate()) return
      console.log(JSON.stringify(this.customSlides_parsed))
      this.loading = true
      this.$matomo && this.$matomo.trackPageView('branch/update')
      await this.$apollo.mutate({
        mutation: gql`
          mutation branchUpdate($params: BranchUpdateInput!) {
            branchUpdate(branch: $params)
          }
        `,
        variables: {
          params: {
            streamId: this.$route.params.streamId,
            id: this.branch_id, //this.$route.params.branch.id,
            name: this.branch_name,
            description: JSON.stringify(this.customSlides_parsed)
          }
        }
      })

      this.loading = false

      //this.resolve({
      //  result: true,
      //  name: this.branch_name
      //})
      this.dialog = false
    },


    showVis(visId){
      let index = this.branchNames.indexOf(visId)
      console.log("setting index")
      console.log(index)
      console.log(this.branchNames_Checks)

      let url = this.branchUrls[index]
      this.branchCurrent_index = index
      if (!this.branchNames_Checks[index][1] ==1  )  window.__viewer.loadObject(url), this.branchNames_Checks[index][1] =1  // run only if data is not On
      else {
        this.branchNames_Checks[index][1] = 0
        let count = 0
        this.objectsCurrentGroup_ids.forEach(obj => { //going through each branch
          if (count==index) { // get branch that was unselected 

            let count_sub = 0
            obj.forEach( sub_obj => { // go for all LATEST obj within the branch // visibility of entire branch applies 
              window.__viewer.sceneManager.objects.forEach((item) => {
                if ( item.uuid == sub_obj ){ //check if object is already uploaded to one of the other groups
                  this.hide(item, 0) 
                  this.branchNames_Checks[count][1] = 0
                }
              }) 
              count_sub +=1
            })

          }
          count +=1
        })
      }
      
    },




    getCameraView(){
      //console.log(window.__viewer.interactions.getViews)
      //console.log("GET CAMERA VIEW")
      //console.log(window.__viewer.sceneManager.viewer.camera)
      //console.log(window.__viewer.sceneManager.viewer.controls)
      //console.log(this.$route)
      //console.log(this.streamQuery)

      let cam = window.__viewer.sceneManager.viewer.camera.matrix.elements
      let contr = window.__viewer.sceneManager.viewer.controls
      let visib = []
      this.branchNames_Checks.forEach(obj=> visib.push(obj[1]) )

      this.customSlides.push({
        cam_position: { x: cam[12],y: cam[13],z: cam[14] }, azim: contr.azimuthAngle, polar: contr.polarAngle, target:contr._target, cam_up: [cam[4],cam[5],cam[6]],
        visibilities: visib, 
        msg:this.currentMessage, 
        obj_id: this.objectsCurrentGroup_ids
      })
      this.customSlides_parsed.push( JSON.parse(JSON.stringify(this.customSlides[this.customSlides.length-1])) )
      console.log("SAVE SLIDES: ")
      console.log( this.customSlides_parsed)
    },
    nextCustomSlide(num) {
      if (this.customSlides_parsed.length>0){
        
        this.custom_count += num
        if (this.customSlides_parsed.length == 0 ) return // exit if no views saved 
        if (this.custom_count >= this.customSlides_parsed.length ) this.custom_count = 0 
        if (this.custom_count <0 ) this.custom_count = this.customSlides_parsed.length -1
        
        // get desired camera settings
        let position1 = this.customSlides_parsed[this.custom_count].cam_position
        let az1 = this.customSlides_parsed[this.custom_count].azim
        let pol1 = this.customSlides_parsed[this.custom_count].polar
        let target1 = this.customSlides_parsed[this.custom_count].target

        window.__viewer.interactions.setLookAt(position1,target1)
        this.currentMessage = this.customSlides_parsed[this.custom_count].msg

        console.log("SLIDE SHOWING:  ")
        console.log(this.custom_count)
        console.log(this.customSlides_parsed[this.custom_count])

        // get objects and visibilities 
        let count=0
        this.customSlides_parsed[this.customSlides_parsed.length-1].obj_id.forEach( obj => { // go object by object in the slide 
          console.log("Slide branch # " + count.toString() + " object IDs:" )
          console.log(obj)
          let count_sub = 0
          //console.log(this.customSlides_parsed[this.customSlides_parsed.length-1]) //take LATEST object set with all loaded objects
          let visibility = this.customSlides_parsed[this.custom_count].visibilities[count]
          this.branchNames_Checks[count][1] = visibility

          obj.forEach( sub_obj => { // go for all LATEST obj within the branch // visibility of entire branch applies 
              let item_exists = 0
              window.__viewer.sceneManager.objects.forEach( item => {
                if ( item.uuid == sub_obj ){ //check if object is already uploaded to one of the other groups
                  item_exists +=1
                  this.hide(item, visibility) 
                }
              }) 
              let url = ""
              let start_url = ""

              if (this.objectUrl) start_url = this.objectUrl
              else start_url = "http://localhost:3000/streams/57ff4b8873/branches/ "
              url = start_url.split("/")[0] + "//" + start_url.split("/")[2] + "/" + start_url.split("/")[3] + "/" + start_url.split("/")[4] + "/objects/" + sub_obj

              if (item_exists==0) window.__viewer.loadObject(url)
              count_sub +=1 
          })
          count+=1
        })

        console.log("SLIDE completed SHOWING: ")
        console.log(this.custom_count)

      }
    },
    delete_pres(){
      this.customSlides_parsed = []
      this.agree()
      window.__viewer.sceneManager.objects.forEach(obj=> hide(obj,0))

    },
    hide(obj,i){
      if (i==0) {
        obj.visible = false 
        if (obj.scale) obj.scale.x=0, obj.scale.y=0, obj.scale.z=0
      }
      if (i==1) {
        obj.visible = true
        if (obj.scale) obj.scale.x=1, obj.scale.y=1, obj.scale.z=1
      }
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
            ////////////// TOFIX: Zoom on first load
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
