import test from 'ava'

import { isDiff, isDiffItem, isDiffObj } from './diff'

const { diff } = require('json-diff')

test('isDiff handles simple diff', (t) => {
  const a = { test: 1 }
  const b = { test: 2 }
  const d = diff(a, b)

  // act
  t.true(isDiff(d))
})

test('isDiff returns false for empty diff', (t) => {
  const a = { test: 1 }
  const b = { test: 1 }
  const d = diff(a, b)

  // act
  t.false(isDiff(d))
})

test('isDiff returns false for non-diff', (t) => {
  // act
  t.false(isDiff({ test: 'data' }))
})

test('isDiff handles complex diff', (t) => {
  const d = [
    ['~', {
      type: { __old: 'Symbol', __new: 'Text' },
    }],
  ['+',
    {
      id: 'movedField',
      name: 'Moved Field',
      type: 'Number',
      localized: false,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    }],
  ['+',
    {
      id: 'newField',
      name: 'New Field',
      type: 'Symbol',
      localized: false,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    }],
  ['~',
    {
      validations:
        [['~',
          {
            message:
              {
                __old: 'The Top Button must be a ...',
                __new: 'A new message',
              },
          }]],
    }],
  ['-',
    {
      id: 'movedField',
      name: 'Moved Field',
      type: 'Number',
      localized: false,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    }],
  ['~',
    {
      disabled:
        {
          __old: false,
          __new: true,
        },
      items:
        {
          validations:
            [['-',
              {
                range:
                  {
                    min: 1,
                    max: 4,
                  },
              }],
            [' ']],
        },
    }],
  ['-',
    {
      id: 'sideMenu',
      name: 'Side Menu',
      type: 'Link',
      localized: false,
      required: false,
      validations:
        [{
          range:
            {
              min: 1,
              max: 5,
            },
        },
        {
          linkContentType: ['menu'],
          message: 'The Side Menu must be a Menu',
        }],
      disabled: false,
      omitted: false,
      linkType: 'Entry',
    }]]

  // act
  t.true(isDiff(d))
})

test('isDiffItem returns false for empty array', (t) => {
  const d = [] as any[]

  // act
  t.false(isDiffItem(d as any))
})

test('isDiffItem returns false for array with wrong length', (t) => {
  const d = ['-', 'a', 'B']

  // act
  t.false(isDiffItem(d as any))
})

test('isDiffItem returns false for array with wrong key', (t) => {
  const d = ['a', 'B']

  // act
  t.false(isDiffItem(d as any))
})

test('isDiffItem handles corner case', (t) => {
  const d = ['~',
    {
      disabled: {__old: false, __new: true},
      items: { validations: [['-', {range: {min: 1, max: 4}}], [' ']] },
    }]

  // act
  t.true(isDiffItem(d as any))
})

test('isDiffObj returns false for empty obj', (t) => {
  const d = {}

  // act
  t.false(isDiffObj(d))
})

test('isDiffObj returns false for non-obj', (t) => {
  const d = ['+', {test: 'data'}]

  // act
  t.false(isDiffObj(d))
})

test('isDiffObj returns true for simple diff', (t) => {
  const a = { test: 1 }
  const b = { test: 2 }
  const d = diff(a, b)

  // act
  t.true(isDiffObj(d))
})

test('isDiffObj returns true for diff with sub-diffs', (t) => {
  const d = { validations:
    [ [ '~',
        { message:
            { __old: 'The Top Button must be a...',
              __new: 'A new message' } } ] ] }

  // act
  t.true(isDiffObj(d))
})

test('isDiffObj returns true for complex diff', (t) => {
  const d = {disabled: {__old: false, __new: true}, items: {validations: [['-', {range: {min: 1, max: 4}}], [' ']]}}

  // act
  t.true(isDiffObj(d))
})
