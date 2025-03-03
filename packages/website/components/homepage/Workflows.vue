<template>
  <div>
    <div class="grid grid-cols-2 mb-6">
      <div class="flex items-center">
        <h3 class="text-4xl font-bold tracking-tight">
          Productive workflows that save you time
        </h3>
      </div>
      <div class="flex items-center h-32">
        <div class="text-body text-right text-foreground-2">
          Unify your tech stack & gain data-driven insights for decision making and Set
          the maximum width of an element using the max-w-* utilities.
        </div>
      </div>
    </div>
    <div
      v-if="useCases"
      class="w-full py-4 px-2 bg-foundation-2 shadow-inner dark:shadow-neutral-700/30 rounded-xl"
    >
      <div class="flex flex-wrap md:flex-nowrap">
        <button
          v-for="useCase in useCases"
          :key="useCase._id"
          :class="[
            'w-full md:w-full rounded-lg py-2.5 px-2 text-heading-lg leading-5 transition-all hover:text-primary focus:outline-0 overflow-hidden',
            '',
            selectedUseCaseId === useCase._id
              ? 'bg-foundation text-primary shadow'
              : ' '
          ]"
          @click="
            selectedUseCaseId = selectedUseCaseId === useCase._id ? '' : useCase._id
          "
        >
          {{ useCase.title }}
        </button>
      </div>

      <div
        v-if="workflows"
        class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-if="filteredWorkflows.length == 0"
          class="flex items-center justify-center space-x-2 col-span-3"
        >
          <div class="text-foreground-2 text-body-xs">No workflows found</div>
        </div>
        <NuxtLink
          v-for="workflow in filteredWorkflows"
          :key="workflow._id"
          :to="`/workflows/${workflow.slug.current}`"
          class="block h-full shadow-blue-500/40 transition"
        >
          <LayoutPanel class="group">
            <template #header>
              <h4 class="text-heading line-clamp-2 flex items-center space-x-2">
                <NuxtImg
                  :src="workflow?.source.imageUrl"
                  class="h-5 rounded-md grayscale opacity-50 transition-all group-hover:opacity-100 group-hover:grayscale-0 mr-"
                />
                <span>{{ workflow?.source.name }}</span>
                <span>to</span>
                <NuxtImg
                  :src="workflow?.receiver.imageUrl"
                  class="h-5 rounded-md grayscale opacity-50 transition-all group-hover:opacity-100 group-hover:grayscale-0 mr-"
                />
                <span>{{ workflow?.receiver.name }}</span>
              </h4>
            </template>
            <div class="text-body-xs text-foreground-2 -my-3">
              Collaborate with ease while tracking changes in real-time.
            </div>
          </LayoutPanel>
        </NuxtLink>
      </div>
      <div
        v-if="selectedUsecase"
        class="mt-4 px-10 text-center rounded-lg bg-foundation shadow p-4"
      >
        <div class="flex items-center justify-center space-x-2">
          <div class="text-foreground-2 text-body-xs">
            {{ selectedUsecase?.subheading }}
          </div>
          <FormButton size="sm" text>
            See all {{ selectedUsecase.title }} workflows
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const selectedUseCaseId = ref('')

const useCaseQuery = groq`*[_type == "useCase"]{...}`
const { data: useCases } = useSanityQuery(useCaseQuery)

const selectedUsecase = computed(() => {
  if (selectedUseCaseId.value === '') return
  return useCases?.value?.find((u) => u._id === selectedUseCaseId.value)
})

const workflowsQuery = groq`*[_type == "workflow"]{_id, title, slug, content, useCase->{title, _id}, source -> {name, "imageUrl": image.asset->url}, receiver -> {name, "imageUrl": image.asset->url}}`
const { data: workflows } = useSanityQuery(workflowsQuery)

const filteredWorkflows = computed(() => {
  if (selectedUseCaseId.value === '') return workflows.value ?? []
  if (!workflows) return []
  const x = workflows?.value?.filter(
    (workflow) => workflow.useCase._id === selectedUseCaseId.value
  )
  console.log(x)
  return x
})
</script>
