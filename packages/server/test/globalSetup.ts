import { afterEntireTestRun, beforeEntireTestRun } from '@/test/hooks'

export async function setup() {
  await beforeEntireTestRun()
}

export async function teardown() {
  await afterEntireTestRun()
}
