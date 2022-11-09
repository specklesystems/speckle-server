<template>
  <div class="">
    <header class="my-6">
      <div class="text-foreground">
        <h1 class="h3 mb-2 px-2">Design System Demo</h1>
        <p class="px-2">
          Hello, {{ user?.name || 'guest' }}! Here are some design system examples.
        </p>
      </div>
    </header>

    <div class="">
      <LayoutPanel class="background text-foreground mb-4">
        <template #header>
          <span class="h3">Typograhpy</span>
        </template>
        <template #default>
          <p>Classic headings:</p>
          <div class="mt-4 flex flex-col gap-y-4">
            <div class="h1">Heading 1 YOLO</div>
            <div class="h2">Heading 2</div>
            <div class="h3">Heading 3</div>
            <div class="h4">Heading 4</div>
            <div class="h5">Heading 5</div>
            <div class="normal">Normal text</div>
            <div class="label">Label text</div>
            <div class="label label--light">Label text (light)</div>
            <div class="caption">Caption text</div>
          </div>
          <div class="mt-4 px-4 py-12 rounded-lg shadow-inner bg-base-2">
            <b>Font faces?</b>
            system ui only - using github's stack. Lighter, better performance, no more
            google fonts trakcing and a more native look.
          </div>
          <div class="mt-4">
            <div class="font-sans">Font weights:</div>
            <ul>
              <li class="font-thin">Thin</li>
              <li class="font-extralight">Exta light</li>
              <li class="font-light">Light</li>
              <li class="font-normal">Normal</li>
              <li class="font-medium">Medium</li>
              <li class="font-semibold">SemiBold</li>
              <li class="font-bold">Bold</li>
              <li class="font-extrabold">ExtraBold</li>
              <li class="font-black">Black</li>
            </ul>
          </div>
        </template>
      </LayoutPanel>
      <LayoutPanel class="background text-foreground mb-4">
        <template #header>
          <span class="h3">Colors</span>
        </template>
        <template #default>
          <div>Here are the available foreground colors:</div>
          <div class="mt-4">
            <div class="mt-4 px-4 py-12 rounded-lg shadow-inner bg-base-2">
              <b class="text-primary">Text colors? &nbsp;</b>
              <span class="text-foreground">
                <b>foreground</b>
                for text you want to stand out.
              </span>
              <span class="text-foreground-2">
                <b>foreground-2</b>
                for text you don't want to stand out.
              </span>
            </div>
          </div>
          <div class="mt-4">
            <ul class="font-bold">
              <li class="text-foreground">text-foreground</li>
              <li class="text-foreground-2">text-foreground-2</li>
            </ul>
          </div>
          <div class="my-8">
            <div>
              <div>Here are the available background colors:</div>
              <div
                class="bg-base-page px-4 py-12 mt-2 block rounded-lg border-2 border-base-page"
              >
                <b>bg-base-page</b>
                - for use as the page background.
              </div>
              <div
                class="bg-base px-4 py-12 mt-2 block rounded-lg border-2 border-base-page"
              >
                <b>bg-base</b>
                - for use in any element that
                <b>sits</b>
                on the page.
              </div>
              <div
                class="bg-base-2 px-4 py-12 mt-2 block rounded-lg border-2 border-base-page"
              >
                <b>bg-base-2</b>
                - for use as the background for anything that needs to stand out.
              </div>
              <div
                class="bg-primary text-white px-4 py-12 mt-2 block rounded-lg border-2 border-base-page"
              >
                <b>bg-primary</b>
                - for use when you want to something to really pop.
              </div>
            </div>
          </div>
        </template>
      </LayoutPanel>
      <LayoutPanel class="background text-foreground mb-4">
        <template #header>
          <span class="h3">Buttons</span>
        </template>
        <template #default>
          <div class="flex flex-col space-y-4">
            <div>Here are some buttons:</div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="flex flex-col gap-y-4 p-6 rounded-lg border-4 border-primary-muted"
              >
                <p class="text-foreground">
                  <code
                    class="bg-primary-muted text-primary-focus text-xs pl-2 pr-0 py-1 mr-2 rounded"
                  >
                    type="primary"
                  </code>
                  Primary buttons for default element backgrounds
                </p>
                <hr class="border-primary-muted" />
                <div>
                  <FormButton to="/" size="small">Small primary button</FormButton>
                </div>
                <div><FormButton to="/">Basic primary button</FormButton></div>
                <div>
                  <FormButton to="/" size="big">Big primary button</FormButton>
                </div>
              </div>
              <div class="flex flex-col gap-y-4 p-6 rounded-lg bg-base-2">
                <p class="text-foreground">
                  <code
                    class="bg-primary text-white text-xs pl-2 pr-0 py-1 mr-2 rounded"
                  >
                    type="pop"
                  </code>
                  Pop buttons for accented element backgrounds (or normal ones)
                </p>
                <hr class="border-base" />
                <div>
                  <FormButton to="/" type="pop" size="small">
                    Small pop button
                  </FormButton>
                </div>
                <div><FormButton to="/" type="pop">Basic pop button</FormButton></div>
                <div>
                  <FormButton to="/" type="pop" size="big">Big pop button</FormButton>
                </div>
              </div>
              <div class="flex flex-col gap-y-4 p-6 rounded-lg bg-primary">
                <p class="text-white">
                  <code
                    class="bg-white text-primary text-xs pl-2 pr-0 py-1 mr-2 rounded"
                  >
                    type="invert"
                  </code>
                  Inverted buttons for accented element backgrounds
                </p>
                <hr class="border-primary-muted" />
                <div>
                  <FormButton to="/" type="invert" size="small">
                    Small invert button
                  </FormButton>
                </div>
                <div>
                  <FormButton to="/" type="invert">Basic invert button</FormButton>
                </div>
                <div>
                  <FormButton to="/" type="invert" size="big">
                    Big inverted button
                  </FormButton>
                </div>
              </div>
            </div>
            <div>
              <FormButton to="/" full-width>Full-width button</FormButton>
            </div>
            <div>
              <FormButton to="/" disabled>Disabled primary button</FormButton>
            </div>
            <div>
              <FormButton to="/" type="danger">Danger button</FormButton>
            </div>
            <div>
              <FormButton to="/" type="warning">Warning button</FormButton>
            </div>
            <div>
              <FormButton to="/" type="outline">Basic outline button</FormButton>
            </div>
          </div>
          <div class="my-8">
            <div>Link:</div>
            <div>
              <TextLink to="/">Basic Link</TextLink>
              |
              <TextLink to="/" disabled>Disabled Link</TextLink>
            </div>
          </div>
          <div class="my-8">
            <Form class="flex flex-col space-y-4" @submit="onSubmit">
              <div>Example form with various elements (we use vee-validate v4):</div>
              <div>
                <FormTextInput name="Basic" placeholder="Basic text input w/ label" />
              </div>
              <div>
                <FormTextInput
                  name="Error"
                  placeholder="Error input"
                  :rules="
                    (val) =>
                      val === 'valid' ? true : 'Type in `valid` to make this valid!'
                  "
                  validate-on-mount
                />
              </div>
              <div>
                <FormTextInput
                  name="input1"
                  label="Custom label"
                  placeholder="Input w/ help text and a custom label"
                  help="Here's a tip for ya!"
                />
              </div>
              <div>
                <FormTextInput
                  name="Required"
                  placeholder="This field is required"
                  :rules="(val) => (val ? true : 'Required')"
                  show-required
                />
              </div>
              <div>
                <FormTextInput
                  name="Disabled"
                  placeholder="This field is disabled"
                  disabled
                />
              </div>
              <div>
                <FormTextInput name="Email" placeholder="test@text.com" type="email" />
              </div>
              <div>
                <FormTextInput
                  name="Password"
                  placeholder="Enter PW here"
                  type="password"
                />
              </div>
              <div>
                <FormCheckbox name="Checkbox1" />
              </div>
              <div>
                <FormCheckbox
                  name="Checkboxreq"
                  label="Required checkbox"
                  show-required
                  :rules="(val) => (val ? true : 'Required!')"
                />
              </div>
              <div>
                <FormCheckbox
                  name="Checkbox2"
                  label="Custom label"
                  description="Here's a description!"
                />
              </div>
              <div>
                <FormCheckbox
                  name="Checkbox3"
                  description="Here's an inline description!"
                  inline-description
                />
              </div>
              <div>
                <FormCheckbox
                  name="errorcheckbox1"
                  label="Checkbox with error"
                  description="Hello world!"
                  :rules="
                    (val) => (val ? true : 'Check this in to get rid of the error!')
                  "
                  validate-on-mount
                />
              </div>
              <div><FormButton submit full-width type="pop">Submit</FormButton></div>
            </Form>
          </div>
        </template>
      </LayoutPanel>
      <LayoutPanel class="background text-foreground">
        <template #header>
          <span class="h3">Components</span>
        </template>
        <template #default>TODO</template>
      </LayoutPanel>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Form } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const activeUserQuery = graphql(`
  query GetActiveUser {
    activeUser {
      id
      name
      role
    }
  }
`)

const { result: activeUserResult } = useQuery(activeUserQuery)
const user = computed(() => activeUserResult.value?.activeUser || null)

const onSubmit = (values: unknown) => console.log(values)
const nav = useNav()
onMounted(() => {
  nav.value[0] = {
    to: `/designsystem`,
    name: 'Design System Demo',
    separator: true
  }
})

onUnmounted(() => {
  nav.value.splice(0, 1)
})
</script>
