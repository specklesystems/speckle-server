<template>
  <admin-card title="Server Info">
    <template v-slot:menu>
      <v-btn small outlined rounded color="primary" v-if="!edit" @click="edit = !edit">
        <v-icon size="medium">mdi-pencil</v-icon>
        Edit
      </v-btn>
      <v-btn small outlined rounded color="success" v-if="edit" @click="saveEdit">
        <v-icon size="medium">mdi-check-bold</v-icon>
        Save
      </v-btn>
      <v-btn small outlined rounded color="error" v-if="edit" @click="cancelEdit">
        <v-icon size="medium">mdi-close-thick</v-icon>
        Cancel
      </v-btn>
    </template>
    <div v-if="serverInfo && edit">
      <v-card-text v-for="(value,name) in serverDetails" :key="name" class="pt-0 pb-0">
        <span v-if="name == 'inviteOnly'">
          {{ name }}
          <v-btn :disabled="edit" v-model="serverInfo['name']">Enable</v-btn>
        </span>
        <v-text-field v-else :hint="value.hint" :label="value.label" dense outlined :disabled="!edit"
                      v-model="serverInfo[name]"></v-text-field>
      </v-card-text>
    </div>
    <div v-else-if="serverInfo && !edit">
      <v-card-text v-for="(value,name) in serverDetails" :key="name" class="pt-0">
        <v-btn-toggle elevation="0" borderless dense>
          <v-btn class="no-events" small color="primary">{{ value.label }}</v-btn>
          <v-btn class="no-events" small>{{ serverInfo[name] }}</v-btn>
        </v-btn-toggle>
      </v-card-text>
    </div>
  </admin-card>
</template>

<script>
import AdminCard from "@/components/admin/AdminCard";
import gql from "graphql-tag";

export default {
  name: "ServerInfoAdminCard",
  components: { AdminCard },
  data() {
    return {
      edit: false,
      serverDetails: {
        name: {
          label: "Name",
          hint: "This server's public name"
        },
        description: {
          label: "Description",
          hint: "A short description of this server"
        },
        company: {
          label: "Company",
          hint: "The owner of this server"
        },
        adminContact: {
          label: "Admin contact",
          hint: "The administrator of this server"
        },
        termsOfService: {
          label: "Terms of service",
          hint: "Url pointing to the terms of service page"
        },
        inviteOnly: {
          label: "Invite-Only mode"
        }
      }
    };
  },
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            description
            adminContact
            termsOfService
            inviteOnly
          }
        }
      `
    }
  },
  methods: {
    cancelEdit() {
      this.edit = false;
      this.loading = false;
      this.saving = false;
    },
    saveEdit() {
      this.$apollo.mutate({
        mutation: gql``
      });
    }
  }
};
</script>

<style scoped>
.no-events {
  pointer-events: none;
}
</style>
