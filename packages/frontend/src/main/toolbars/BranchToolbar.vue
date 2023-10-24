<template>
  <portal to="toolbar">
    <div class="d-flex align-center">
      <!-- <div class="text-truncate flex-shrink-0">
        <router-link v-tooltip="'all streams'" to="/streams" class="text-decoration-none mx-1">
          <v-icon small class="primary--text mb-1">mdi-folder-multiple</v-icon>
        </router-link>
      </div> -->
      <div class="text-truncate flex-shrink-1">
        <router-link
          v-tooltip="stream.name"
          class="text-decoration-none space-grotesk mx-1"
          :to="`/streams/${stream.id}`"
        >
          <v-icon small class="primary--text mb-1 mr-1">mdi-folder</v-icon>
          <b class="d-none d-sm-inline">{{ stream.name }}</b>
        </router-link>
        /
      </div>
      <div class="text-truncate flex-shrink-0">
        <router-link
          :to="`/streams/${stream.id}/branches/${formatBranchNameForURL(
            stream.branch.name
          )}`"
          class="text-decoration-none space-grotesk mx-2 font-weight-bold"
        >
          <v-icon small class="mr-1" style="font-size: 13px">mdi-source-branch</v-icon>
          {{ stream.branch.name }}
        </router-link>
      </div>
      <div class="text-truncate d-none d-md-inline caption px-2">
        {{ stream.branch.description }}
      </div>
      <div class="text-truncate caption">
        <v-icon style="font-size: 11px">mdi-source-commit</v-icon>
        {{ stream.branch.commits.totalCount }}
      </div>
      <div
        v-if="
          stream &&
          stream.role !== 'stream:reviewer' &&
          stream.branch &&
          stream.branch.name !== 'main'
        "
        class="flex-shrink-0"
      >
        <v-btn
          v-tooltip="'Edit branch'"
          elevation="0"
          color="primary"
          small
          rounded
          :fab="$vuetify.breakpoint.mdAndDown"
          dark
          text
          class="ml-2"
          @click="$emit('edit-branch')"
        >
          <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">
            mdi-pencil
          </v-icon>
          <span class="hidden-md-and-down">Edit</span>
        </v-btn>
      </div>
    </div>
    <div v-show="false" class="ml-2">
      /
      <v-icon small class="mr-1" style="font-size: 14px">mdi-source-branch</v-icon>
      <span class="space-grotesk" style="max-width: 80%">{{ stream.branch.name }}</span>
      <span class="caption ml-2 mb-2 pb-2">{{ stream.branch.description }}</span>
      <v-chip
        v-tooltip="
          `Branch ${stream.branch.name} has ${stream.branch.commits.totalCount} commits`
        "
        class="ml-2 pl-2"
        small
      >
        <v-icon small>mdi-source-commit</v-icon>
        {{ stream.branch.commits.totalCount }}
      </v-chip>
      <v-btn
        v-if="
          stream &&
          stream.role !== 'stream:reviewer' &&
          stream.branch &&
          stream.branch.name !== 'main'
        "
        v-tooltip="'Edit branch'"
        elevation="0"
        color="primary"
        small
        rounded
        :fab="$vuetify.breakpoint.mdAndDown"
        dark
        text
        class="ml-2"
        @click="$emit('edit-branch')"
      >
        <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">
          mdi-pencil
        </v-icon>
        <span class="hidden-md-and-down">Edit</span>
      </v-btn>
    </div>
  </portal>
</template>
<script>
import { formatBranchNameForURL } from '@/main/lib/stream/helpers/branches'

export default {
  props: {
    stream: {
      type: Object,
      default: () => null
    }
  },
  setup: () => ({ formatBranchNameForURL })
}
</script>
