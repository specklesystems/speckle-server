<template>
  <v-container style="max-width: 768px">
    <portal to="streamTitleBar">
      <div>
        <v-icon small class="mr-2 hidden-xs-only">mdi-cog</v-icon>
        <span class="space-grotesk">Settings</span>
      </div>
    </portal>

    <v-alert type="warning" v-if="stream.role !== 'stream:owner'">
      Your permission level ({{ stream.role }}) is not high enough to edit this stream's details.
    </v-alert>

    <v-card
      :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`"
      elevation="0"
      rounded="lg"
      :loading="loading"
    >
      <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''} mb-2`">
        <v-toolbar-title>
          <v-icon class="mr-2" small>mdi-cog</v-icon>
          <span class="d-inline-block">General</span>
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text>
        <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="save">
          <v-text-field
            v-model="name"
            :rules="validation.nameRules"
            label="Name"
            hint="The name of this stream."
            class="mt-5"
            :disabled="stream.role !== 'stream:owner'"
          />
          <v-text-field
            v-model="description"
            label="Description"
            hint="The description of this stream."
            class="mt-5"
            :disabled="stream.role !== 'stream:owner'"
          />

          <v-switch
            inset
            v-model="isPublic"
            class="mt-5"
            :label="isPublic ? 'Public (Link Sharing)' : 'Private'"
            :hint="
              isPublic
                ? 'Anyone with the link can view this stream. It is also visible on your profile page. Only collaborators can push data to it.'
                : 'Only collaborators can access this stream.'
            "
            persistent-hint
            :disabled="stream.role !== 'stream:owner'"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn class="ml-3" color="primary" type="submit" :disabled="!canSave" @click="save">
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''} mt-2`" elevation="0" rounded="lg">
      <v-toolbar flat :class="`${!$vuetify.theme.dark ? 'grey lighten-4' : ''} mb-2`">
        <v-toolbar-title>
          <v-icon class="mr-2" small>mdi-bomb</v-icon>
          <span class="d-inline-block">Danger Zone</span>
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text>
        <v-list-item three-line>
          <v-list-item-action>
            <v-btn
              color="error"
              @click="deleteDialog = true"
              fab
              dark
              small
              :disabled="stream.role !== 'stream:owner'"
            >
              <v-icon>mdi-delete-forever</v-icon>
            </v-btn>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Permanently Delete Stream</v-list-item-title>
            <v-list-item-subtitle>
              Once you delete a stream, there is no going back! All data will be removed, and
              existing collaborators will not be able to access it.
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-dialog v-model="deleteDialog" width="500" @keydown.esc="deleteDialog = false">
          <v-card>
            <v-toolbar class="error mb-4">
              <v-toolbar-title>Deleting Stream '{{ stream.name }}'</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-toolbar-items>
                <v-btn icon @click="deleteDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-toolbar-items>
            </v-toolbar>

            <v-card-text>
              Type the name of the stream below to confirm you really want to delete it. All data
              will be removed, and existing collaborators will not be able to access it.
              <v-divider class="my-2"></v-divider>
              <b>You cannot undo this action.</b>

              <v-text-field
                v-model="streamNameConfirm"
                label="Confirm stream name"
                class="pt-10"
              ></v-text-field>
            </v-card-text>
            <v-card-actions>
              <!-- <v-btn text color="primary" @click="deleteDialog = false">Cancel</v-btn> -->
              <v-btn
                block
                class="mr-3"
                color="error"
                :disabled="streamNameConfirm !== stream.name"
                @click="deleteStream"
              >
                delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" timeout="800" color="primary">
      <p class="text-center my-0">
        <b>Changes saved!</b>
      </p>
    </v-snackbar>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'StreamSettings',
  components: {
  },
  apollo: {
    stream: {
      query: gql`
        query Stream($id: String!) {
          stream(id: $id) {
            id
            name
            description
            isPublic
            role
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },

      update(data) {
        let stream = data.stream
        if (stream)
          ({ name: this.name, description: this.description, isPublic: this.isPublic } = stream)

        return stream
      }
    }
  },
  data: () => ({
    snackbar: false,
    loading: false,
    loadingDelete: false,
    valid: false,
    name: null,
    deleteDialog: false,
    streamNameConfirm: '',
    description: null,
    isPublic: true,
    validation: {
      nameRules: [(v) => !!v || 'A stream must have a name!']
    }
  }),
  computed: {
    canSave() {
      return (
        this.stream.role === 'stream:owner' &&
        this.valid &&
        (this.name !== this.stream.name ||
          this.description !== this.stream.description ||
          this.isPublic !== this.stream.isPublic)
      )
    }
  },

  methods: {
    async save() {
      this.loading = true
      this.$matomo && this.$matomo.trackPageView('stream/update')
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation editDescription($input: StreamUpdateInput!) {
              streamUpdate(stream: $input)
            }
          `,
          variables: {
            input: {
              id: this.stream.id,
              name: this.name,
              description: this.description,
              isPublic: this.isPublic
            }
          }
        })
        this.snackbar = true
      } catch (e) {
        console.log(e)
      }

      this.$apollo.queries.stream.refetch()
      this.loading = false
    },
    async deleteStream() {
      this.$matomo && this.$matomo.trackPageView('stream/delete')
      this.loadingDelete = true
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation deleteStream($id: String!) {
              streamDelete(id: $id)
            }
          `,
          variables: {
            id: this.stream.id
          }
        })
      } catch (e) {
        console.log(e)
      }
      this.deleteDialog = false
      this.$router.push({ path: '/streams' })
    }
  }
}
</script>
