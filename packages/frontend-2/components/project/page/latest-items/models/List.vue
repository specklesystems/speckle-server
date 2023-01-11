<template>
  <div class="overflow-x-auto simple-scrollbar">
    <table class="table-fixed text-left w-[928px] lg:w-full">
      <thead>
        <tr class="text-foreground-2 label font-semibold">
          <th class="w-[100px]">Preview</th>
          <th class="w-5">
            <!-- Fake padding -->
          </th>
          <th>Model title</th>
          <th class="w-[70px]">Versions</th>
          <th class="w-[85px]">Threads</th>
          <th class="w-[155px]">Last modified</th>
          <th class="w-[140px]">Created</th>
        </tr>
      </thead>
      <tbody>
        <tr class="h-3">
          <!-- You can't use margins on thead, hence this hack -->
        </tr>
        <template v-if="items.length">
          <template v-for="(item, i) in items" :key="item.id">
            <ProjectPageLatestItemsModelsListItem :model="item" />
            <tr v-if="i !== items.length - 1" class="h-4" />
          </template>
        </template>
        <template v-else>
          <tr>
            <td colspan="7">TODO: List view empty state</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { ProjectLatestModelsQuery } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  models?: ProjectLatestModelsQuery
}>()

const items = computed(() => props.models?.project?.models?.items || [])
</script>
