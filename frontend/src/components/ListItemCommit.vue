<template>
  <v-row>
    <v-col cols="1" style="margin-top: 8px">
      <user-avatar
        :id="commit.authorId"
        :avatar="commit.authorAvatar"
        :name="commit.authorName"
        :size="30"
      />
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
import UserAvatar from './UserAvatar'

export default {
  components: { UserAvatar },
  props: ['commit', 'streamId'],
  computed: {
    commitDate() {
      if (!this.commit) return null
      let date = new Date(this.commit.createdAt)
      let options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    }
  }
}
</script>
