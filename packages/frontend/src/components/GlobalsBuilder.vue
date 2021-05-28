<template>
  <v-card rounded="lg" class="pa-4 mb-4" elevation="0">
    <v-dialog v-model="saveDialog" max-width="500">
      <globals-save-dialog :stream-id="$route.params.streamId" @close="closeSaveDialog" />
    </v-dialog>
    <v-card-title>Globals</v-card-title>
    <v-row justify="end">
      <v-btn small @click="resetGlobals">reset globals</v-btn>
      <v-btn
        v-if="userRole === 'contributor' || userRole === 'owner'"
        v-tooltip="'Save your changes with a message'"
        small
        color="primary"
        @click="saveDialog = true"
      >
        save
      </v-btn>
    </v-row>
    <globals-entry
      v-if="!$apollo.loading"
      :entries="globalsArray"
      :path="[]"
      @add-prop="addProp"
      @remove-prop="removeProp"
      @field-to-object="fieldToObject"
      @object-to-field="objectToField"
    />
  </v-card>
</template>

<script>
import objectQuery from '../graphql/objectSingle.gql'

export default {
  name: 'GlobalsBuilder',
  components: {
    GlobalsEntry: () => import('../components/GlobalsEntry'),
    GlobalsSaveDialog: () => import('../components/dialogs/GlobalsSaveDialog')
  },
  apollo: {
    object: {
      query: objectQuery,
      variables() {
        return {
          streamId: this.streamId,
          id: this.commitId
        }
      },
      update: (data) => {
        delete data.stream.object.data.__closure
        return data.stream.object
      }
    }
  },
  props: {
    userRole: {
      type: String,
      default: null
    },
    commitId: {
      type: String,
      default: null
    },
    streamId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      globalsArray: [],
      saveDialog: false
    }
  },
  computed: {
    globalsCommit() {
      let base = this.globalsToBase(this.globalsArray)
      console.log(base)
      return base
    }
  },
  mounted() {
    //?: how to run this only once but after apollo query is finished loading
    this.globalsArray = this.nestedGlobals(this.object.data)
  },
  methods: {
    nestedGlobals(data) {
      if (!data) return []
      let entries = Object.entries(data)
      let arr = []
      for (let [key, val] of entries) {
        if (key.startsWith('__')) continue
        if (['totalChildrenCount', 'speckle_type', 'id'].includes(key)) continue

        if (Array.isArray(val)) {
          arr.push({
            key,
            value: val,
            type: 'array'
          })
        } else if (typeof val === 'object' && val !== null) {
          if (val.speckle_type && val.speckle_type === 'reference') {
            arr.push({
              key,
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object' //TODO: handle references
            })
          } else {
            arr.push({
              key,
              value: val,
              globals: this.nestedGlobals(val),
              type: 'object'
            })
          }
        } else {
          arr.push({
            key,
            value: val,
            type: 'field'
          })
        }
      }

      return arr
    },
    globalsToBase(arr) {
      let base = {
        speckle_type: 'Base',
        id: null
      }
      arr.forEach((entry) => {
        if (entry.value) return

        if (Array.isArray(entry.value)) base[entry.key] = entry.value
        else if (entry.value.includes(',')) {
          base[entry.key] = entry.value
            .replace(/\s/g, '')
            .split(',')
            .map((el) => (isNaN(el) ? el : parseFloat(el)))
        } else if (entry.type == 'object') {
          base[entry.key] = this.globalsToBase(entry.globals)
        }
      })
      return base
    },
    resetGlobals() {
      if (!this.object.data) return

      this.globalsArray = this.nestedGlobals(this.object.data)
    },
    addProp(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)
      globals.push(kwargs.field)
    },
    removeProp(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)
      globals.splice(kwargs.index, 1)
    },
    fieldToObject(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)

      globals.splice(kwargs.index, 1, kwargs.obj)
    },
    objectToField(kwargs) {
      let globals = this.getNestedGlobals(kwargs.path)

      globals.splice(kwargs.index, 1, ...kwargs.fields)
    },
    getNestedGlobals(path) {
      let entry = this.globalsArray
      if (!path) return entry

      let depth = path.length

      if (depth > 0) {
        let key = path.shift()
        entry = entry.find((e) => e.key == key)
      }

      if (depth > 1) {
        path.forEach((key) => {
          entry = entry.globals.find((e) => e.key == key)
        })
      }

      if (!Array.isArray(entry)) entry = entry.globals

      return entry
    },
    closeSaveDialog() {
      this.dialogBranch = false
      this.$apollo.queries.object.refetch()
    }
  }
}
</script>

<style scoped></style>
