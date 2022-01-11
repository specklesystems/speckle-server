<template>
  <div>
    <v-list rounded dense>
      <v-subheader>General</v-subheader>
      <v-list-item class="elevation-3xxx" link @click="newStreamDialog = true">
        <v-list-item-icon>
          <v-icon small class="">mdi-plus-box</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>New Stream</v-list-item-title>
          <!-- <v-list-item-subtitle class="caption">
            Quickly create a new data repository.
          </v-list-item-subtitle> -->
        </v-list-item-content>
      </v-list-item>
      <v-list-item class="elevation-3xxx" link @click="showServerInviteDialog()">
        <v-list-item-icon>
          <v-icon small class="">mdi-email</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Send Invite</v-list-item-title>
          <!-- <v-list-item-subtitle class="caption">
            Invite a colleague to Speckle!
          </v-list-item-subtitle> -->
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <server-invite-dialog ref="serverInviteDialog" />

    <v-dialog v-model="newStreamDialog" max-width="500" :fullscreen="$vuetify.breakpoint.xsOnly">
      <stream-new-dialog
        :open="newStreamDialog"
        @created="newStreamDialog = false"
        @close="newStreamDialog = false"
      />
    </v-dialog>
  </div>
</template>
<script>
export default {
  components: {
    ServerInviteDialog: () => import('@/components/dialogs/ServerInviteDialog'),
    StreamNewDialog: () => import('@/components/dialogs/StreamNewDialog'),
    SearchBar: () => import('@/components/SearchBar')
  },
  props: {
    OpenNewStream: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      newStreamDialog: false
    }
  },
  watch: {
    OpenNewStream(val, old) {
      this.newStreamDialog = true
    }
  },
  mounted() {},
  methods: {
    showServerInviteDialog() {
      this.$refs.serverInviteDialog.show()
    }
  }
}
</script>
