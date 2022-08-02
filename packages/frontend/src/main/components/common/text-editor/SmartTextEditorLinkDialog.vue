<template>
  <v-dialog v-model="dialogOpen" width="500">
    <v-card>
      <v-form ref="form" v-model="formValid">
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formDataState.title"
                  autofocus
                  label="Title"
                  :rules="validators.title"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formDataState.url"
                  label="URL"
                  :rules="validators.url"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="() => (dialogOpen = false)">Cancel</v-btn>
          <v-btn color="primary" text @click="onSubmit">OK</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script>
import { required, url } from '@/main/lib/common/vuetify/validators'
import { clone } from 'lodash'
export default {
  name: 'SmartTextEditorLinkDialog',
  props: {
    value: {
      type: Object,
      default: () => null
    }
  },
  data: () => ({
    formDataState: {},
    formValid: false,
    validators: {
      title: [required()],
      url: [required(), url()]
    }
  }),
  computed: {
    dialogOpen: {
      get() {
        return !!this.value
      },
      set(newVal) {
        this.$emit('input', newVal || null)
      }
    },
    dialogTitle() {
      if (this.value?.url) return 'Edit Link'
      return 'Add Link'
    }
  },
  watch: {
    value: {
      handler(newVal) {
        // Avoiding prop mutation
        this.formDataState = clone(newVal || {})
      },
      immediate: true
    }
  },
  methods: {
    onSubmit() {
      if (this.$refs.form.validate()) {
        this.dialogOpen = false
        this.$emit('submit', this.formDataState)
      }
    }
  }
}
</script>
