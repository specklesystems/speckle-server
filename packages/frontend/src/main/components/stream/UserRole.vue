<template>
  <div class="d-flex flex-grow-1 align-center">
    <div class="px-1">
      <user-avatar
        :id="userSelf.id"
        :key="userSelf.id"
        :avatar="userSelf.avatar"
        :name="userSelf.name"
        :size="30"
      />
    </div>
    <div class="px-1">{{ user.name }}</div>
    <div class="px-1 flex-grow-1 text-right">
      <!-- <v-btn x-small color="primary">change</v-btn> -->
      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn x-small color="" dark v-bind="attrs" :disabled="disabled" v-on="on">
            Change
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item
            v-for="(item, index) in roles.filter((r) => r.name !== user.role)"
            :key="index"
            @click="
              userSelf.role = item.name
              $emit('update-user-role', userSelf)
            "
          >
            <v-list-item-action>
              <v-icon small>mdi-chevron-right</v-icon>
            </v-list-item-action>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('remove-user', userSelf)">
            <v-list-item-action>
              <v-icon small class="red--text text--red">mdi-close</v-icon>
            </v-list-item-action>
            <v-list-item-title class="red--text text--red">remove</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>
<script>
export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    user: { type: Object, default: () => null },
    roles: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false }
  },
  data() {
    return {
      userSelf: this.user
    }
  },
  mounted() {}
}
</script>
