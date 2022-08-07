<template>
  <section-card :elevation="4">
    <template #header>
      <v-icon small class="mr-2 mb-1">mdi-exit-run</v-icon>
      <span class="d-inline-block">Leave stream</span>
    </template>
    <v-card-text class="d-flex justify-space-between align-center">
      <div>
        As long as you're not the only owner you can remove yourself from this stream's
        list of collaborators.
      </div>
      <div class="ml-1">
        <v-btn color="primary" @click="dialogOpen = true">Leave</v-btn>
      </div>
    </v-card-text>
    <!-- Confirmation dialog -->
    <v-dialog
      v-model="dialogOpen"
      max-width="500"
      :fullscreen="$vuetify.breakpoint.xsOnly"
    >
      <v-card>
        <v-toolbar color="primary" dark flat class="mb-4">
          <v-app-bar-nav-icon style="pointer-events: none">
            <v-icon>mdi-exit-run</v-icon>
          </v-app-bar-nav-icon>
          <v-toolbar-title>Are you sure?</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogOpen = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text>
          Removing yourself from the collaborators list is an irreversible action and
          the only way you can get back on the list is if a stream owner invites you
          back
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogOpen = false">Cancel</v-btn>
          <v-btn color="error" @click="leaveStream">Leave stream</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section-card>
</template>
<script lang="ts">
import Vue from 'vue'
import SectionCard from '@/main/components/common/SectionCard.vue'
import { LeaveStreamDocument } from '@/graphql/generated/graphql'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'

export default Vue.extend({
  name: 'LeaveStreamPanel',
  components: {
    SectionCard
  },
  props: {
    streamId: {
      type: String,
      required: true
    }
  },
  data: () => ({
    dialogOpen: false
  }),
  methods: {
    async leaveStream() {
      const { streamId } = this

      const results = await this.$apollo
        .mutate({
          mutation: LeaveStreamDocument,
          variables: { streamId }
        })
        .catch(convertThrowIntoFetchResult)

      const { data, errors } = results

      if (data?.streamLeave) {
        this.$triggerNotification({
          text: "You've removed yourself from the stream's collaborators"
        })
        this.dialogOpen = false
        this.$emit('removed')
      } else {
        const errMsg = errors?.[0]?.message || 'An unexpected issue occurred'
        this.$triggerNotification({
          text: errMsg,
          type: 'error'
        })
      }
    }
  }
})
</script>
