<template>
  <v-row>
    <v-col cols="7">
      <div class="subtitle-2">
        <router-link :to="'/streams/' + streamId + '/commits/' + commit.id">
          {{ commit.message }}
        </router-link>
      </div>
      <div class="caption">
        {{ commit.authorName }} committed
        <timeago :datetime="commit.createdAt"></timeago>
      </div>
    </v-col>
    <!-- <v-spacer></v-spacer> -->
    <v-col cols="5" class="caption text-right">
      <div>
        <span class="streamid">
          <router-link :to="'/streams/' + streamId + '/commits/' + commit.id">
            {{ commit.id }}
          </router-link>
        </span>
      </div>
    </v-col>
  </v-row>
</template>
<script>
export default {
  props: ["commit", "streamId"]
}
</script>
