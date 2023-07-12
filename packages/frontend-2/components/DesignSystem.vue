<template>
  <div class="">
    <header class="my-6">
      <div class="text-foreground">
        <h1 class="h3 mb-2 px-2">Design System Demo</h1>
      </div>
    </header>

    <div class="space-y-4">
      <LayoutPanel class="background text-foreground">
        <template #header>
          <span class="h3">Typograhpy</span>
        </template>
        <template #default>
          <div class="my-10"></div>
          <p>Classic headings:</p>
          <div class="mt-4 flex flex-col gap-y-4">
            <div class="h1">Heading 1</div>
            <div class="h2">Heading 2</div>
            <div class="h3">Heading 3</div>
            <div class="h4">Heading 4</div>
            <div class="h5">Heading 5</div>
            <div class="normal">Normal text</div>
            <div class="label">Label text</div>
            <div class="label label--light">Label text (light)</div>
            <div class="caption">Caption text</div>
          </div>
          <div class="bg-foundation-focus mt-4 rounded-lg px-4 py-12 shadow-inner">
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
      <LayoutPanel class="background text-foreground">
        <template #header>
          <span class="h3">Colors</span>
        </template>
        <template #default>
          <div>Here are the available foreground colors:</div>
          <div class="mt-4">
            <div class="bg-foundation-focus mt-4 rounded-lg px-4 py-12 shadow-inner">
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
        </template>
      </LayoutPanel>
      <LayoutPanel class="background text-foreground">
        <template #header>
          <span class="h3">Buttons</span>
        </template>
        <template #default>
          <div class="my-8 flex flex-col gap-y-4 overflow-x-scroll">
            <div v-for="size in sizes" :key="size" class="grid grid-cols-6">
              <span class="caption col-span-4 text-center md:col-span-1">
                {{ size }}
              </span>
              <div><FormButton :size="size">Button</FormButton></div>
              <div><FormButton :size="size" disabled>Button</FormButton></div>
              <!-- <div><FormButton :size="size" rounded>Button</FormButton></div>
              <div><FormButton :size="size" rounded disabled>Button</FormButton></div> -->
              <div><FormButton :size="size" outlined>Button</FormButton></div>
              <div><FormButton :size="size" outlined disabled>Button</FormButton></div>
              <!-- <div><FormButton :size="size" rounded outlined>Button</FormButton></div> -->
              <div>
                <!-- <FormButton :size="size" rounded outlined disabled>Button</FormButton> -->
              </div>
            </div>
            <div v-for="size in sizes" :key="size" class="grid grid-cols-6">
              <span class="caption col-span-4 text-center md:col-span-1">
                {{ size }}
              </span>
              <div><FormButton :size="size" rounded>Button</FormButton></div>
              <div><FormButton :size="size" rounded disabled>Button</FormButton></div>
              <!-- <div><FormButton :size="size" rounded>Button</FormButton></div>
              <div><FormButton :size="size" rounded disabled>Button</FormButton></div> -->
              <div><FormButton :size="size" rounded outlined>Button</FormButton></div>
              <div>
                <FormButton :size="size" rounded outlined disabled>Button</FormButton>
              </div>
              <!-- <div><FormButton :size="size" rounded outlined>Button</FormButton></div> -->
              <div>
                <!-- <FormButton :size="size" rounded outlined disabled>Button</FormButton> -->
              </div>
            </div>
            <div v-for="size in sizes" :key="size" class="grid grid-cols-6">
              <span class="caption col-span-4 text-center md:col-span-1">
                {{ size }}
              </span>
              <div>
                <FormButton :size="size" :icon-left="XMarkIcon">Button</FormButton>
              </div>
              <div>
                <FormButton :size="size" disabled :icon-right="ArrowRightCircleIcon">
                  Button
                </FormButton>
              </div>
              <div>
                <FormButton :size="size" outlined :icon-right="XMarkIcon">
                  Button
                </FormButton>
              </div>
              <div>
                <FormButton :size="size" outlined disabled :icon-right="XMarkIcon">
                  Button
                </FormButton>
              </div>
              <!-- <div>
                <FormButton :size="size" rounded outlined :icon-right="XMarkIcon">
                  Button
                </FormButton>
              </div>
              <div>
                <FormButton :size="size" rounded outlined disabled :icon-right="XMarkIcon">
                  Button
                </FormButton>
              </div> -->
            </div>

            <div
              v-for="type in types"
              :key="type"
              class="flex flex-wrap space-x-4 py-6"
            >
              <span class="caption col-span-4 text-center md:col-span-1">
                {{ type }}
              </span>
              <div><FormButton :color="type">Delete</FormButton></div>
              <div><FormButton :color="type" disabled>Delete</FormButton></div>
              <div><FormButton :color="type" rounded>Delete</FormButton></div>
              <div><FormButton :color="type" rounded disabled>Delete</FormButton></div>
              <div><FormButton :color="type" outlined>Delete</FormButton></div>
              <div><FormButton :color="type" outlined disabled>Delete</FormButton></div>
              <div><FormButton :color="type" rounded outlined>Delete</FormButton></div>
              <div>
                <FormButton :color="type" rounded outlined disabled>Delete</FormButton>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-around rounded-md py-6">
              <FormButton text size="xs">Text</FormButton>
              <FormButton text size="sm">Text</FormButton>
              <FormButton text size="base">Text</FormButton>
              <FormButton text size="lg">Text</FormButton>
              <FormButton text size="xl">Text</FormButton>
              <FormButton text disabled>Text</FormButton>
              <FormButton text disabled>Text</FormButton>
              <FormButton text disabled>Text</FormButton>
            </div>
            <div class="bg-primary rounded-md">
              <div class="flex flex-wrap items-center justify-around py-6">
                <FormButton color="invert" text size="xs">Text</FormButton>
                <FormButton color="invert" text size="sm">Text</FormButton>
                <FormButton color="invert" text size="base">Text</FormButton>
                <FormButton color="invert" text size="lg">Text</FormButton>
                <FormButton color="invert" text size="xl">Text</FormButton>
                <FormButton color="invert" text disabled>Text</FormButton>
                <FormButton color="invert" text disabled>Text</FormButton>
                <FormButton color="invert" text disabled>Text</FormButton>
              </div>
              <div class="flex flex-wrap items-center justify-around py-6">
                <FormButton color="invert" invert size="xs" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" invert size="sm" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" invert size="base" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" invert size="lg" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" invert size="xl" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" invert rounded :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" invert outlined rounded>Button</FormButton>
                <FormButton color="invert" invert outlined :icon-right="XMarkIcon">
                  Button
                </FormButton>
              </div>
              <div class="flex flex-wrap items-center justify-around py-6">
                <FormButton color="invert" disabled size="xs" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" disabled size="sm" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" disabled size="base" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" disabled size="lg" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" disabled size="xl" :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" disabled rounded :icon-right="XMarkIcon">
                  Button
                </FormButton>
                <FormButton color="invert" disabled outlined rounded>Button</FormButton>
                <FormButton color="invert" disabled outlined :icon-right="XMarkIcon">
                  Button
                </FormButton>
              </div>
            </div>
          </div>
        </template>
      </LayoutPanel>
      <LayoutPanel class="background text-foreground">
        <template #header>
          <span class="h3">Avatars</span>
        </template>
        <template #default>
          <div class="flex justify-around">
            <div class="flex items-center space-x-2">
              <UserAvatar hover-effect size="xl" />
              <UserAvatar hover-effect size="lg" />
              <UserAvatar hover-effect />
              <UserAvatar hover-effect size="sm" />
              <UserAvatar hover-effect size="xs" />
            </div>
            <div class="flex items-center space-x-2">
              <UserAvatar
                :user="{ name: 'Dimitrie Stefanescu', id: 'ds' }"
                hover-effect
                size="xl"
              />
              <UserAvatar
                :user="{ name: 'Andrei Stefanescu', id: 'ds' }"
                hover-effect
                size="lg"
              />
              <UserAvatar
                :user="{ name: 'Dimitrie Berbinski', id: 'ds' }"
                hover-effect
              />
              <UserAvatar
                :user="{ name: 'Zorkan Stefanescu', id: 'ds' }"
                hover-effect
                size="sm"
              />
              <UserAvatar
                :user="{ name: 'Gergo Cant Type Your Last Name', id: 'ds' }"
                hover-effect
                size="xs"
              />
            </div>
            <div class="flex items-center space-x-2">
              <UserAvatar
                :user="{ name: 'Dimitrie Stefanescu', id: 'ds', avatar: img }"
                hover-effect
                size="xl"
              />
              <UserAvatar
                :user="{ name: 'Andrei Stefanescu', id: 'ds', avatar: img }"
                hover-effect
                size="lg"
              />
              <UserAvatar
                :user="{ name: 'Dimitrie Berbinski', id: 'ds', avatar: img }"
                hover-effect
              />
              <UserAvatar
                :user="{ name: 'Zorkan Stefanescu', id: 'ds', avatar: img }"
                hover-effect
                size="sm"
              />
              <UserAvatar
                :user="{
                  name: 'Gergo Cant Type Your Last Name',
                  id: 'ds',
                  avatar: img
                }"
                hover-effect
                size="xs"
              />
            </div>
          </div>
        </template>
      </LayoutPanel>
      <LayoutPanel class="background text-foreground">
        <template #header>
          <span class="h3">Links & form elements</span>
        </template>
        <template #default>
          <div class="my-8">
            <div>Link:</div>
            <div>
              <CommonTextLink>Basic Link</CommonTextLink>
              |
              <CommonTextLink disabled>Disabled Link</CommonTextLink>
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
              <div><FormButton submit full-width>Submit</FormButton></div>
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
import { XMarkIcon, ArrowRightCircleIcon } from '@heroicons/vue/24/solid'

