<template>
  <v-card class="my-4 pa-1 elevation-0" :loading="$apollo.loading">
    <div v-if="!$apollo.loading && file" class="d-flex align-center">
      <v-btn
        v-tooltip="`Download the original file`"
        icon
        small
        @click="downloadOriginalFile()"
      >
        <v-icon small>mdi-download</v-icon>
      </v-btn>

      <div class="text-truncate">
        {{ file.fileName }}
      </div>
      <v-spacer></v-spacer>
      <template v-if="file.convertedStatus === 0">
        <v-btn text small disabled>
          <span class="mr-2">Queued</span>
          <v-progress-circular
            indeterminate
            :size="20"
            :width="2"
          ></v-progress-circular>
        </v-btn>
      </template>
      <template v-if="file.convertedStatus === 1">
        <v-btn text small>
          <span class="mr-2">Converting</span>
          <v-progress-circular
            indeterminate
            :size="20"
            :width="2"
          ></v-progress-circular>
        </v-btn>
      </template>
      <template v-if="file.convertedStatus === 2">
        <v-btn
          text
          small
          color="primary"
          :to="`/streams/${$route.params.streamId}/commits/${file.convertedCommitId}`"
        >
          <span class="mr-2">View Commit</span>
          <v-icon small class="">mdi-open-in-new</v-icon>
        </v-btn>
      </template>
      <template v-if="file.convertedStatus === 3">
        <v-btn v-tooltip="file.convertedMessage" text small>
          <span class="mr-2 error--text">Error</span>
          <v-icon color="error">mdi-bug</v-icon>
        </v-btn>
      </template>
    </div>
    <div v-else>
      <v-skeleton-loader
        class="mx-auto"
        max-width="300"
        type="list-item-one-line"
      ></v-skeleton-loader>
    </div>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'

export default {
  props: {
    fileId: {
      type: String,
      default: null
    }
  },
  data: () => ({
    percentCompleted: -1,
    error: null,
    file: null
  }),
  apollo: {
    file: {
      query: gql`
        query File($id: String!, $streamId: String!) {
          stream(id: $streamId) {
            id
            fileUpload(id: $id) {
              id
              convertedCommitId
              userId
              convertedStatus
              convertedMessage
              fileName
              fileType
              uploadComplete
              uploadDate
              convertedLastUpdate
            }
          }
        }
      `,
      variables() {
        return {
          id: this.fileId,
          streamId: this.$route.params.streamId
        }
      },
      skip() {
        return !this.fileId
      },
      update: (data) => data.stream.fileUpload
    }
  },
  watch: {
    file(val) {
      if (val.convertedStatus >= 2) this.$apollo.queries.file.stopPolling()
    }
  },
  mounted() {
    this.$apollo.queries.file.startPolling(1000)
  },
  methods: {
    async downloadOriginalFile() {
      const res = await fetch(
        `/api/stream/${this.$route.params.streamId}/blob/${this.fileId}`,
        {
          headers: {
            Authorization: localStorage.getItem('AuthToken')
          }
        }
      )
      const blob = await res.blob()
      const file = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      document.body.appendChild(a)
      a.style = 'display: none'
      a.href = file
      a.download = this.file.fileName
      a.click()
      window.URL.revokeObjectURL(file)
    }
  }
}
</script>
