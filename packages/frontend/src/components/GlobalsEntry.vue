<template>
  <v-container>
    <draggable :list="entries" class="dragArea" tag="ul" group="globals" @change="log">
      <div v-for="(entry, index) in entries" :key="index">
        <div v-if="!entry.globals">
          <v-row>
            <v-col cols="12" sm="3">
              <v-text-field v-model="entry.key" filled rounded />
            </v-col>
            <v-col cols="12" sm="8">
              <v-text-field v-model="entry.value" />
            </v-col>
            <v-col cols="12" sm="1">
              <v-btn icon x-small @click="fieldToObject(index, entry)">
                <v-icon>mdi-cube-outline</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </div>
        <v-card v-if="entry.globals" rounded="lg" class="pa-4 mb-4" elevation="4">
          <v-row>
            <v-col>
              <b>{{ entry.key }}</b>
            </v-col>
            <v-col cols="auto">
              <v-btn icon x-small @click="objectToField(entry)">
                <v-icon>mdi-compare-horizontal</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <globals-entry :entries="entry.globals" />
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
      <v-btn color="primary" rounded @click="addProp">Add</v-btn>
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
    //TODO: do thi with `emit` bc this is bad tsk tsk i was just experimenting soz 🥺
    addProp() {
      this.entries.push({
        key: `placeholder ${~~(Math.random() * 100)}`,
        type: 'field',
        value: 'random stuff'
      })
    },
    removeAt(index) {
      this.entries.splice(index, 1)
    },
    fieldToObject(index, entry) {
      let obj = {
        key: entry.key,
        type: 'object',
        globals: [
          { key: `placeholder ${~~(Math.random() * 100)}`, type: 'field', value: entry.value }
        ]
      }
      this.entries[index] = obj
    },
    objectToField(entry) {}
  }
}
</script>
<style scoped></style>
