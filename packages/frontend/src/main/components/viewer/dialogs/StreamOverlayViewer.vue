<template>
  <v-card>
    <v-card-title
      class="blue dark d-flex align-center flex-grow-1 elevation-3"
      style="position: sticky; width: 100%; top: 0; z-index: 100"
    >
      <div class="flex-shrink-1">
        <v-select
          v-model="selectedOption"
          filled
          dark
          rounded
          dense
          hide-details
          :items="items"
          prepend-inner-icon="mdi-source-branch"
          style="width: 300px; max-width: 60vw"
        />
      </div>
      <div class="text-right flex-grow-1">
        <v-btn dark small icon class="ml-2" @click="showObjectDialog = true">
          <v-icon small>mdi-cube-outline</v-icon>
        </v-btn>
        <v-btn dark icon class="ml-2" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-card-title>
    <v-card-text></v-card-text>
    <v-card-text>
      <all-commits
        v-if="selectedOption === 'All Commits'"
        :stream-id="streamId"
        @add-resource="(e) => $emit('add-resource', e)"
      />
      <all-commits-branch
        v-else
        :key="selectedOption"
        :stream-id="streamId"
        :branch-name="selectedOption"
        @add-resource="(e) => $emit('add-resource', e)"
      />
    </v-card-text>
    <v-dialog v-model="showObjectDialog" width="500">
      <v-card>
        <v-card-title class="blue dark d-flex align-center flex-grow-1 elevation-3">
          Add by object url or id
          <v-spacer />
          <v-btn dark icon @click="showObjectDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="mt-2">
          <p>Please note, you can only add objects from the current stream.</p>
          <v-text-field
            v-model="objectIdInput"
            placeholder="Id or url"
            filled
            clearable
            hide-details=""
            :error="objectIdError !== null"
            :loading="objectIdLoading"
            @change="validateObjectId"
          ></v-text-field>
          <div v-if="objectIdError !== null" class="caption mt-1 error--text">
            {{ objectIdError }}
          </div>
          <preview-image
            v-if="objectIdError === null && objectId"
            :height="280"
            :url="`/preview/${streamId}/objects/${objectId}`"
          ></preview-image>
        </v-card-text>
        <v-card-actions>
          <v-btn
            block
            :disabled="objectId === null || objectIdError !== null"
            @click="$emit('add-resource', objectId)"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'
import streamObjectQuery from '@/graphql/objectSingleNoData.gql'
export default {
  name: 'StreamOverlayViewer',
  components: {
    AllCommits: () => import('@/main/components/viewer/dialogs/AllCommits'),
    AllCommitsBranch: () => import('@/main/components/viewer/dialogs/AllCommitsBranch'),
    PreviewImage: () => import('@/main/components/common/PreviewImage')
  },
  props: {
    streamId: {
      type: String,
      default: () => null
    }
  },
  apollo: {},
  data() {
    return {
      items: ['All Commits'],
      selectedOption: 'All Commits',
      showObjectDialog: false,
      objectIdInput: '',
      objectIdLoading: false,
      objectIdError: null,
      objectId: null
    }
  },
  async mounted() {
    const res = await this.$apollo.query({
      query: gql`
        query {
          stream(id: "${this.streamId}") {
            id
            name
            branches {
              totalCount
              items {
                id
                name
                commits {
                  totalCount
                }
              }
            }
          }
        }
      `,
      variables() {
        return {
          streamId: this.streamId
        }
      }
    })
    res.data.stream.branches.items.forEach((b) => {
      if (b.commits.totalCount !== 0) this.items.push(b.name)
    })
  },
  methods: {
    async validateObjectId() {
      if (!this.objectIdInput || this.objectIdInput === '') {
        this.objectIdError = 'Invalid id length.'
        this.objectId = null
        return
      }
      const pcs = this.objectIdInput.split('/')
      const objectId = pcs.reverse()[0]
      if (objectId.length !== 32) {
        this.objectIdError = 'Invalid id length.'
        this.objectId = null
        return
      }
      if (pcs.length !== 1) {
        const streamId = pcs[2]
        if (streamId !== this.$route.params.streamId) {
          this.objectIdError = 'Objects do not belong to the same stream.'
          this.objectId = null
          return
        }
      }

      this.objectIdLoading = true
      try {
        await this.$apollo.query({
          query: streamObjectQuery,
          variables: { streamId: this.streamId, id: objectId }
        })
        this.objectIdLoading = false
      } catch (e) {
        this.$eventHub.$emit('notification', {
          text: e.message
        })
        this.objectIdError = 'Could not find object.'
        this.objectId = null
        this.objectIdLoading = false
        return
      }

      this.objectIdError = null
      this.objectId = objectId
    }
  }
}
</script>
