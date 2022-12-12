<template>
  <table class="table-auto w-full text-left">
    <thead>
      <tr class="text-foreground-2 label font-semibold">
        <th>Preview</th>
        <th style="width: 40%">Model title</th>
        <th>Versions</th>
        <th>Comments</th>
        <th>Last modified</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      <tr class="h-3">
        <!-- You can't use margins on thead, hence this hack -->
      </tr>
      <template v-for="n in 8" :key="n">
        <ProjectPageLatestItemsModelsListItem />
        <tr v-if="n !== 8" class="h-4" />
      </template>
    </tbody>
  </table>
</template>
