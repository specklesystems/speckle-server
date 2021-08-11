<template>
  <v-row>
    <v-col v-if="stream" cols="12">
      <breadcrumb-title />
      <h3 class="title font-italic font-weight-thin my-5">Fine tune this Stream's settings</h3>

      <v-card class="mt-5 pa-4" elevation="0" rounded="lg" :loading="loading">
        <v-card-title>
          <v-icon class="mr-2">mdi-cog</v-icon>
          <span class="d-inline-block">General</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="save">
            <v-text-field
              v-model="name"
              :rules="validation.nameRules"
              label="Name"
              hint="The name of this stream."
              class="mt-5"
            />
            <v-text-field
              v-model="description"
              label="Description"
              hint="The description of this stream."
              class="mt-5"
            />

            <v-switch
              v-model="isPublic"
              class="mt-5"
              :label="isPublic ? 'Public' : 'Private'"
              :hint="
                isPublic
                  ? 'Anyone can view this stream. It is also visible on your profile page. Only collaborators can edit it.'
                  : 'Only collaborators can access this stream.'
              "
              persistent-hint
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn class="ml-3 mt-5" color="primary" type="submit" :disabled="!canSave" @click="save">
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>

      <v-card class="mt-5 pa-4" elevation="0" rounded="lg" :loading="loading">
        <v-card-title>
          <v-icon class="mr-2">mdi-bomb</v-icon>
          <span class="d-inline-block">Danger Zone</span>
        </v-card-title>

        <v-card-text>
          <v-list-item two-line>
            <v-list-item-content>
              <v-list-item-title>Delete Stream</v-list-item-title>
              <v-list-item-subtitle>
                Once you delete a stream, there is no going back!
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn color="error" @click="deleteDialog = true">delete</v-btn>
            </v-list-item-action>
          </v-list-item>
          <v-dialog v-model="deleteDialog" width="500" @keydown.esc="deleteDialog = false">
            <v-card class="pa-4">
              <v-card-title>Deleting Stream '{{ stream.name }}'</v-card-title>
              <v-card-text class="caption py-5">
                Type the name of the stream below to confirm you really want to delete it.
                <b>You cannot undo this action.</b>

                <v-text-field
                  v-model="streamNameConfirm"
                  label="Confirm stream name"
                  class="pt-10"
                ></v-text-field>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  class="mr-3"
                  color="error"
                  :disabled="streamNameConfirm !== stream.name"
                  @click="deleteStream"
                >
                  delete
                </v-btn>
                <v-btn text color="primary" @click="deleteDialog = false">Cancel</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card-text>
      </v-card>
    </v-col>
    <v-snackbar v-model="snackbar" timeout="800" color="primary">
      <p class="text-center my-0">
        <b>Changes saved!</b>
      </p>
    </v-snackbar>
  </v-row>
</template>

<script>
import gql from 'graphql-tag'

export default {
  name: 'StreamSettings',
  components: {
    BreadcrumbTitle: () => import('@/components/BreadcrumbTitle')
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
