<template>
  <v-row>
    <v-col cols="1">
      <v-avatar class="ma-1" color="grey lighten-3" size="40">
        <v-img v-if="commit.authorAvatar" :src="commit.authorAvatar" />
        <v-img
          v-else
          :src="`https://robohash.org/` + commit.authorId + `.png?size=40x40`"
        />
      </v-avatar>
    </v-col>
    <v-col cols="7">
      <div class="subtitle-1">
        <router-link :to="'/streams/' + streamId + '/commits/' + commit.id">
          {{ commit.message }}
        </router-link>
      </div>
      <div class="caption">
        <b>{{ commit.authorName }}</b>
        committed
        <timeago :datetime="commit.createdAt"></timeago>
        ({{ commitDate }})
      </div>
    </v-col>
    <!-- <v-spacer></v-spacer> -->
    <v-col cols="3" class="caption text-right">
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
  props: ["commit", "streamId"],
  computed: {
    commitDate() {
      if (!this.commit) return null
      let date = new Date(this.commit.createdAt)
      let options = { year: "numeric", month: "long", day: "numeric" }

      return date.toLocaleString(undefined, options)
    }
  }
}
</script>
