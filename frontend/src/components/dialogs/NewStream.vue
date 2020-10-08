<template>
  <v-dialog v-model="show" width="500" @keydown.esc="cancel">
    <v-card class="pa-4">
      <v-card-title class="subtitle-1">New Stream</v-card-title>

      <v-card-text class="pl-2 pr-2 pt-0 pb-0">
        <v-form>
          <v-container>
            <v-row>
              <v-col cols="12" class="pb-0">
                <v-text-field
                  v-model="name"
                  label="Name"
                  required
                  filled
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="pt-0 pb-0">
                <v-textarea
                  v-model="description"
                  filled
                  rows="2"
                  label="Description"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click.native="agree">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  data: () => ({
    dialog: false,
    name: "",
    description: ""
  }),
  computed: {
    show: {
      get() {
        return this.dialog
      },
      set(value) {
        this.dialog = value
        if (value === false) {
          this.cancel()
        }
      }
    }
  },
  methods: {
    open() {
      this.dialog = true
      this.name = ""
      this.description = ""
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      this.resolve({
        result: true,
        name: this.name,
        description: this.description
      })
      this.dialog = false
    },
    cancel() {
      this.resolve({
        result: false
      })
      this.dialog = false
    }
  }
}
</script>
