<template>
  <v-list-item
    :to="route ? route : `/streams/${streamId}/commits/${commit.id}`"
    class="xxx-elevation-10"
  >
    <v-list-item-icon class="pl-4">
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
      </v-list-item-title>
      <v-list-item-subtitle class="caption">
        <b>{{ commit.authorName }}</b>&nbsp;
        <timeago :datetime="commit.createdAt"></timeago>
        ({{ commitDate }})
      </v-list-item-subtitle>
    </v-list-item-content>

    <v-list-item-action >
      <p class="text-end mt-2 mb-0">
      <v-list-item-title >
        {{ "Received" }} 
      </v-list-item-title>
      </p>
      <v-list-item-subtitle class="mt-2 caption">
        <p> {{"by"}} &nbsp;
        <b>{{ commit.authorName }}</b>&nbsp;
        <timeago :datetime="commit.createdAt"></timeago>
        </p>
      </v-list-item-subtitle>
    </v-list-item-action>

    <v-list-item-action class="pl-4 pt-0 mt-0">
      <user-avatar
        :id="commit.authorId"
        :avatar="commit.authorAvatar"
        :name="commit.authorName"
        :size="40"
      />
    </v-list-item-action>

    <v-list-item-action>
      <div>
        <span v-if="commit.branchName" class="caption">
          <v-chip small v-tooltip="`On branch '${commit.branchName}'`" color="primary" :to="`/streams/${streamId}/branches/${commit.branchName}`">
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            {{ commit.branchName }}
          </v-chip>
        </span>
        <source-app-avatar :application-name="commit.sourceApplication" />
      </div>
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
