<template>
  <div>
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

      <v-alert v-if="stream && (stream.role === 'stream:reviewer' || !stream.role)" type="warning">
        Your permission level ({{ stream.role ? stream.role : 'none' }}) is not high enough to
        access this feature.
      </v-alert>

      <div v-if="stream && !(stream.role === 'stream:reviewer' || !stream.role)">
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
            <input
              id="myid"
              type="file"
              accept=".ifc,.IFC"
              style="display: none"
              multiple
              @change="onFileSelect($event)"
            />
            <v-icon
              x-large
              color="primary"
              :class="`hover-tada ${dragover ? 'tada' : ''}`"
              style="cursor: pointer"
              onclick="document.getElementById('myid').click()"
            >
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
            :branches="stream.branches.items"
            @done="uploadCompleted"
          ></file-upload-item>
        </template>
      </div>
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
      <v-card v-if="!$apollo.loading && streamUploads.length === 0" class="my-4 elevation-1">
        <v-toolbar dense flat color="transparent">
          <v-toolbar-title>No uploads yet.</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'Webhooks',
  components: {
    FileUploadItem: () => import('@/components/FileUploadItem'),
    FileProcessingItem: () => import('@/components/FileProcessingItem')
  },
  apollo: {
    stream: {
      query: gql`
        query stream($id: String!) {
          stream(id: $id) {
            id
            role
            branches {
              totalCount
              items {
                name
              }
            }
          }
        }
      `,
      variables() {
        return { id: this.$route.params.streamId }
      }
    },
    streamUploads: {
      query: gql`
        query streamUploads($streamId: String!) {
          stream(id: $streamId) {
            id
            role
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
    onFileSelect(e) {
      this.parseFiles(e.target.files)
    },
    onFileDrop(e) {
      this.parseFiles(e.dataTransfer.files)
    },
    parseFiles(files) {
      this.dragover = false
      this.dragError = null
      for (const file of files) {
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
      if (files.length > 5) {
        this.dragError = 'Maximum five files at a time allowed.'
        return
      }
      this.dragError = null

      for (const file of files) {
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
