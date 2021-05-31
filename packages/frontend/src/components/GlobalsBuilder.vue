<template>
  <v-card rounded="lg" class="pa-3 mb-3" elevation="0">
    <v-row class="ma-3">
      <v-col>
        <v-switch dense inset color="error" v-model="deleteEntries" :label="`DELETE`"></v-switch>
      </v-col>
      <v-col>
        <v-btn color="primary" small @click="resetGlobals">reset all</v-btn>
      </v-col>
    </v-row>
    <globals-entry
      v-if="!$apollo.loading"
      :entries="globalsArray"
      :path="[]"
      :remove="deleteEntries"
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
    GlobalsEntry: () => import('../components/GlobalsEntry')
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
      object: null,
      deleteEntries: false,
    }
  },
  computed: {},
  watch: {
    object(newVal, oldVal) {
      console.log()
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
              type: 'ref_object'
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
    }
  }
}
</script>

<style scoped>
</style>
