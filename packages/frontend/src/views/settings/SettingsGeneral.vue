<template>
  <admin-card :loading="loading" title="General">
    <v-card-text class="py-0 my-0">
      <v-form ref="form" v-model="valid" class="px-2" @submit.prevent="save">
        <v-text-field
          v-model="name"
          :rules="validation.nameRules"
          label="Name"
          hint="The name of this stream."
        />
        <p class="subtitle-1">Description</p>
        <v-row>
          <v-col cols="12" sm="12" md="6">
            <p class="caption">
              Use Markdown! Tips:
              <code>#, ##, ###</code>
              prefix headings, links:
              <code>[speckle](https://speckle.systems)</code>
              , images:
              <code>![image title](image url)</code>
              , list items are prefixed by
              <code>-</code>
              on new lines,
              <b>bold</b>
              text by surrounding it with
              <code>**</code>
              , etc.
            </p>
            <v-textarea
              v-model="description"
              auto-grow
              filled
              rows="10"
              style="font-size: 12px; line-height: 10px"
            ></v-textarea>
          </v-col>
          <v-col cols="12" sm="12" md="6">
            <p class="subtitle">Preview</p>
            <div class="marked-preview" v-html="compiledMarkdown"></div>
          </v-col>
        </v-row>
        <v-switch
          v-model="isPublic"
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

    <v-divider class="mt-4 mb-3" />

    <v-card-actions>
      <v-btn outlined color="success" type="submit" :disabled="!valid" @click="save">
        Save Changes
      </v-btn>
    </v-card-actions>
  </admin-card>
</template>

<script>
import marked from 'marked'
import DOMPurify from 'dompurify'
import gql from 'graphql-tag'
import streamQuery from '@/graphql/stream.gql'

export default {
  name: 'SettingsGeneral',
  components: {
    AdminCard: () => import('@/components/admin/AdminCard')
  },
  props: {
    userRole: {
      type: String,
      default: null
    }
  },
  apollo: {
    stream: {
      query: streamQuery,
      variables() {
        return {
          id: this.$attrs.streamId
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
    loading: false,
    valid: false,
    name: null,
    description: null,
    isPublic: true,
    validation: {
      nameRules: [(v) => !!v || 'A stream must have a name!']
    }
  }),
  computed: {
    compiledMarkdown() {
      if (!this.description) return ''
      let md = marked(this.description)
      return DOMPurify.sanitize(md)
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
      } catch (e) {
        console.log(e)
      }

      this.$apollo.queries.stream.refetch()
      this.loading = false
    }
  }
}
</script>
