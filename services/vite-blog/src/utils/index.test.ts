import { expect, test } from 'vitest'
import { toSnakeCase } from '.'

test('utils', () => {
  const test = toSnakeCase('HelloWorld')
  expect(test).toBe('hello_world')
})
