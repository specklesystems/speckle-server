<template>
  <div
    class="bg-foundation dark:bg-foundation-2 w-full relative border-b border-outline-2 h-full overflow-clip flex justify-center"
  >
    <div
      class="z-2 absolute -top-40 left-auto transform rotate-45 rounded-full p-40 border-[150px] border-b-white border-l-indigo-600 dark:border-l-indigo-400 border-r-rose-900 dark:border-r-rose-500 border-t-white blur-[200px]"
    ></div>

    <div
      class="absolute shadow-2xl rounded-md my-8 p-2 gap-2 flex align-middle top-0 border z-55 w-80 h-full bg-foundation border-outline-2"
    >
      <WorkspaceAvatar name="My workspace" logo="" />
      <span
        class="h-[30px] flex place-items-center text-foreground-3 text-body-3xs font-medium"
      >
        My workspace
      </span>
    </div>
    <ul
      class="relative m-0 list-none h-[204px] w-[302px] my-20 p-0 border border-outline-2 flex bg-foundation-page justify-center rounded-md"
    >
      <li class="absolute z-65 justify-center rounded-md p-2 w-full">
        <div class="flex justify-between w-full gap-2 h-20">
          <div
            class="absolute h-20 w-[90px] card-slide-in border border-outline-2 bg-foundation rounded-md p-4 place-items-center flex-1"
          >
            <IllustrationProjectShape />
          </div>
          <div
            class="border border-outline-5 border-dashed bg-foundation-2 rounded-md p-4 flex-1 place-items-center"
          ></div>
          <div class="border border-outline-2 bg-foundation rounded-md p-4 flex-1">
            <IllustrationProjectShape class="rotate-180" />
          </div>
          <div class="border border-outline-2 bg-foundation rounded-md p-4 flex-1">
            <IllustrationProjectShape class="rotate-90" />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.card-slide-in {
  animation: 2s slide-in-right ease-in-out forwards;
  top: 8px;
  left: -8px;
  transform-origin: bottom left;
}

@keyframes slide-in-right {
  0% {
    transform: translateY(0) translateX(0) rotate(-20deg) scale(1.5);
    opacity: 0;
  }

  100% {
    transform: translateY(0) translateX(16px) rotate(0deg) scale(1);
    opacity: 1;
  }
}
</style>
