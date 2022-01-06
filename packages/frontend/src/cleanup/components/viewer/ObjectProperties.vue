<template>
  <div>
    <div v-if="!loading">
      <div v-for="kvp in limitedKVPs" :key="kvp.key">
        <object-properties-row :prop="kvp" :stream-id="streamId" :parent="realObject" />
      </div>
      <div v-if="currItems < kvps.length">
        <v-btn
          x-small
          block
          plain
          :class="`grey ${$vuetify.theme.dark ? 'darken-3' : 'lighten-2'}`"
          @click="currItems += maxItems"
        >
          Load More ({{ kvps.length - currItems }})
        </v-btn>
      </div>
    </div>
    <div v-else>
      <v-progress-linear indeterminate />
    </div>
  </div>
</template>
<script>
import gql from 'graphql-tag'

export default {
  name: 'ObjectProperties',
  components: {
    ObjectPropertiesRow: () => import('@/cleanup/components/viewer/ObjectPropertiesRow')
  },
  props: ['obj', 'streamId'],
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
        'displayMesh',
        'displayValue',
        '__importedUrl',
        'totalChildrenCount'
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
    if (this.obj.referencedId || this.obj.referencedObject ) this.getRealObject()
    else {
      this.wasReference = false
      this.generateKVPs()
    }
  },
  methods: {
    async getRealObject() {
      this.loading = true
      let result = await this.$apollo.query({
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
      for (let key of Object.keys(this.realObject)) {
        if (this.ignoredProps.indexOf(key) !== -1) continue
        let value = this.realObject[key]
        let type = Array.isArray(this.realObject[key]) ? 'array' : typeof this.realObject[key]
        let extras = []
        if (value?.referencedId) extras.push('open', 'visibility')
        if (
          type === 'array' &&
          value &&
          value[0]?.referencedId &&
          !this.realObject.speckle_type?.includes('Objects')
        )
          extras.push('visibility')
        // if (value)
        this.kvps.push({
          key,
          value,
          type,
          extras,
          length: type === 'array' ? value.length : null,
          visible: true
        })
      }
    }
  }
}
</script>
