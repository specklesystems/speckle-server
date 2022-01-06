<template>
  <v-list dense nav class="mt-0 py-0 mb-3">
    <v-list-item
      v-if="!resource.data.error"
      :class="`px-2 list-overlay-${$vuetify.theme.dark ? 'dark' : 'light'} elevation-0`"
      active
      style="position: sticky; top: 82px"
      @click="expand = !expand"
    >
      <v-list-item-action>
        <v-icon v-if="resource.type === 'commit'" small>mdi-source-commit</v-icon>
        <v-icon v-if="resource.type === 'object'" small>mdi-cube-outline</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          {{ resource.type === 'commit' ? resource.data.commit.message : 'Object' }}
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action
        v-if="isMultiple"
        class="pa-0 ma-0"
        @click.stop="$emit('remove', resource)"
      >
        <v-btn
          v-if="$route.params.resourceId !== resource.id"
          v-tooltip="'Remove'"
          small
          icon
          @click.stop="$emit('remove', resource)"
        >
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>
      </v-list-item-action>
      <v-list-item-action v-if="isMultiple" class="pa-0 ma-0">
        <v-btn v-tooltip="'Isolate objects'" small icon @click.stop="isolate()">
          <v-icon x-small :class="`${isolated ? 'primary--text' : ''}`">mdi-filter</v-icon>
        </v-btn>
      </v-list-item-action>
      <v-list-item-action class="pa-0 ma-0">
        <v-btn small icon @click.stop="expand = !expand">
          <v-icon>{{ expand ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>

    <v-list-item v-else class="warning" dark>
      <v-list-item-action>
        <v-icon small>mdi-alert</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title v-tooltip="resource.id">
          Failed to load resource {{ resource.id }}.
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action class="pa-0 ma-0" @click.stop="$emit('remove', resource)">
        <v-btn
          v-if="$route.params.resourceId !== resource.id"
          v-tooltip="'Dismiss'"
          small
          icon
          @click.stop="$emit('remove', resource)"
        >
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>

    <div v-if="!resource.data.error">
      <v-expand-transition>
        <div v-show="expand" class="mt-3">
          <object-properties
            :obj="{
              referencedId:
                resource.type === 'commit'
                  ? resource.data.commit.referencedObject
                  : resource.data.object.id
            }"
            :stream-id="resource.data.id"
          />
        </div>
      </v-expand-transition>
    </div>
    <div v-else>
      <v-expand-transition>
        <v-alert v-show="expand" type="warning" dense class="text-truncate">
          {{ resource.data.message }}
        </v-alert>
      </v-expand-transition>
    </div>
  </v-list>
</template>
<script>
export default {
  components: {
    ObjectProperties: () => import('@/cleanup/components/viewer/ObjectProperties')
  },
  props: {
    resource: { type: Object, default: () => null },
    isMultiple: { type: Boolean, default: false },
    expandInitial: { type: Boolean, default: true }
  },
  data() {
    return {
      expand: this.expand,
      hiddenObjects: [],
      isolatedObjects: [],
      isolated: false,
      hidden: false
    }
  },
  computed: {},
  mounted() {
    this.$eventHub.$on('hide-objects', (ids) => {
      this.$eventHub.$emit('structure-filters', true)
      this.isolatedObjects = []
      this.hiddenObjects = [...new Set([...this.hiddenObjects, ...ids])]
      window.__viewer.applyFilter({
        filterBy: { id: { not: this.hiddenObjects } },
        ghostOthers: false
      })
      if (this.isolatedObjects.length !== 0 || this.hiddenObjects.length !== 0)
        this.$eventHub.$emit('show-visreset', true)
      else this.$eventHub.$emit('show-visreset', false)
    })
    this.$eventHub.$on('show-objects', (ids) => {
      this.$eventHub.$emit('structure-filters', true)
      this.hiddenObjects = this.hiddenObjects.filter((id) => ids.indexOf(id) === -1)
      if (this.hiddenObjects.length === 0) {
        this.$eventHub.$emit('filter-reset')
        this.$eventHub.$emit('show-visreset', false)
        window.__viewer.applyFilter(null)
      } else
        window.__viewer.applyFilter({
          filterBy: { id: { not: this.hiddenObjects } },
          ghostOthers: false
        })
      if (this.isolatedObjects.length !== 0 || this.hiddenObjects.length !== 0)
        this.$eventHub.$emit('show-visreset', true)
      else this.$eventHub.$emit('show-visreset', false)
    })
    this.$eventHub.$on('isolate-objects', (ids) => {
      this.$eventHub.$emit('structure-filters', true)
      this.hiddenObjects = []
      this.isolatedObjects = [...new Set([...this.isolatedObjects, ...ids])]
      window.__viewer.applyFilter({
        filterBy: { id: this.isolatedObjects },
        ghostOthers: true
      })
      if (this.isolatedObjects.length !== 0 || this.hiddenObjects.length !== 0)
        this.$eventHub.$emit('show-visreset', true)
      else this.$eventHub.$emit('show-visreset', false)
    })
    this.$eventHub.$on('unisolate-objects', (ids) => {
      this.$eventHub.$emit('structure-filters', true)
      this.isolatedObjects = this.isolatedObjects.filter((id) => ids.indexOf(id) === -1)
      if (this.isolatedObjects.length === 0) {
        this.$eventHub.$emit('filter-reset')
        this.$eventHub.$emit('show-visreset', false)
        return window.__viewer.applyFilter(null)
      }
      window.__viewer.applyFilter({
        filterBy: { id: this.isolatedObjects },
        ghostOthers: true
      })

      this.$eventHub.$emit('show-visreset', true)
    })
  },
  methods: {
    isolate() {
      this.isolated = !this.isolated
      if (!this.isolated) {
        window.__viewer.applyFilter(null)
        this.$eventHub.$emit('show-visreset', false)
        return
      }
      this.hidden = false
      window.__viewer.applyFilter({
        filterBy: {
          __importedUrl: [
            `${window.location.origin}/streams/${this.resource.data.id}/objects/${
              this.resource.type === 'commit'
                ? this.resource.data.commit.referencedObject
                : this.resource.data.object.id
            }`
          ]
        },
        ghostOthers: true
      })
      this.$eventHub.$emit('show-visreset', true)
    }
  }
}
</script>
<style scoped>
.list-overlay-dark {
  background: rgba(40, 40, 40, 1);
  z-index: 5;
}
.list-overlay-light {
  background: rgba(235, 235, 235, 1);
  z-index: 5;
}
</style>
