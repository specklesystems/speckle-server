<template>
  <v-container>
    <draggable :list="entries" class="dragArea" tag="ul" group="globals" @change="log">
      <div v-for="(entry, index) in entries" :key="index">
        <v-row v-if="!entry.globals">
          <v-col cols="12" sm="4">
            <v-text-field v-model="entry.key" filled rounded />
          </v-col>
          <v-col cols="12" sm="7">
            <v-text-field v-model="entry.value" />
          </v-col>
          <v-col cols="12" sm="1">
            <v-btn icon x-small @click="emitFieldToObject(entry, index)">
              <v-icon>mdi-cube-outline</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-card v-if="entry.globals" rounded="lg" class="pa-4 mb-4" elevation="4">
          <v-row>
            <v-col>
              <b>{{ entry.key }}</b>
            </v-col>
            <v-col cols="auto">
              <v-btn icon x-small @click="emitObjectToField(entry, index)">
                <v-icon>mdi-compare-horizontal</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <globals-entry :entries="entry.globals" :path="[...path, entry.key]" v-on="$listeners" />
        </v-card>
      </div>
    </draggable>
    <div
      slot="footer"
      class="btn-group list-group-item"
      role="group"
      aria-label="Basic example"
      key="footer"
    >
      <v-btn color="primary" rounded @click="emitAddProp">Add</v-btn>
    </div>
  </v-container>
</template>
<script>
import draggable from 'vuedraggable'

export default {
  name: 'GlobalsEntry',
  components: { draggable },
  props: {
    entries: {
      type: Array,
      default: null
    },
    path: {
      type: Array,
      default: null
    },
    streamId: {
      type: String,
      default: null
    }
  },
  computed: {},
  methods: {
    log(evt) {
      window.console.log(evt)
    },
    emitAddProp() {
      let field = {
        key: `placeholder ${~~(Math.random() * 100)}`,
        type: 'field',
        value: 'random stuff'
      }
      this.$emit('add-prop', { field: field, path: this.path })
    },
    emitRemoveAt(index) {
      this.$emit('remove-prop', { path: this.path, index: index })
    },
    emitFieldToObject(entry, index) {
      console.log('in field to obj')
      let obj = {
        key: entry.key,
        type: 'object',
        globals: [
          { key: `placeholder ${~~(Math.random() * 100)}`, type: 'field', value: entry.value }
        ]
      }
      this.$emit('field-to-object', { obj: obj, path: this.path, index: index })
    },
    emitObjectToField(entry, index) {
      let fields = entry.globals
      this.$emit('object-to-field', { fields: fields, path: this.path, index: index })
    }
  }
}
</script>
<style scoped></style>