const logger = useLogger()
const onSubmit = (values: unknown) => logger.info(values)
type FormButtonSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
type FormButtonColor = 'default' | 'invert' | 'danger' | 'warning'
const sizes: FormButtonSize[] = ['xs', 'sm', 'base', 'lg', 'xl']
const types: FormButtonColor[] = ['danger', 'warning']
const img =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAuRXhpZgAATU0AKgAAAAgAAkAAAAMAAAABAD4AAEABAAEAAAABAAAAAAAAAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAA+AGQDASIAAhEBAxEB/8QAGwABAAIDAQEAAAAAAAAAAAAABQQGAAIDBwH/xAAjEAACAQUAAgIDAQAAAAAAAAAAAQQCAxEhMUFRBRITFGGh/8QAGgEAAwADAQAAAAAAAAAAAAAAAwQFAQIGB//EAB4RAAIDAQEBAAMAAAAAAAAAAAADAQIRBBITFCEx/9oADAMBAAIRAxEAPwBqmw2zqo2fBPtR98JtqLlcN6sOl6o/QDXEfo4VwqmWtQsrhrVB/gzRpzXVJT6oTzw0cN+mW2qB/DjXCx4/wPVhzvVaYKrVFa8HC5HaLPeiY8EG/HxnQettIrG5JW7thkK9ZLDfsh0i0M1k1o2dAL9rTQfft9HZFHQ2TQMV/g8q4Q7ezCU6dmG436Peo9lOrgrHjrHCFFa+w5ESwjirbB6N020+URVjhs4a9CVmhYO341gzS8wQOiugNcNeiHfiJZ0WW5aXogyLS3oZowg9KtKtJj48BMqzjJaJdtbA5lHR9VtITkTpXZNGM6CpNO2OS6eg8pFCgGqp0HkLoVJ4xaVrIPJfRqsDyqTBDfWYc3VtmBMGsPdYchfbo/DkLWygRJmKujkSfjGzlbJ09LeuS9R5Cwtkum8n5KjHn82I2ZyaWwMpmCU1Q9VWmQpDTyRlLTXTS5IT8mK1mCa7n0jS/IFNXRaTdTT2DzK1scVJJbyAsxdBJmhmZWtgcytbKipFPxsCJj6CS6haZX0CmV7Y7SQlU4RXVtmEZ1rLMC6E+Z6DYltPolHnYxsqtq48ku3dq9kbxB6s5Bco/wAjjyI2PkubKNav1eydZkVryYlUSSXJL1Z+Qz5O/wC9ldKbYk1+ydbkVtdF7KwnsUPXZSa6GS5HdkWu9VjpAlXqsMxSuSINTBrMvrewOZf7s6Tb1WwOZdq2PrErpiDnMvrewSZd6dpV17CJVb2NVkF8z47u2YQ8ttmBPRnwf//Z'
</script>
