<template>
  <div class="w-full grid grid-cols-[4fr_6fr] grid-flow-row gap-2">
    <div class="col-span-2 row-span-1">Graph Name</div>
    <template v-for="(a, i) in ['', '', '']" :key="i">
      <div class="pl-2 pr-4 h-6 flex items-center">
        <p class="text-sm">Label</p>
      </div>
      <div>
        <div class="w-full h-full bg-foundation-2 rounded-md p-[2px]">
          <div class="w-full h-full flex flex-row">
            <div
              class="h-full border border-2 border-white rounded-md overflow-hidden flex flex-row"
              :style="{ width: '60%' }"
            >
              <div
                v-for="(config, j) in [60, 30, 10]"
                :key="j"
                class="h-full bg-red-500"
                :style="{ width: `${config}%`, opacity: config / 100 }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="col-start-2 col-span-1 row-span-1">
      <div class="w-full h-full flex justify-between">
        <p class="text-sm">0</p>
        <p class="text-sm">100%</p>
      </div>
    </div>
  </div>
</template>
