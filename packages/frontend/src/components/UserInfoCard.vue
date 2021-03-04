<template>
  <v-card color="transparent" class="elevation-0 text-center">
    <div v-if="!user">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </div>
    <div v-else>
      <v-card-title class="text-center mb-5 mt-5 pt-15 pb-10">
        <v-btn
          v-tooltip="'Change your profile picture.'"
          color="transparent"
          text
          block
          :disabled="!isSelf"
          class="elevation-0 pa-0 ma-0"
        >
          <v-avatar class="elevation-0" size="100" @click="avatarDialog = true">
            <v-img v-if="user.avatar" :src="user.avatar" />
            <v-img v-else :src="`https://robohash.org/` + user.id + `.png?size=64x64`" />
          </v-avatar>
        </v-btn>
        <v-dialog v-model="avatarDialog" max-width="400">
          <v-card>
            <v-card-title class="text-center">Choose a new profile picture</v-card-title>
            <v-card-text class="text-center pa-0 ma-0 mt-5">
              <v-image-input
                v-model="imageData"
                :image-quality="0.85"
                :image-height="256"
                :image-width="256"
                full-width
                full-height
                clearable
                image-format="jpeg"
              />
            </v-card-text>
            <v-card-actions>
              <span v-if="imageData" class="caption">You look wonderful!</span>
              <v-spacer></v-spacer>
              <v-btn text @click="avatarDialog = false">cancel</v-btn>
              <v-btn :disabled="!imageData" @click="updateAvatar">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-title>
      <v-card-title class="text-center justify-center">
        {{ user.name }}
      </v-card-title>
      <v-card-text>
        <p v-if="user.company" class="subtitle-1">{{ user.company }}</p>
        <p v-if="user.email && isSelf">
          {{ user.email }}
        </p>
        <p v-if="user.bio">
          {{ user.bio }}
        </p>
        <p v-else>This user keeps an air of mystery around themselves.</p>

        <span v-if="isSelf" class="caption">ID: {{ user.id }}</span>
      </v-card-text>
      <v-divider class="pb-2"></v-divider>
      <v-card-actions>
        <v-btn v-if="isSelf" small plain color="primary" text block @click="userDialog = true">
          <v-icon small class="mr-2">mdi-cog-outline</v-icon>
          Edit
        </v-btn>
      </v-card-actions>
      <v-dialog v-model="userDialog" max-width="600">
        <user-edit-dialog :user="user" @close="editClosed"></user-edit-dialog>
      </v-dialog>
    </div>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import userQuery from '../graphql/user.gql'
import UserEditDialog from '../components/dialogs/UserEditDialog'
import VImageInput from 'vuetify-image-input/a-la-carte'

export default {
  components: { UserEditDialog, VImageInput },

  data() {
    return {
      userDialog: false,
      avatarDialog: false,
      imageData: null
    }
  },
  apollo: {
    user: {
      query: userQuery
    }
  },
  computed: {
    isSelf() {
      if (!this.user) return false
      return this.user.id === localStorage.getItem('uuid')
    }
  },
  methods: {
    async updateAvatar() {
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation userUpdate($update: UserUpdateInput!) {
              userUpdate(user: $update)
            }
          `,
          variables: {
            update: {
              avatar: this.imageData
            }
          }
        })
        this.user.avatar = this.imageData
      } catch (e) {
        console.log(e)
      }

      this.avatarDialog = false
    },
    editClosed() {
      this.userDialog = false
      this.$apollo.queries.user.refetch()
    }
  }
}
</script>
