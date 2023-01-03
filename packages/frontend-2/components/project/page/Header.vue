<template>
  <div>
    <div
      class="relative mb-3 mt-10 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center group">
        <h1
          class="h3 tracking-tight focus:outline-none border-b-2 transition border-transparent focus:border-gray-200 dark:focus:border-gray-800"
          contenteditable="true"
          @keydown="
            (e) => {
              if (e.keyCode === 13) e.preventDefault()
            }
          "
        >
          {{ project.name }}
        </h1>
        <PencilIcon
          class="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition text-foreground-2"
        />
      </div>
      <Portal to="navigation">
        <HeaderNavLink
          :to="projectRoute(project.id)"
          :name="project.name"
        ></HeaderNavLink>
      </Portal>
      <div class="flex items-center space-x-2">
        <Portal to="primary-actions">
          <div class="flex space-x-4">
            <FormButton :icon-left="ShareIcon">Share</FormButton>
          </div>
        </Portal>
      </div>
    </div>
    <div class="mt-3 flex items-center space-x-2">
      <InformationCircleIcon class="w-5 h-5 text-foreground-2" />
      <div
        class="normal text-foreground-2 focus:outline-none border-b-2 transition border-transparent focus:border-gray-200 dark:focus:border-gray-800"
        contenteditable="true"
        @keydown="
          (e) => {
            if (e.keyCode === 13) e.preventDefault()
          }
        "
      >
        {{ project.description || 'Click here to add a project description.' }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ShareIcon, PencilIcon } from '@heroicons/vue/20/solid'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { ProjectPageProjectHeaderFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment ProjectPageProjectHeader on Project {
    id
    name
    description
  }
`)

defineProps<{
  project: ProjectPageProjectHeaderFragment
}>()
</script>
