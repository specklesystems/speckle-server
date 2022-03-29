<template>
  <div>
    <v-card class="mx-2 mb-2 rounded-lg">
      <v-toolbar
        v-ripple
        class="transparent"
        flat
        style="cursor: pointer"
        @click.stop="expanded = !expanded"
      >
        <v-app-bar-nav-icon>
          <user-avatar
            :id="commit.authorId"
            :avatar="commit.authorAvatar"
            :name="commit.authorName"
          />
        </v-app-bar-nav-icon>
        <source-app-avatar :application-name="commit.sourceApplication" />
        <v-spacer />
        <v-btn
          v-if="$route.params.resourceId !== resource.id"
          v-tooltip="'Remove'"
          small
          icon
          @click.stop="$emit('remove', resource)"
        >
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>
        <v-btn
          v-tooltip="'Toggle visibility'"
          small
          icon
          @click.stop="toggleVisibility()"
        >
          <v-icon class="grey--text" style="font-size: 12px">
            {{ visible ? 'mdi-eye' : 'mdi-eye-off' }}
          </v-icon>
        </v-btn>
        <v-btn v-tooltip="'Isolate objects'" small icon @click.stop="isolate()">
          <v-icon x-small :class="`${isolated ? 'primary--text' : ''}`">
            mdi-filter
          </v-icon>
        </v-btn>
        <v-btn small icon @click.stop="expanded = !expanded">
          <v-icon x-small>{{ expanded ? 'mdi-minus' : 'mdi-plus' }}</v-icon>
        </v-btn>
      </v-toolbar>
      <div class="caption my-2 px-2 pb-2">
        {{ commit.message }}
        <v-divider class="my-2" />
        <timeago :datetime="commit.createdAt"></timeago>
        ,
        {{ new Date(commit.createdAt).toLocaleString() }}
      </div>
      <v-expand-transition>
        <div v-show="expanded" class="px-1 pb-2">
          <v-divider class="mx-2 my-2" />
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
    </v-card>
  </div>
</template>
<script>
export default {
  components: {
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar'),
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
    ObjectProperties: () => import('@/main/components/viewer/ObjectProperties')
  },
  props: ['resource'],
  data() {
    return {
      expanded: false
    }
  },
  computed: {
    commit() {
      return this.resource.data.commit
    },
    isolated() {
      return (
        this.$store.state.isolateValues.indexOf(
          this.resource.data.commit.referencedObject
        ) !== -1
      )
    },
    visible() {
      return (
        this.$store.state.hideValues.indexOf(
          this.resource.data.commit.referencedObject
        ) === -1
      )
    }
  },
  methods: {
    isolate() {
      let id = this.resource.data.commit.referencedObject
      if (this.isolated)
        this.$store.commit('unisolateObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
      else
        this.$store.commit('isolateObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
    },
    toggleVisibility() {
      let id = this.resource.data.commit.referencedObject
      if (this.visible)
        this.$store.commit('hideObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
      else
        this.$store.commit('showObjects', {
          filterKey: '__parents',
          filterValues: [id]
        })
    }
  }
}
</script>
