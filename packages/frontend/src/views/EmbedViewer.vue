<template>
  <v-app class="no-scrollbar">
    <speckle-loading v-if="!stream || error" :error="error" style="z-index: 101" />
    <div v-if="!error" class="no-scrollbar embed-view">
      <div class="top-left ma-2 d-flex">
        <v-btn
          x-small
          outlined
          color="primary"
          elevation="0"
          href="http://speckle.systems"
          target="blank"
        >
          Powered by
          <img src="@/assets/logo.svg" height="10" />
          Speckle
        </v-btn>
      </div>

      <div v-if="stream" class="top-right ma-2 d-flex flex-column justify-end">
        <div class="d-flex">
          <div class="d-flex" :class="{ 'flex-column': isSmall, 'flex-row-reverse': !isSmall }">
            <div class="d-flex justify-end">
              <v-tooltip bottom max-width="600">
                <template #activator="{ on, attrs }">
                  <v-btn
                    v-if="stream && serverInfo"
                    color="secondary"
                    x-small
                    v-bind="attrs"
                    class="mr-2"
                    @click="hideDetails = !hideDetails"
                    v-on="on"
                  >
                    <v-icon small>{{ hideDetails ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                  </v-btn>
                </template>
                <span>{{ hideDetails ? 'Show' : 'Hide' }} stream details</span>
              </v-tooltip>
            </div>
            <div
              v-if="!hideDetails"
              class="d-flex"
              :class="isSmall ? 'flex-column align-start mt-2' : null"
            >
              <v-btn-toggle class="pb-2 pr-2 transparent justify-end no-events">
                <v-btn x-small class="primary">Stream</v-btn>
                <v-btn x-small>
                  {{ stream.name | truncate }}
                </v-btn>
              </v-btn-toggle>
              <v-btn-toggle
                v-if="displayType != 'stream'"
                class="pb-2 pr-2 transparent justify-end no-events"
              >
                <v-btn x-small class="success">
                  {{ displayType }}
                </v-btn>
                <v-btn x-small>
                  {{ input[displayType] | truncate }}
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
          <v-tooltip bottom max-width="600">
            <template #activator="{ on, attrs }">
              <v-btn
                v-if="stream && serverInfo"
                color="primary"
                x-small
                :href="goToServerUrl"
                target="blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon small>mdi-open-in-new</v-icon>
              </v-btn>
            </template>
            <span>View stream in {{ serverInfo.name }}</span>
          </v-tooltip>
        </div>
        <div class="d-flex justify-end"></div>
      </div>
      <renderer v-if="stream" :object-url="objectUrl" embeded show-selection-helper></renderer>
    </div>
  </v-app>
</template>

<script>
import Renderer from '../components/Renderer.vue'
import SpeckleLoading from '../components/SpeckleLoading.vue'
import { getCommit, getLatestBranchCommit, getServerInfo } from "@/embed/speckleUtils";

export default {
  name: 'EmbedViewer',
  components: { Renderer, SpeckleLoading },
  filters: {
    truncate: function (str, n = 20) {
      return str.length > n ? str.substr(0, n - 3) + '...' : str
    }
  },
  async beforeMount() {
    try {
      var serverInfoResponse = await getServerInfo()
      this.serverInfo = serverInfoResponse.data.serverInfo
    } catch (e) {
      this.error = e.message
      return
    }
    if(this.displayType === 'commit'){
      try {
        var res = await getCommit(this.input.stream, this.input.commit)
        var data = res.data
        var latestCommit = data.stream.commit
        if (this.input.object === undefined) this.objectId = latestCommit.referencedObject
        this.specificCommit = data.stream
      } catch (e) {
        this.error = e.message
        return
      }
    } else {
      try {
        var res = await getLatestBranchCommit(this.input.stream, this.input.branch)
        var data = res.data
        console.log(data)
        var latestCommit = data.stream.branch.commits.items[0] || data.stream.branch.commit
        if (!latestCommit) {
          this.error = 'No commit for this branch'
          this.lastCommit = data.stream
          return
        }
        if (this.input.object == undefined) this.objectId = latestCommit.referencedObject
        else this.objectId = this.input.object
        this.lastCommit = data.stream
      } catch (e) {
        this.error = e.message
        return
      }
    }
  },
  data() {
    return {
      hideDetails: false,
      error: null,
      objectId: this.$route.query.object,
      input: {
        stream: this.$route.query.stream,
        object: this.$route.query.object,
        branch: this.$route.query.branch || 'main',
        commit: this.$route.query.commit
      },
      lastCommit: null,
      specificCommit: null,
      serverInfo: null
    }
  },
  computed: {
    isSmall() {
      return this.$vuetify.breakpoint.name == 'xs' || this.$vuetify.breakpoint.name == 'sm'
    },
    displayType() {
      if (!this.input.stream) {
        return 'error'
      }

      if (this.input.commit) return 'commit'
      if (this.input.object) return 'object'
      if (this.input.branch) return 'branch'

      return 'stream'
    },
    stream() {
      return this.lastCommit || this.specificCommit
    },
    objectUrl() {
      return `${window.location.protocol}//${window.location.host}/streams/${this.input.stream}/objects/${this.objectId}`
    },
    goToServerUrl() {
      var stream = this.input.stream
      var base = `${window.location.origin}/streams/${stream}/`

      var commit = this.input.commit
      if (commit) return base + `commits/${commit}`

      var object = this.objectId
      if (object) return base + `objects/${object}`

      var branch = this.input.branch
      if (branch) return base + `branches/${encodeURI(branch)}`

      return base
    }
  },
  watch: {
    displayType(oldVal, newVal) {
      if (newVal == 'error') this.error = 'Provided details were invalid'
      else {
        this.error = null
      }
    }
  },
  mounted() {
    // Hide details by default if screen is small or tiny
    if (this.isSmall) this.hideDetails = true
  },
  methods: {}
}
</script>

<style lang="scss">
body::-webkit-scrollbar {
  display: none;
}
.embed-view {
  height: 100vh !important;
  width: 100vw !important;

  &::-webkit-scrollbar {
    display: none;
  }
}

.no-scrollbar {
  overflow: hidden;
  &::-webkit-scrollbar {
    display: none;
  }
}

.no-events {
  pointer-events: none;
}
</style>
