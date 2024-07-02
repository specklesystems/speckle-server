<template>
  <LayoutSidebar>
    <LayoutSidebarMenu>
      <LayoutSidebarMenuGroup>
        <LayoutSidebarMenuGroupItem label="Dashboard" :to="homeRoute">
          <template #icon>
            <HomeIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Projects" :to="homeRoute">
          <template #icon>
            <Squares2X2Icon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Activity" :to="homeRoute">
          <template #icon>
            <PresentationChartLineIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
      </LayoutSidebarMenuGroup>

      <LayoutSidebarMenuGroup title="Workspaces">
        <LayoutSidebarMenuGroupItem label="Benjamin's space" :to="homeRoute">
          <template #icon>
            <UserAvatar size="sm" />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Acme Inc" :to="homeRoute">
          <template #icon>
            <UserAvatar size="sm" />
          </template>
        </LayoutSidebarMenuGroupItem>
      </LayoutSidebarMenuGroup>

      <LayoutSidebarMenuGroup title="Favorites">
        <LayoutSidebarMenuGroupItem label="Different Houses" :to="homeRoute">
          <template #icon>
            <Squares2X2Icon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Acme Inc" :to="homeRoute">
          <template #icon>
            <Squares2X2Icon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="The Palace" :to="homeRoute">
          <template #icon>
            <CubeIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="An automation name" :to="homeRoute">
          <template #icon>
            <BoltIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
      </LayoutSidebarMenuGroup>

      <LayoutSidebarMenuGroup title="Resources">
        <LayoutSidebarMenuGroupItem label="Connectors" :to="homeRoute">
          <template #icon>
            <PuzzlePieceIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Community Forum" :to="homeRoute">
          <template #icon>
            <UsersIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Documentation" :to="homeRoute">
          <template #icon>
            <BookOpenIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Changelog" :to="homeRoute">
          <template #icon>
            <HeartIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
        <LayoutSidebarMenuGroupItem label="Give us feedback" :to="homeRoute">
          <template #icon>
            <ChatBubbleLeftIcon />
          </template>
        </LayoutSidebarMenuGroupItem>
      </LayoutSidebarMenuGroup>
    </LayoutSidebarMenu>
  </LayoutSidebar>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  CubeIcon,
  BoltIcon,
  PuzzlePieceIcon,
  UsersIcon,
  BookOpenIcon,
  HeartIcon,
  ChatBubbleLeftIcon
} from '@heroicons/vue/24/outline'
import { homeRoute } from '~~/lib/common/helpers/route'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup,
  UserAvatar
} from '@speckle/ui-components'
</script>
