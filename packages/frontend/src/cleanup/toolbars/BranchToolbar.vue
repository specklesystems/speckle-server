<template>
  <div class="ml-2">
    /
    <v-icon small class="mr-1" style="font-size: 14px">mdi-source-branch</v-icon>
    <span class="space-grotesk" style="max-width: 80%">{{ stream.branch.name }}</span>
    <span class="caption ml-2 mb-2 pb-2">{{ stream.branch.description }}</span>
    <v-chip
      v-tooltip="`Branch ${stream.branch.name} has ${stream.branch.commits.totalCount} commits`"
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
      <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">mdi-pencil</v-icon>
      <span class="hidden-md-and-down">Edit</span>
    </v-btn>
  </div>
</template>
<script>
export default {
  props: ['stream']
}
</script>
