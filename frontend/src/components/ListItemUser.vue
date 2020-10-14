<template>
  <v-row>
    <v-col cols="1">
      <v-avatar color="grey lighten-3" size="40">
        <v-img v-if="user.avatar" :src="user.avatar" />
        <v-img
          v-else
          :src="`https://robohash.org/` + user.id + `.png?size=40x40`"
        />
      </v-avatar>
    </v-col>
    <v-col cols="11">
      <div class="subtitle-2">
        <!-- <router-link :to="'streams/' + stream.id"> -->
        {{ user.name }}
        <!-- </router-link> -->
      </div>
      <div class="caption">
        {{ user.company }}
      </div>
    </v-col>
  </v-row>
</template>
<script>
export default {
  props: {
    user: {
      type: Object,
      default: function () {
        return {}
      }
    }
  }
}
</script>
