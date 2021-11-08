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
              <v-divider v-if="namedViews.length !== 0"></v-divider>
              <v-list-item v-for="view in namedViews" :key="view.id" @click="setNamedView(view.id)">
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

          <v-menu top close-on-click offset-y style="z-index: 100" v-if="$route.params.branchName.includes('wip')">
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
              
              <v-list-item v-for="vis in branches.names" @click="showVis(vis)"  
              :style= "[!display.branchName.includes(vis) ? {} : { background: '#757575' }]">
                <v-list-item-title>{{ vis }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-tooltip top >
            <template #activator="{ on, attrs }">
              <v-btn  v-bind="attrs" small @click="slideSwitch(-1)" v-on="on">
                <v-icon small>mdi-arrow-left-bold</v-icon>
              </v-btn>
            </template>
            Previous slide
          </v-tooltip>
          
          <input v-model="display.message" readonly class="pl-2 pr-2 mr-0.5" style="color: white; text-align: center; opacity: 0.8 "  />

          <v-tooltip top >
            <template #activator="{ on, attrs }">
              <v-btn  v-bind="attrs" small @click="slideSwitch(1)" v-on="on">
                <v-icon small>mdi-arrow-right-bold</v-icon>
              </v-btn>
            </template>
            Next slide
          </v-tooltip>

          <!-- TOFIX: ACCESS COLOR AS PRIMARY -->
          <input v-model="actions.currentMessage" 
            v-if="$route.params.branchName.includes('wip')"
            placeholder="type description here" 
            class="pl-2 pr-2 mr-0.5" 
            style="color: white; text-align: center;  background: #047EFB; opacity: 0.8 "  />

          <v-tooltip top v-if="$route.params.branchName.includes('wip')">
            <template #activator="{ on, attrs }">
              <v-btn color="primary"  v-bind="attrs" small @click="slideCreate()" v-on="on">
                <v-icon small>mdi-movie-open-plus-outline</v-icon>
              </v-btn>
            </template>
            Create a slide
          </v-tooltip>

          <v-menu top close-on-click offset-y style="z-index: 100" v-if="$route.params.branchName.includes('wip')">
            <template #activator="{ on: onMenu, attrs: menuAttrs }">
              <v-tooltip top >
                <template #activator="{ on: onTooltip, attrs: tooltipAttrs }">
                  <v-btn color="error"  
                    v-bind="{ ...tooltipAttrs, ...menuAttrs }" 
                    small  
                    v-on="{ ...onTooltip, ...onMenu }">
                    <v-icon small>mdi-content-save</v-icon>
                  </v-btn>
                </template>
                Save presentation
                </v-tooltip>
              </template>
            <v-list dense>
              
              <v-list-item @click="save_pres(1)">
                <v-list-item-title>Save as draft</v-list-item-title>
              </v-list-item>
              <v-list-item @click="save_pres(2)">
                <v-list-item-title>Save and publish</v-list-item-title>
              </v-list-item>

            </v-list>
          </v-menu>

          <v-tooltip top v-if="$route.params.branchName.includes('wip')">
            <template #activator="{ on, attrs }">
              <v-btn color="error"  v-bind="attrs" small @click="delete_pres()" v-on="on">
                <v-icon small>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            Delete presentation
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

      branchQuery: null,
      branches: {names:[], url: [], uuid:[], objId:[], visible:[] },
      display: {index: [], branchName: [], message:"" },
      actions: {pastBranch: null, currentMessage: null, currentSlideNum: null },
      slidesSaved: []

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
      //if (!this.objectUrl) return
      this.hasLoadedModel = true
      //window.__viewer.loadObject(this.objectUrl)
      window.__viewerLastLoadedUrl = this.objectExistingUrl

      let start_url =   window.location.origin + "/streams/" + this.$route.params.streamId //+ "/branches/"  //"http://localhost:3000/streams/57ff4b8873/branches/ "
      this.branchQuery.forEach(obj=> { // run loop for each branch name
        if (obj.name == this.$route.params.branchName) { // get details of current branhc (could be in props)
          //this.branch_id = obj.id
          //this.branch_name = obj.name
          //this.branch_description = obj.description 
        }
        
        //// fill all the branch lists and upload objects
        if (!obj.name.includes('presentations/') && obj.commits.items[0]) {
          console.log(obj)
          this.branches.names.push(obj.name) 
          this.branches.visible.push(0) 
          this.branches.url.push(start_url + "/objects/" +   obj.commits.items[0].referencedObject)
          this.branches.objId.push(obj.commits.items[0].referencedObject)
          this.branches.uuid.push([])
        }
          
      })
      console.log(this.branches)
      this.loadProgress = 100
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
      let index_past = this.branches.names.indexOf(this.actions.pastBranch) 
      let start_url =   window.location.origin + "/streams/" + this.$route.params.streamId 

      // assign previous objects to a previously switched branch 
      window.__viewer.sceneManager.objects.forEach(obj=> {
        let assigned = 0
        this.branches.uuid.forEach(item =>{ // go through each branch (list of objects)
          if (item.includes(obj.uuid)) {
            assigned = 1
            return
          }
        })
        if (assigned == 0) this.branches.uuid[index_past].push(obj.uuid)
      })
      ////////////////////////////////////////////// SHOW or upload DATA 
      if (!this.branches.visible[index] == 1  )  {
        this.branches.visible[index] = 1 
        this.display.index.push(index)
        this.display.branchName.push(name)
        var sub_count = 0
        if (this.branches.uuid[index].length>0){ // if uuids are loaded
          console.log(this.branches.uuid[index])
          this.branches.uuid[index].forEach(obj => { //going through each object (if uuid loaded)
            let exists = 0
            window.__viewer.sceneManager.objects.forEach(sub_obj => { // find uuid in existing scene objects
              if (sub_obj.uuid == obj) {
                this.hide(sub_obj, 1) 
                exists +=1 
                return 
              }
            })
            if (exists ==0){ 
              window.__viewer.loadObject(start_url + "/objects/" +  this.branches.objId[index])
            }
            sub_count += 1
          })
        }else{
          window.__viewer.loadObject(start_url + "/objects/" +  this.branches.objId[index])
        }
      } else {    //////////////////////////////////////////////  HIDE DATA
        this.branches.visible[index] = 0 
        this.display.index.splice(this.display.index.indexOf(index), 1)
        this.display.branchName.splice(this.display.index.indexOf(index), 1)
        var sub_count = 0
        this.branches.uuid[index].forEach(obj => { //going through each branch
          window.__viewer.sceneManager.objects.forEach(sub_obj => { // find uuid in existing scene objects
            if (sub_obj.uuid == obj) {
              this.hide(sub_obj, 0) 
              return 
            }
          })
           sub_count += 1
        })
      }
      console.log("Displayed branches: " + this.display.branchName.toString())
      this.actions.pastBranch = name

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
    slideSwitch(num){

    },
    slideCreate(){
      let cam = window.__viewer.sceneManager.viewer.camera.matrix.elements
      let contr = window.__viewer.sceneManager.viewer.controls
      
      let slide = {
        user_message: "DO NOT EDIT THIS FIELD", 
        cam_position: { x: cam[12],y: cam[13],z: cam[14] }, 
        target: contr._target, 
        visibilities: this.branches.visible, 
        msg: this.currentMessage
      }
      this.slidesSaved.push( JSON.parse(JSON.stringify(slide)) )
      this.actions.currentMessage = "Slide #" + this.slidesSaved.length.toString() + " added!"
      this.actions.currentSlideNum +=1
    },
    save_pres(num){
      if (num==1){ // keep draft
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
              description: JSON.stringify(this.slidesSaved)
            }
          }
        })
      }
      if (num==2){ // save and publish
      let new_name = this.$route.params.branchName.replace(" wip","").replace("wip ","").replace("wip","")
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
              description: JSON.stringify(this.slidesSaved)
            }
          }
        })
        window.location.href = (window.location.origin + "/streams/" + this.$route.params.streamId + "/branches/"+new_name)
      }
    },
    delete_pres(){

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