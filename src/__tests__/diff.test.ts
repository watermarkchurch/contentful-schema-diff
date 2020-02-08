import { isDiff, isDiffItem, isDiffObj } from '../diff'

const { diff } = require('json-diff')

describe('Diff', () => {
  describe('isDiff', () => {

    test('handles simple diff', () => {
      const a = { test: 1 }
      const b = { test: 2 }
      const d = diff(a, b)

      expect(isDiff(d)).toBe(true)
    })

    test('returns false for empty diff', () => {
      const a = { test: 1 }
      const b = { test: 1 }
      const d = diff(a, b)

      expect(isDiff(d)).toBe(false)
    })

    test('returns false for non-diff', () => {
      expect(isDiff({ test: 'data' })).toBe(false)
    })

    test('handles complex diff', () => {
      const d = [
        [
          '~',
          {
            type: { __old: 'Symbol', __new: 'Text' },
          },
        ],
        [
          '+',
          {
            id: 'movedField',
            name: 'Moved Field',
            type: 'Number',
            localized: false,
            required: true,
            validations: [],
            disabled: false,
            omitted: false,
          },
        ],
        [
          '+',
          {
            id: 'newField',
            name: 'New Field',
            type: 'Symbol',
            localized: false,
            required: true,
            validations: [],
            disabled: false,
            omitted: false,
          },
        ],
        [
          '~',
          {
            validations: [
              [
                '~',
                {
                  message: {
                    __old: 'The Top Button must be a ...',
                    __new: 'A new message',
                  },
                },
              ],
            ],
          },
        ],
        [
          '-',
          {
            id: 'movedField',
            name: 'Moved Field',
            type: 'Number',
            localized: false,
            required: true,
            validations: [],
            disabled: false,
            omitted: false,
          },
        ],
        [
          '~',
          {
            disabled: {
              __old: false,
              __new: true,
            },
            items: {
              validations: [
                [
                  '-',
                  {
                    range: {
                      min: 1,
                      max: 4,
                    },
                  },
                ],
                [' '],
              ],
            },
          },
        ],
        [
          '-',
          {
            id: 'sideMenu',
            name: 'Side Menu',
            type: 'Link',
            localized: false,
            required: false,
            validations: [
              {
                range: {
                  min: 1,
                  max: 5,
                },
              },
              {
                linkContentType: ['menu'],
                message: 'The Side Menu must be a Menu',
              },
            ],
            disabled: false,
            omitted: false,
            linkType: 'Entry',
          },
        ],
      ]

      expect(isDiff(d)).toBe(true)
    })
  })

  describe('isDiffItem', () => {

    test('returns false for empty array', () => {
      const d = [] as any[]

      // act
      expect(isDiffItem(d)).toBe(false)
    })

    test('returns false for array with wrong length', () => {
      const d = ['-', 'a', 'B']

      // act
      expect(isDiffItem(d as any)).toBe(false)
    })

    test('returns false for array with wrong key', () => {
      const d = ['a', 'B']

      expect(isDiffItem(d as any)).toBe(false)
    })

    test('handles corner case', () => {
      const d = [
        '~',
        {
          disabled: { __old: false, __new: true },
          items: { validations: [['-', { range: { min: 1, max: 4 } }], [' ']] },
        },
      ]

      expect(isDiffItem(d as any)).toBe(true)
    })
  })

  describe('isDiffObj', () => {

    test('returns false for empty obj', () => {
      const d = {}

      expect(isDiffObj(d)).toBe(false)
    })

    test('returns false for non-obj', () => {
      const d = ['+', { test: 'data' }]

      // act
      expect(isDiffObj(d as any)).toBe(false)
    })

    test('returns true for simple diff', () => {
      const a = { test: 1 }
      const b = { test: 2 }
      const d = diff(a, b)

      // act
      expect(isDiffObj(d)).toBe(true)
    })

    test('returns true for diff with sub-diffs', () => {
      const d = {
        validations: [
          [
            '~',
            {
              message: {
                __old: 'The Top Button must be a...',
                __new: 'A new message',
              },
            },
          ],
        ],
      }

      // act
      expect(isDiffObj(d)).toBe(true)
    })

    test('returns true for complex diff', () => {
      const d = {
        disabled: { __old: false, __new: true },
        items: { validations: [['-', { range: { min: 1, max: 4 } }], [' ']] },
      }

      // act
      expect(isDiffObj(d)).toBe(true)
    })
  })
})
