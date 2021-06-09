<template>
  <div>
    <admin-card title="Test card">
      <template slot="menu">
        <v-btn icon x-small color="primary">
          <v-icon small>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon x-small color="primary">
          <v-icon small>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon x-small color="primary">
          <v-icon small>mdi-pencil</v-icon>
        </v-btn>
      </template>
      User list goes here!
    </admin-card>
  </div>
</template>

<script>
import AdminCard from "@/components/admin/AdminCard";
export default {
  name: 'AdminUsers',
  components: { AdminCard }
}
</script>

<style scoped>

</style>
