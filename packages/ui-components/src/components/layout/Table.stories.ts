import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import {
  PencilIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/vue/24/outline'
import Table from '~~/src/components/layout/Table.vue'

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
      <Table 
        :items="args.items"
        :buttons="args.buttons"
        :columns="args.columns"
        :overflow-cells="args.overflowCells"
        :on-row-click="args.onRowClick"
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
          <select class="w-full">
            <option v-for="role in args.roles" :key="role" :value="role">{{ role }}</option>
          </select>
        </template>
      </Table>
    `
  }),
  args: {
    columns: [
      { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
      { id: 'email', header: 'Email', classes: 'col-span-3 truncate' },
      { id: 'emailState', header: 'Email State', classes: 'col-span-2' },
      { id: 'company', header: 'Company', classes: 'col-span-2 truncate' },
      { id: 'role', header: 'Role', classes: 'col-span-2' }
    ],
    items: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://i.pravatar.cc/150?img=1',
        verified: true,
        company: 'Google',
        role: 'Admin'
      },
      {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        avatar: 'https://i.pravatar.cc/150?img=2',
        verified: false,
        company: 'Microsoft',
        role: 'User'
      },
      {
        id: 3,
        name: 'Michael O’Brien',
        email: 'michael.obrien@example.com',
        avatar: 'https://i.pravatar.cc/150?img=3',
        verified: true,
        company: 'Amazon',
        role: 'Manager'
      },
      {
        id: 4,
        name: 'Sarah Kim',
        email: 'sarah.kim@example.com',
        avatar: 'https://i.pravatar.cc/150?img=4',
        verified: false,
        company: 'Netflix',
        role: 'Developer'
      },
      {
        id: 5,
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@example.com',
        avatar: 'https://i.pravatar.cc/150?img=5',
        verified: true,
        company: 'Adobe',
        role: 'Designer'
      },
      {
        id: 6,
        name: 'Emily Johnson',
        email: 'emily.johnson@example.com',
        avatar: 'https://i.pravatar.cc/150?img=6',
        verified: false,
        company: 'Salesforce',
        role: 'Admin'
      },
      {
        id: 7,
        name: 'Fiona Chen',
        email: 'fiona.chen@example.com',
        avatar: 'https://i.pravatar.cc/150?img=7',
        verified: true,
        company: 'Spotify',
        role: 'User'
      },
      {
        id: 8,
        name: 'David Smith',
        email: 'david.smith@example.com',
        avatar: 'https://i.pravatar.cc/150?img=8',
        verified: false,
        company: 'Tesla',
        role: 'Manager'
      },
      {
        id: 9,
        name: 'Aaliyah Jackson',
        email: 'aaliyah.jackson@example.com',
        avatar: 'https://i.pravatar.cc/150?img=9',
        verified: true,
        company: 'Facebook',
        role: 'Developer'
      },
      {
        id: 10,
        name: 'Mohamed Ali',
        email: 'mohamed.ali@example.com',
        avatar: 'https://i.pravatar.cc/150?img=10',
        verified: false,
        company: 'Twitter',
        role: 'Designer'
      },
      {
        id: 11,
        name: 'Sophia Lee',
        email: 'sophia.lee@example.com',
        avatar: 'https://i.pravatar.cc/150?img=11',
        verified: true,
        company: 'Snap Inc.',
        role: 'Admin'
      },
      {
        id: 12,
        name: 'Liam Brown',
        email: 'liam.brown@example.com',
        avatar: 'https://i.pravatar.cc/150?img=12',
        verified: false,
        company: 'Apple',
        role: 'User'
      }
    ],
    overflowCells: false,
    onRowClick: (item: unknown) => console.log('Row clicked', item),
    roles: ['Admin', 'User', 'Guest']
  }
}

export const WithButtons: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    buttons: [
      {
        icon: DocumentDuplicateIcon,
        label: 'Duplicate',
        action: (item: unknown) => action('Duplicate')(item),
        class: 'text-gray-500'
      },
      {
        icon: PencilIcon,
        label: 'Delete',
        action: (item: unknown) => action('Edit')(item),
        class: 'text-primary'
      },
      {
        icon: TrashIcon,
        label: 'Edit',
        action: (item: unknown) => action('Delete')(item),
        class: 'text-red-700'
      }
    ]
  }
}

export const NoItems: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    items: []
  }
}
