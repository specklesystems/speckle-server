<template lang="html">
  <v-app class="no-scrollbar">
    <speckle-loading v-if="!stream || error" :error="error" style="z-index: 101" />
    <div v-if="!error" class="no-scrollbar embed-view">
      <div class="top-left ma-2">
        <v-btn
          small
          outlined
          color="primary"
          elevation="0"
          href="http://speckle.systems"
          target="blank"
        >
          Powered by
          <img src="@/assets/logo.svg" height="16" />
          Speckle
        </v-btn>
      </div>

      <div class="top-right ma-2 d-flex flex-column justify-end">
        <div class="d-flex justify-end">
          <v-btn
            v-if="stream && serverInfo"
            color="primary"
            small
            :href="goToServerUrl"
            target="blank"
          >
            View
            <em class="pl-1 pr-1">
              <b>
                {{ stream.name | truncate }}
              </b>
            </em>
            in
            <em>{{ serverInfo.name }}</em>
          </v-btn>
        </div>
        <div class="d-flex">
          <v-btn-toggle class="pt-2 pr-2 transparent justify-end">
            <v-btn x-small class="primary">Stream</v-btn>
            <v-btn x-small>
              {{ input.stream }}
            </v-btn>
          </v-btn-toggle>
          <v-btn-toggle class="pt-2 transparent justify-end">
            <v-btn x-small class="success">
              {{ displayType }}
            </v-btn>
            <v-btn x-small>
              {{ input[displayType] | truncate }}
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>
      <renderer v-if="stream" :object-url="objectUrl" embeded show-selection-helper></renderer>
    </div>
  </v-app>
</template>

<script>
import gql from 'graphql-tag'
import Renderer from '../components/Renderer.vue'
import SpeckleLoading from '../components/SpeckleLoading.vue'
export default {
  name: 'EmbedViewer',
  components: { Renderer, SpeckleLoading },
  filters: {
    truncate: function (str, n = 20) {
      return str.length > n ? str.substr(0, n - 3) + '...' : str
    }
  },
  data() {
    return {
      error: null,
      input: {
        stream: this.$route.query.stream,
        object: this.$route.query.object,
        branch: this.$route.query.branch,
        commit: this.$route.query.commit
      }
    }
  },
  apollo: {
    lastCommit: {
      query: gql`
        query Stream($id: String!, $branch: String!) {
          stream(id: $id) {
            id
            name
            description
            isPublic
            branch(name: $branch) {
              commits(limit: 1) {
                totalCount
                items {
                  referencedObject
                }
              }
            }
          }
        }
      `,
      variables() {
        return {
          id: this.input.stream,
          branch: this.input.branch || 'main'
        }
      },
      error(err) {
        console.log(err.message)
        this.error = err.message
      },
      update(data) {
        var latestCommit = data.stream.branch.commits.items[0] || data.stream.branch.commit
        if (!latestCommit) {
          this.error = 'No commit for this branch'
          return data.stream
        }
        if (this.input.object == undefined) this.input.object = latestCommit.referencedObject
        return data.stream
      },
      skip() {
        return this.displayType === 'commit'
      }
    },
    specificCommit: {
      query: gql`
        query Stream($id: String!, $commit: String!) {
          stream(id: $id) {
            id
            name
            description
            isPublic
            commit(id: $commit) {
              referencedObject
            }
          }
        }
      `,
      variables() {
        return {
          id: this.input.stream,
          commit: this.input.commit
        }
      },
      error(err) {
        console.log(err.message)
        this.error = err.message
      },
      update(data) {
        var latestCommit = data.stream.commit || data.stream.branch.commits.items[0]
        if (!latestCommit) {
          this.error = 'No commit for this branch'
          return data.stream
        }
        if (this.input.object == undefined) this.input.object = latestCommit.referencedObject
        return data.stream
      },
      skip() {
        return this.displayType !== 'commit'
      }
    },
    serverInfo: {
      query: gql`
        query ServerInfo {
          serverInfo {
            name
          }
        }
      `,
      error(err) {
        console.error(err)
        this.error = err.message
      }
    }
  },
  computed: {
    displayType() {
      if (!this.input.stream) {
        return 'error'
      }

      if (this.input.branch) return 'branch'
      if (this.input.commit) return 'commit'
      if (this.input.object) return 'object'

      return 'stream'
    },
    stream() {
      return this.lastCommit || this.specificCommit
    },
    objectUrl() {
      return `${window.location.protocol}//${window.location.host}/streams/${this.input.stream}/objects/${this.input.object}`
    },
    goToServerUrl() {
      var stream = this.input.stream
      var base = `${window.location.origin}/streams/${stream}/`

      var branch = this.input.branch
      if (branch) return base + `branches/${encodeURI(branch)}`

      var commit = this.input.commit
      if (commit) return base + `commits/${commit}`

      var object = this.input.object
      if (object) return base + `objects/${object}`
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
</style>
