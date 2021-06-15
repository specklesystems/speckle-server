<template>
  <user-list-item :admin="admin" :widgets="widgets">
    <v-slide-x-reverse-transition hide-on-leave>
      <v-menu offset-y left rounded v-if="!deleteRequested">
        <template v-slot:activator="{attrs,on}">
          <v-btn icon small v-bind="attrs" v-on="on" class="ml-2">
            <v-icon small>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list nav dense>
          <v-tooltip left max-width="200pt" open-delay="500">
            <template v-slot:activator="{attrs, on}">
              <v-list-item v-bind="attrs" v-on="on" v-for="opt in menuOptions" :key="opt.text" link @click="deleteRequested = true">
                <v-list-item-icon class="mr-3">
                  <v-icon color="error" small v-text="opt.icon"></v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title v-text="opt.text" class="error--text"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
            Removes this user's admin privileges. This <b>will not</b> delete the user's account.
          </v-tooltip>
        </v-list>
      </v-menu>
      <div v-else>
        <p class="caption mb-1 text-center">Are you sure?</p>
        <v-btn small color="success" @click="removeUserAdmin(admin)" class="mr-1">Yes</v-btn>
        <v-btn small color="error" @click="deleteRequested = !deleteRequested">Cancel</v-btn>
      </div>
    </v-slide-x-reverse-transition>
  </user-list-item>
</template>
<script>
import AnimatedNumber from "@/components/AnimatedNumber";
import UserListItem from "@/components/admin/UserListItem";

export default {
  name: "server-admins-user",
  components: { UserListItem, AnimatedNumber },
  props: {
    admin: {}
  },
  data() {
    return {
      deleteRequested: false,
      menuOptions: [
        {
          text: "Remove",
          icon: "mdi-delete"
        }
      ]
    };
  },
  computed: {
    widgets(){
      return [
        {
          icon: 'mdi-eye',
          hint: 'Last seen',
          value: '< 1 day',
          type: 'text'
        }
      ]
    }
  },
  methods: {
    removeUserAdmin(admin) {
      console.log("Requested removal of user from admin scope", admin);
      this.deleteRequested = false;
    }
  }
};
</script>
<style scoped lang="scss">
.admin-user-view {
  border-bottom: 1pt dotted var(--v-background-darken1);
}
</style>
