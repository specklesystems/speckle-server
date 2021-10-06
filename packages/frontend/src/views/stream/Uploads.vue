<template>
  <div>
    <no-data-placeholder v-if="false" :show-image="false">
      <h2>Import IFC Files</h2>
      <p class="caption">
        Speckle can now process IFC files and store them as a commit (snapshot). You can then access
        it from the Speckle API, and receive it in other applications.
      </p>
      <template #actions>
        <v-list rounded class="transparent">
          <v-list-item link class="primary mb-4" dark @click="showUploadDialog = true">
            <v-list-item-icon>
              <v-icon>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Upload IFC File</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            link
            :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} mb-4`"
            href="https://speckle.guide/dev/server-webhooks.html"
            target="_blank"
          >
            <v-list-item-icon>
              <v-icon>mdi-book-open-variant</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Release Announcement</v-list-item-title>
              <v-list-item-subtitle class="caption"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </no-data-placeholder>

    <error-placeholder v-if="error" error-type="access">
      <h2>Only stream owners can access webhooks.</h2>
      <p class="caption">
        If you need to use webhooks, ask the stream's owner to grant you ownership.
      </p>
    </error-placeholder>

    <v-container style="max-width: 768px">
      <portal to="streamTitleBar">
        <div>
          <v-icon small class="mr-2 hidden-xs-only">mdi-arrow-up</v-icon>
          <span class="space-grotesk">Import IFC</span>
        </div>
      </portal>

      <v-card elevation="1" rounded="lg" :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
        <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'white' : ''} mb-2`">
          <v-toolbar-title>
            <v-icon class="mr-2" small>mdi-arrow-up</v-icon>
            <span class="d-inline-block">Import IFC Files - Alpha</span>
          </v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          Speckle can now process IFC files and store them as a commit (snapshot). You can then
          access it from the Speckle API, and receive it in other applications.
          <!--         </v-card-text>
        <v-card-text> -->
          Thanks to the Open Source
          <a href="https://ifcjs.github.io/info/docs/Guide/web-ifc/Introduction" target="_blank">
            IFC.js Project
          </a>
          for making this possible.
        </v-card-text>
      </v-card>

      <v-card
        elevation="0"
        color="transparent"
        class=""
        style="height: 220px; transition: all 0.2s ease"
        :class="`mt-4 mb-4 d-flex justify-center 
        ${dragover && !$vuetify.theme.dark ? 'grey lighten-4' : ''}
        ${dragover && $vuetify.theme.dark ? 'grey darken-4' : ''}
        `"
        @drop.prevent="onFileDrop($event)"
        @dragover.prevent="dragover = true"
        @dragenter.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
      >
        <div v-if="!dragError" class="align-self-center text-center">
          <v-icon x-large color="primary" :class="`hover-tada ${dragover ? 'tada' : ''}`">
            mdi-cloud-upload
          </v-icon>
          <br />
          <span class="primary--text">Drag and drop your IFC file here!</span>
          <br />
          <span class="caption">Maximum 5 files at a time. Size is restricted to 50mb each.</span>
        </div>
        <v-alert
          v-if="dragError"
          dismissible
          class="align-self-center text-center"
          type="error"
          @click="dragError = null"
        >
          {{ dragError }}
        </v-alert>
      </v-card>

      <!-- {{ uploads }} -->
      <template v-for="file in files">
        <file-upload-item
          :key="file.fileName"
          :file="file"
          @done="uploadCompleted"
        ></file-upload-item>
      </template>

      <v-card elevation="1" rounded="lg" :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
        <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'white' : ''} mb-2`">
          <v-toolbar-title>
            <!-- <v-icon class="mr-2" small>mdi-arrow-up</v-icon> -->
            <span class="d-inline-block">Previous Uploads</span>
          </v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          Here are the previously uploaded files in this stream. Please note, currently processing
          time is restricted to 5 minutes - if a file takes longer to process, it will be ignored.
        </v-card-text>
      </v-card>

      <template v-for="file in streamUploads" v-if="!$apollo.loading">
        <file-processing-item :key="file.id" :file-id="file.id" />
      </template>
    </v-container>
  </div>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'Webhooks',
  components: {
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder'),
    FileUploadItem: () => import('@/components/FileUploadItem'),
    FileProcessingItem: () => import('@/components/FileProcessingItem')
  },
  apollo: {
    streamUploads: {
      query: gql`
        query streamUploads($streamId: String!) {
          stream(id: $streamId) {
            id
            fileUploads {
              id
            }
          }
        }
      `,
      update: (data) => data.stream.fileUploads,
      variables() {
        return {
          streamId: this.$route.params.streamId
        }
      }
    }
  },
  data() {
    return {
      dragover: false,
      loading: false,
      stream: null,
      files: [],
      showUploadDialog: false,
      error: null,
      dragError: null
    }
  },
  computed: {},
  methods: {
    onFileDrop(e) {
      this.dragover = false
      this.dragError = null
      for (const file of e.dataTransfer.files) {
        console.log(file.name.split('.')[1])
        let extension = file.name.split('.')[1]
        if (!extension || extension !== 'ifc') {
          this.dragError = 'Only IFC file extensions are supported.'
          return
        }

        if (file.size > 50626997) {
          this.dragError = 'Your files are too powerful (for now). Maximum upload size is 50mb!'
          return
        }

        if (this.files.findIndex((f) => f.name === file.name) !== -1) {
          this.dragError = 'This file is already primed for upload.'
          return
        }
      }
      if (e.dataTransfer.files.length > 5) {
        this.dragError = 'Maximum five files at a time allowed.'
        return
      }
      this.dragError = null

      for (const file of e.dataTransfer.files) {
        this.files.push(file)
      }
    },
    uploadCompleted(file) {
      const index = this.files.findIndex((f) => f.name === file)
      this.files.splice(index, 1)
      this.$apollo.queries.streamUploads.refetch()
    }
  }
}
</script>
