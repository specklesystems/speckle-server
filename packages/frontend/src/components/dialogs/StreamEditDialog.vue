<template>
  <v-card class="pb-5">
    <v-form
      v-show="!showDelete"
      ref="form"
      v-model="valid"
      lazy-validation
      @submit.prevent="updateStream"
    >
      <v-card-title>Edit Stream</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="internalName"
          :rules="nameRules"
          validate-on-blur
          required
          autofocus
          label="Stream Name"
        />
        <v-textarea
          v-model="internalDescription"
          rows="1"
          row-height="15"
          label="Description (optional)"
        />
        <v-switch
          v-model="internalIsPublic"
          v-tooltip="
            isPublic
              ? `Anyone can view this stream. It is also visible on your profile page. Only collaborators
          can edit it.`
              : `Only collaborators can access this stream.`
          "
          :label="`${internalIsPublic ? 'Public stream' : 'Private stream'}`"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :disabled="!valid"
          :loading="isLoading"
          elevation="0"
          block
          type="submit"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-form>
    <v-divider v-show="!showDelete" class="my-5" />
    <v-card-title v-show="!showDelete" class="error--text body-2 pa-2">
      <v-btn block x-small text color="error" @click="showDelete = true">Delete Stream</v-btn>
    </v-card-title>
    <v-card-text v-show="showDelete" class="caption py-5">
      <h2 class="error--text py-3">Deleting Stream '{{ internalName }}'</h2>
      <span class="error--text">
        Type the name of the stream below to confirm you really want to delete it.
        <b>You cannot undo this action.</b>
      </span>
      <v-text-field
        v-model="streamNameConfirm"
        label="Confirm stream name"
        class="pr-5"
      ></v-text-field>
    </v-card-text>
    <v-card-actions v-show="showDelete">
      <v-spacer></v-spacer>
      <v-btn
        class="mr-3"
        color="error"
        :loading="isLoading"
        :disabled="streamNameConfirm !== internalName"
        @click="deleteStream"
      >
        delete
      </v-btn>
      <v-btn @click="showDelete = false">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  components: {},
  props: ['open', 'name', 'description', 'isPublic', 'streamId'],
  apollo: {},
  data() {
    return {
      internalName: this.name,
      internalDescription: this.description,
      internalIsPublic: this.isPublic,
      valid: false,
      nameRules: [],
      isLoading: false,
      streamNameConfirm: null,
      showDelete: false
    }
  },
  computed: {},
  watch: {
    open() {
      this.showDelete = false
    }
  },
  mounted() {
    this.showDelete = false
    this.nameRules = [
      (v) => !!v || 'Stream name is required.',
      (v) => (v && v.length <= 150) || 'Name must be less than 150 characters',
      (v) => (v && v.length >= 3) || 'Name must be at least 3 characters'
    ]
  },
  methods: {
    async deleteStream() {
      this.isLoading = true
      this.$matomo && this.$matomo.trackPageView('stream/delete')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation {
              streamDelete(id: "${this.streamId}")
            }
          `
        })
      } catch (e) {
        console.log(e)
      }
      this.isLoading = false
      this.$emit('close')
      this.$router.push({ path: '/' })
    },
    async updateStream() {
      if (!this.$refs.form.validate()) return

      this.isLoading = true
      this.$matomo && this.$matomo.trackPageView('stream/update')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation streamUpdate($myStream: StreamUpdateInput!) {
              streamUpdate(stream: $myStream)
            }
          `,
          variables: {
            myStream: {
              id: this.streamId,
              name: this.internalName,
              description: this.internalDescription,
              isPublic: this.internalIsPublic
            }
          }
        })
        this.$emit('close', {
          name: this.internalName,
          description: this.internalDescription,
          isPublic: this.isPublic
        })
      } catch (e) {
        console.log(e)
      }
      this.isLoading = false
    }
  }
}
</script>
