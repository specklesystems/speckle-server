<template>
  <div class="overflow-x-auto simple-scrollbar">
    <table class="table-fixed text-left w-[928px] lg:w-full">
      <thead>
        <tr class="text-foreground-2 label font-semibold">
          <th class="w-[250px]">Owner</th>
          <th>Last comment</th>
          <th class="w-[100px] xl:w-[140px]">Commented</th>
          <th class="w-[70px]">Replies</th>
          <th class="w-[86px] xl:w-[153px]">Participants</th>
          <th class="w-[100px]">Preview</th>
        </tr>
      </thead>
      <tbody>
        <tr class="h-3">
          <!-- You can't use margins on thead, hence this hack -->
        </tr>
        <template v-for="n in 8" :key="n">
          <ProjectPageLatestItemsCommentsListItem />
          <tr v-if="n !== 8" class="h-4" />
        </template>
      </tbody>
    </table>
  </div>
</template>
