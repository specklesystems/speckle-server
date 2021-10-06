<template>
  <v-card v-if="file" class="my-4 elevation-1" :loading="percentCompleted != -1">
    <template slot="progress">
      <v-progress-linear color="primary" height="4" :value="percentCompleted"></v-progress-linear>
    </template>
    <v-toolbar flat color="transparent">
      <v-toolbar-title>
        {{ file.name }}
        <span class="caption">{{ file.size }}kb</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="upload()" color="primary">Upload</v-btn>
    </v-toolbar>
    <v-alert v-if="error" type="error" dismissible>An error occurred.</v-alert>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  props: ['file'],
  data: () => ({
    percentCompleted: -1,
    error: null
  }),
  apollo: {
    streams: {
      query: gql`
        query Streams($query: String) {
          streams(query: $query) {
            totalCount
            cursor
            items {
              id
              name
              updatedAt
            }
          }
        }
      `,
      variables() {
        return {
          query: this.search
        }
      },
      skip() {
        return !this.search || this.search.length < 3
      },
      debounce: 300
    }
  },
  watch: {},
  methods: {
    upload() {
      let data = new FormData()
      this.error = null
      data.append('file', this.file)

      let request = new XMLHttpRequest()
      request.open('POST', `/api/file/ifc/${this.$route.params.streamId}`)
      request.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('AuthToken')}`)

      request.upload.addEventListener(
        'progress',
        function (e) {
          this.percentCompleted = (e.loaded / e.total) * 100
          if (this.percentCompleted >= 100) { 
            this.$emit('done', this.file.name)
          }
        }.bind(this)
      )

      // request finished event
      request.addEventListener(
        'load',
        function () {
          if (request.status !== 200) {
            this.error = request.response
          }

          this.$emit('done', this.file.name)
        }.bind(this)
      )

      request.addEventListener(
        'error',
        function () {
          if (request.status !== 200) {
            this.error = request.response
          }
        }.bind(this)
      )
      try {
        request.send(data)
      } catch (e) {
        this.error = 'There was an error: ' + e
      }
    }
  }
}
</script>
