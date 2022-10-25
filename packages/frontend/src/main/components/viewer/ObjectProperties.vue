<template>
  <div>
    <div v-if="!loading">
      <div v-for="kvp in limitedKVPs" :key="kvp.key">
        <object-properties-row
          :prop="kvp"
          :stream-id="streamId"
          :parent="realObject"
          :ref-id="kvp.refId"
        />
      </div>
      <div v-if="currItems < kvps.length">
        <v-btn
          x-small
          block
          plain
          :class="`grey ${$vuetify.theme.dark ? 'darken-3' : 'lighten-2'}`"
          @click.stop="currItems += maxItems"
        >
          Show More ({{ kvps.length - currItems }})
        </v-btn>
      </div>
    </div>
    <div v-else>
      <v-progress-linear indeterminate />
    </div>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'

export default {
  name: 'ObjectProperties',
  components: {
    ObjectPropertiesRow: () => import('@/main/components/viewer/ObjectPropertiesRow')
  },
  props: {
    obj: {
      type: [Object, Array],
      default: () => null
    },
    streamId: {
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      realObject: this.obj,
      wasReference: true,
      kvps: [],
      maxItems: 20,
      currItems: 20,
      loading: false,
      ignoredProps: [
        '__closure',
        // 'displayMesh',
        // 'displayValue',
        '__importedUrl',
        '__parents'
        // 'totalChildrenCount'
      ]
    }
  },
  computed: {
    limitedKVPs() {
      return this.kvps.slice(0, this.currItems)
    }
  },
  mounted() {
    if (!this.obj) {
      return
    }
    if (this.obj.referencedId || this.obj.referencedObject) this.getRealObject()
    else {
      this.wasReference = false
      this.generateKVPs()
    }
  },
  methods: {
    async getRealObject() {
      this.loading = true
      const result = await this.$apollo.query({
        query: gql`
          query Object($streamId: String!, $id: String!) {
            stream(id: $streamId) {
              id
              object(id: $id) {
                totalChildrenCount
                id
                speckleType
                data
              }
            }
          }
        `,
        variables: {
          streamId: this.streamId,
          id: this.obj.referencedId || this.obj.referencedObject
        }
      })
      this.realObject = result.data.stream.object.data
      this.loading = false
      this.generateKVPs()
    },
    generateKVPs() {
      for (const key of Object.keys(this.realObject)) {
        if (this.ignoredProps.indexOf(key) !== -1) continue
        let value = this.realObject[key]
        let type = Array.isArray(this.realObject[key])
          ? 'array'
          : typeof this.realObject[key]
        const extras = []
        if (value?.referencedId) extras.push('open', 'visibility')
        if (
          type === 'array' &&
          value &&
          value[0]?.referencedId &&
          !this.realObject.speckle_type?.includes('Objects')
        )
          extras.push('visibility')

        // hack
        if (type === 'array') extras.push('visibility')

        // handle undefined as well as null 'values'
        // eslint-disable-next-line eqeqeq
        if (value == null) {
          value = 'null'
          type = 'null'
        }

        this.kvps.push({
          key: this.cleanKey(key),
          originalKey: key,
          value,
          type,
          extras,
          length: type === 'array' ? value.length : null,
          visible: true,
          refId: value?.referencedId
        })
      }
    },
    cleanKey(key) {
      if (key === 'totalChildrenCount') return 'children count'
      if (key === 'speckle_type') return 'speckle type'
      return key
    }
  }
}
</script>
