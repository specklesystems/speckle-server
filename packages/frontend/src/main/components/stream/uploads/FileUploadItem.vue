<template>
  <v-card v-if="file" class="my-4 elevation-1" :loading="percentCompleted != -1">
    <template slot="progress">
      <v-progress-linear color="primary" height="4" :value="percentCompleted" />
    </template>
    <v-toolbar flat color="transparent">
      <v-toolbar-title>
        {{ file.name }}
        <span class="caption">{{ Math.round(file.size / 1024) }}kb</span>
      </v-toolbar-title>
      <v-spacer />
      <v-menu offset-y>
        <template #activator="{ attrs, on }">
          <v-btn
            v-tooltip="`Change the branch to upload to`"
            text
            v-bind="attrs"
            v-on="on"
          >
            <v-icon small>mdi-source-branch</v-icon>
            <span class="caption">{{ selectedBranch }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="item in branches.filter((b) => b.name != 'globals')"
            :key="item.name"
            link
            @click="selectedBranch = item.name"
          >
            <v-list-item-title class="caption">
              {{ item.name }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn color="primary" @click="upload()">Upload</v-btn>
    </v-toolbar>
    <v-alert v-if="error" type="error" dismissible>An error occurred.</v-alert>
  </v-card>
</template>
<script>
import { AppLocalStorage } from '@/utils/localStorage'

export default {
  props: {
    file: {
      type: File,
      default: () => null
    },
    branches: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    percentCompleted: -1,
    error: null,
    selectedBranch: 'main'
  }),
  methods: {
    upload() {
      const data = new FormData()
      this.error = null
      data.append('file', this.file)

      const request = new XMLHttpRequest()
      request.open(
        'POST',
        `/api/file/autodetect/${this.$route.params.streamId}/${
          this.selectedBranch ? this.selectedBranch : 'main'
        }`
      )
      request.setRequestHeader(
        'Authorization',
        `Bearer ${AppLocalStorage.get('AuthToken')}`
      )

      request.upload.addEventListener(
        'progress',
        function (e) {
          this.percentCompleted = (e.loaded / e.total) * 100
        }.bind(this)
      )

      // request finished event
      request.addEventListener(
        'load',
        function () {
          if (request.status !== 201) {
            this.error = request.response
          }

          this.$emit('done', this.file.name)
        }.bind(this)
      )

      request.addEventListener(
        'error',
        function () {
          if (request.status !== 201) {
            this.error = request.response
          }
        }.bind(this)
      )
      try {
        request.send(data)
      } catch (e) {
        this.error = 'There was an error: ' + `${e}`
      }
    }
  }
}
</script>
