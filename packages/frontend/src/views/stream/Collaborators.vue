<template>
  <v-row>
    <v-col cols="12">
      <breadcrumb-title />
      <h3 class="title font-italic font-weight-thin my-5">Manage who has access to this Stream</h3>

      <collaborators-manage />
    </v-col>
  </v-row>
</template>
<script>
export default {
  name: 'Collaborators',
  components: {
    BreadcrumbTitle: () => import('@/components/BreadcrumbTitle'),
    CollaboratorsManage: () => import('@/components/CollaboratorsManage')
  },
  data() {
    return {}
  }
}
</script>
