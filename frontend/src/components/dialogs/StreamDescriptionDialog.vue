<template>
  <v-card class="pa-4" color="background2">
    <v-card-title class="subtitle-1">Edit Description</v-card-title>
    <v-card-text>
      <v-row>
        <v-col sm="12" md="6">
          <p>Markdown is enabled.</p>
          <v-textarea
            v-model="innerStreamDescription"
            auto-grow
            filled
            rows="10"
            style="font-size: 12px; line-height: 10px;"
          ></v-textarea>
        </v-col>
        <v-col sm="12" md="6">
          <p>Preview</p>
          <div class="marked-preview" v-html="compiledMarkdown"></div>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <!-- <v-spacer></v-spacer> -->
      <v-btn @click.native="save">Save & Close</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
import marked from "marked"
import DOMPurify from "dompurify"
import gql from "graphql-tag"

export default {
  props: {
    id: String,
    description: {
      type: String,
      default: null
    }
  },
  data: () => ({
    innerStreamDescription: null
  }),
  computed: {
    compiledMarkdown() {
      if (!this.innerStreamDescription) return ""
      let md = marked(this.innerStreamDescription)
      return DOMPurify.sanitize(md)
    },
    streamDescription: {
      get() {
        return this.innerStreamDescription
      },
      set(value) {
        this.innerStreamDescription = value
      }
    }
  },
  mounted() {
    this.innerStreamDescription = this.description
  },
  methods: {
    async save() {
      try {
        this.$apollo.mutate({
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
        this.$emit("close", this.innerStreamDescription)
      } catch (e) {
        console.log(e)
      }
    }
  }
}
</script>
