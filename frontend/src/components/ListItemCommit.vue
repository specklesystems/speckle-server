<template>
  <v-list-item :to="`/streams/${streamId}/commits/${commit.id}`">
    <v-list-item-icon>
      <user-avatar
        :id="commit.authorId"
        :avatar="commit.authorAvatar"
        :name="commit.authorName"
        :size="30"
      />
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        {{ commit.message }}
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        <b>{{ commit.authorName }}</b>
        committed
        <timeago :datetime="commit.createdAt"></timeago>
        ({{ commitDate }})
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
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
