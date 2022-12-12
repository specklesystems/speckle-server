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
          <th class="w-[85px]">Comments</th>
          <th class="w-[140px]">Last modified</th>
          <th class="w-[140px]">Created</th>
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
  </div>
</template>
