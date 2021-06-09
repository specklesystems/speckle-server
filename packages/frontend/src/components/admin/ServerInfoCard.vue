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
    <div v-if="serverInfo">
      <v-fade-transition mode="out-in">
        <div v-if="edit" key="editPanel">
          <v-card-text v-for="(value,name) in serverDetails" :key="name" class="pt-0 pb-0">
            <span v-if="name === 'inviteOnly'">
              {{ name }}
              <v-btn :disabled="edit" v-model="serverInfo['name']">Enable</v-btn>
            </span>
            <v-text-field v-else :hint="value.hint" :label="value.label" dense outlined v-model="serverInfo[name]"/>
          </v-card-text>
        </div>
        <div v-else key="viewPanel">
          <div class="d-flex align-center pb-2" outlined v-for="(value,name) in serverDetails" :key="name">
            <span class="cover-fill secondary rounded-r-0 d-inline-block" disabled style="min-width: 25%">{{ value.label }}</span>
            <v-text-field dense solo hide-details :hint="value.hint"  v-model="serverInfo[name]" class="rounded-l-0">
            </v-text-field>
          </div>
        </div>
      </v-fade-transition>
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
</style>
