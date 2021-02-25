<template>
  <v-card :loading="loading">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <v-card-title>Edit Description</v-card-title>
    <v-card-text class="py-0 my-0">
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
            v-model="innerStreamDescription"
            auto-grow
            filled
            rows="10"
            style="font-size: 12px; line-height: 10px"
          ></v-textarea>
        </v-col>
        <v-col cols="12" sm="12" md="6">
          <p class="caption">Preview</p>
          <div class="marked-preview" v-html="compiledMarkdown"></div>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions class="pb-10">
      <v-btn block @click.native="save">Save & Close</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
import marked from 'marked'
import DOMPurify from 'dompurify'
import gql from 'graphql-tag'

export default {
  props: {
    id: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      innerStreamDescription: this.description,
      loading: false
    }
  },
  computed: {
    compiledMarkdown() {
      if (!this.innerStreamDescription) return ''
      let md = marked(this.innerStreamDescription)
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
              id: this.id,
              description: this.innerStreamDescription
            }
          }
        })
      } catch (e) {
        console.log(e)
      }
      this.loading = false
      this.$emit('close')
    }
  }
}
</script>
