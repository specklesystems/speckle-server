<template>
  <v-container>
    <v-row>
      <v-btn color="primary" small rounded @click="resetGlobals">reset</v-btn>
    </v-row>
    <globals-entry v-if="!$apollo.loading" :entries="globalsArray" />
  </v-container>
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
    entries: {
      type: Array,
      default: null
    },
    value: {
      type: Object,
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
      object: null
    }
  },
  watch: {
    object(newVal, oldVal) {
      console.log()
    }
  },
  computed: {},
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
    }
  }
}
</script>

<style scoped></style>
