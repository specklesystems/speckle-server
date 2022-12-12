<template>
  <table class="table-auto w-full text-left">
    <thead>
      <tr class="text-foreground-2 label font-semibold">
        <th style="width: 20%">Owner</th>
        <th style="width: 30%">Last comment</th>
        <th>Commented</th>
        <th>Replies</th>
        <th>Participants</th>
        <th>Preview</th>
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
</template>
