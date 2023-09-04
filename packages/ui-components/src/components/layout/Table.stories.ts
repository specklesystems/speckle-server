import { Meta, StoryObj } from '@storybook/vue3'
import Table from '~~/src/components/layout/Table.vue'
import { ItemType } from '~~/src/components/layout/Table.vue'
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

export default {
  component: Table,
  parameters: {
    docs: {
      description: {
        component: 'A basic Table with optional buttons'
      }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { Table, ShieldCheckIcon, ShieldExclamationIcon, TrashIcon },
    setup() {
      return { args }
    },
    template: `
      <div>
        <Table 
          v-bind="args" 
          :headers="args.headers"
          :items="args.items"
          :buttons="args.buttons"
          :column-classes="args.columnClasses"
          :overflow-cells="args.overflowCells"
        >
          <template #name="{ item }">
            <div class="flex items-center gap-2">
              <img :src="item.avatar" class="rounded-full h-8"/>
              {{ item.name }}
            </div>
          </template>

          <template #email="{ item }">
            {{ item.email }}
          </template>

          <template #emailState="{ item }">
            <div class="flex items-center gap-2 select-none">
              <template v-if="item.verified">
                <ShieldCheckIcon class="h-4 w-4 text-primary" />
                <span>verified</span>
              </template>
              <template v-else>
                <ShieldExclamationIcon class="h-4 w-4 text-danger" />
                <span>not verified</span>
              </template>
            </div>
          </template>

          <template #company="{ item }">
            {{ item.company }}
          </template>

          <template #role="{ item }">
            <select>
              <option v-for="role in args.roles" :key="role" :value="role">{{ role }}</option>
            </select>
          </template>
        </Table>
      </div>
    `
  }),
  args: {
    headers: [
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'emailState', title: 'Email State' },
      { id: 'company', title: 'Company' },
      { id: 'role', title: 'Role' }
    ],
    items: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://placeholder.com/50',
        verified: true,
        company: 'Google',
        role: 'Admin'
      },
      {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        avatar: 'https://placeholder.com/50',
        verified: false,
        company: 'Microsoft',
        role: 'User'
      }
    ],
    buttons: [
      {
        icon: TrashIcon,
        label: 'Delete',
        action: (item: ItemType) => console.log('Delete', item)
      }
    ],
    columnClasses: {
      name: 'col-span-3 truncate',
      email: 'col-span-3 truncate',
      emailState: 'col-span-2',
      company: 'col-span-2 truncate',
      role: 'col-span-2'
    },
    overflowCells: false,
    roles: ['Admin', 'User', 'Guest']
  }
}
