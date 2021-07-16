<template>
  <admin-card title="General"></admin-card>
</template>

<script>
export default {
  name: 'SettingsGeneral',
  components: {
    AdminCard: () => import('@/components/admin/AdminCard')
  },
  props: {
    userRole: {
      type: String,
      default: null
    }
  }
}
</script>
