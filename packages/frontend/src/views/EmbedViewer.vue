<template lang="html">
  <v-app class="no-scrollbar">
    <speckle-loading v-if="$apollo.queries.loading || error" :error="error" style="z-index: 101" />
    <div v-else class="no-scrollbar embed-view">
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

      <div class="top-right ma-2 d-flex">
        <v-btn
          v-if="$apollo.data.stream && $apollo.data.serverInfo"
          color="primary"
          small
          href=""
          target="blank"
        >
          View
          <em class="pl-1 pr-1">
            <b>
              {{ $apollo.data.stream.name }}
            </b>
            ({{ $apollo.data.stream.id }})
          </em>
          in
          <em>{{ $apollo.data.serverInfo.name }}</em>
        </v-btn>
      </div>
      <renderer
        v-if="input.stream"
        :object-url="objectUrl"
        embeded
        show-selection-helper
      ></renderer>
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
  data() {
    return {
      error: null,
      input: {
        stream: this.$route.query.stream,
        object: this.$route.query.object,
        branch: this.$route.query.branch || 'main'
      }
    }
  },
  apollo: {
    stream: {
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
          branch: this.input.branch
        }
      },
      error(err) {
        console.error(err)
        this.error = err
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
        this.error = err
      }
    }
  },
  computed: {
    displayType() {
      if (!this.input.stream) {
        return 'error'
      }
      if (this.input.object) return 'object'
      if (this.input.branch) return 'branch'
      return 'stream'
    },

    objectUrl() {
      var objId = this.input.object || this.stream?.branch?.commits?.items[0]?.referencedObject

      return `${window.location.protocol}//${window.location.host}/streams/${this.input.stream}/objects/${objId}`
    }
  },
  watch: {
    displayType(oldVal, newVal) {
      console.log(oldVal, newVal)
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
