<template>
  <v-hover v-slot="{ hover }">
    <v-card
      :to="'/streams/' + stream.id"
      color=""
      :elevation="hover ? 5 : 0"
      style="transition: all 0.2s ease-in-out"
    >
      <preview-image :url="`/preview/${stream.d}`" :color="hover"></preview-image>
      <v-card-title class="">{{ stream.name }}</v-card-title>
      <v-card-text>
        <span class="caption mb-2 font-italic">
          Updated
          <timeago :datetime="stream.updatedAt"></timeago>
        </span>
        <v-chip small outlined class="ml-3">
          <v-icon small left>mdi-account-key-outline</v-icon>
          {{ stream.role.split(':')[1] }}
        </v-chip>
        <v-btn
          v-tooltip="
            stream.branches.totalCount + ' branch' + (stream.branches.totalCount === 1 ? '' : 'es')
          "
          plain
          color="primary"
          text
          class="px-0 ml-3"
          small
          :to="'/streams/' + stream.id + '/branches'"
        >
          <v-icon small class="mr-2 float-left">mdi-source-branch</v-icon>
          {{ stream.branches.totalCount }}
        </v-btn>

        <v-btn
          v-tooltip="
            stream.commits.totalCount + ' commit' + (stream.commits.totalCount === 1 ? '' : 's')
          "
          plain
          color="primary"
          text
          class="px-0"
          small
          :to="'/streams/' + stream.id + '/branches/main'"
        >
          <v-icon small class="mr-2 float-left">mdi-source-commit</v-icon>
          {{ stream.commits.totalCount }}
        </v-btn>
        <div class="mt-3 caption text-truncate">
          {{ stream.description }}
        </div>
      </v-card-text>
      <v-card-text class="pt-0">
        <user-avatar
          v-for="user in stream.collaborators.slice(0, 4)"
          :id="user.id"
          :key="user.id"
          :avatar="user.avatar"
          :size="30"
          :name="user.name"
        />
        <v-avatar v-if="stream.collaborators.length > 4" size="30" color="grey">
          <span class="white--text">+{{ stream.collaborators.length - 4 }}</span>
        </v-avatar>
      </v-card-text>
    </v-card>
  </v-hover>
</template>
<script>
import UserAvatar from '../components/UserAvatar'
import PreviewImage from '@/components/PreviewImage'

export default {
  components: { UserAvatar, PreviewImage },
  props: {
    stream: {
      type: Object,
      default: function () {
        return {}
      }
    }
  }
}
</script>
