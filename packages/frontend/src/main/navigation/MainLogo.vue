<template>
  <v-card
    class="space-grotesk primary--text text-h6 py-4 mb-2 pl-4 pr-2 d-flex align-center transparent"
    :class="`grey ${$vuetify.theme.dark ? 'darken-4' : 'lighten-4'} ${
      shadow ? 'elevation-5' : 'elevation-0'
    }`"
    style="position: sticky; top: 0; z-index: 6; width: 100%"
  >
    <router-link to="/" class="text-decoration-none">
      <v-img
        class="hover-tada mt-2"
        width="20"
        src="@/assets/specklebrick.png"
        style="display: inline-block"
      />
    </router-link>
    <router-link to="/" class="text-decoration-none ml-9">
      <span class="pb-4"><b>Speckle</b></span>
    </router-link>
    <div
      v-if="serverInfo"
      v-tooltip="`Managed by ${serverInfo.company}`"
      class="caption ml-1 text-truncate grey--text"
      style="opacity: 0.7"
    >
      {{ serverInfo.version }}
    </div>
    <div class="flex-grow-1 text-right">
      <v-btn v-tooltip="'Close sidebar'" icon small @click="$emit('hide-drawer')">
        <v-icon x-small>mdi-close</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>
<script>
import { mainServerInfoQuery } from '@/graphql/server'

export default {
  props: { shadow: { type: Boolean, default: false } },
  apollo: {
    serverInfo: {
      query: mainServerInfoQuery
    }
  }
}
</script>
