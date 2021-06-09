<template>
  <v-list-item :to="route ? route : `/streams/${streamId}/commits/${commit.id}`">
    <v-list-item-icon>
      <user-avatar
        :id="commit.authorId"
        :avatar="commit.authorAvatar"
        :name="commit.authorName"
        :size="40"
      />
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title class="mt-0 pt-0 py-1">
        {{ commit.message }}
        <span v-if="commit.branchName" class="caption">
          <v-chip small style="top: -3px">
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </v-chip>
        </span>
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        <b>{{ commit.authorName }}</b>
        committed
        <timeago :datetime="commit.createdAt"></timeago>
        ({{ commitDate }})
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action>
      <source-app-avatar :application-name="commit.sourceApplication" />
    </v-list-item-action>
  </v-list-item>
</template>
<script>
import UserAvatar from './UserAvatar'
import SourceAppAvatar from './SourceAppAvatar'

export default {
  components: { UserAvatar, SourceAppAvatar },
  props: ['commit', 'streamId', 'route'],
  computed: {
    commitDate() {
      if (!this.commit) return null
      let date = new Date(this.commit.createdAt)
      let options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    },
    branchUrl() {
      if (!this.commit) return null
      return `${window.location.origin}/streams/${
        this.$route.params.streamId
      }/branches/${encodeURIComponent(this.commit.branchName)}`
    }
  },
  methods: {
    goToBranch() {
      this.$router.push(this.branchUrl)
    }
  }
}
</script>
