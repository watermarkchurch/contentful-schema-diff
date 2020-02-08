import { writeModify } from '../modify'
import { IContext } from '../runners'
import { fakeContentType, fakeField } from '../test-support'

const fromType = fakeContentType(
  'menu',
  fakeField({
    id: 'name',
    name: 'Menu Name',
    required: true,
  }),
  fakeField({
    id: 'topButton',
    name: 'Top Button',
    type: 'Link',
    validations: [
      {
        linkContentType: ['menuButton'],
        message: 'The Top Button must be a...',
      },
    ],
    linkType: 'Entry',
  }),
  fakeField({
    id: 'movedField',
    name: 'Moved Field',
    type: 'Number',
    required: true,
  }),
  fakeField({
    id: 'items',
    name: 'Items',
    type: 'Array',
    items: {
      type: 'Link',
      validations: [
        {
          range: { min: 1, max: 4 },
        },
        {
          linkContentType: ['menu', 'menuButton'],
          message: 'The items must be either buttons or drop-down menus',
        },
      ],
      linkType: 'Entry',
    },
  }),
  fakeField({
    id: 'sideMenu',
    name: 'Side Menu',
    type: 'Link',
    validations: [
      {
        linkContentType: ['menu'],
        message: 'The Side Menu must be a Menu',
      },
    ],
    linkType: 'Entry',
  }),
)

const toType = fakeContentType(
  'menu',
  fakeField({
    id: 'name',
    name: 'Menu Name',
    type: 'Text',
    required: true,
  }),
  fakeField({
    id: 'movedField',
    name: 'Moved Field',
    type: 'Number',
    validations: [{ in: [0, 1, 2] }],
  }),
  fakeField({
    id: 'newField',
    name: 'New Field',
    type: 'Symbol',
    required: true,
  }),
  fakeField({
    id: 'topButton',
    name: 'Top Button',
    type: 'Link',
    validations: [
      {
        linkContentType: ['menuButton'],
        message: 'A new message',
      },
    ],
    linkType: 'Entry',
  }),
  fakeField({
    id: 'items',
    name: 'Items',
    type: 'Array',
    disabled: true,
    items: {
      type: 'Link',
      validations: [
        {
          range: { min: 1, max: 5 },
        },
        {
          linkContentType: ['menu', 'menuButton'],
          message: 'The items must be either buttons or drop-down menus',
        },
      ],
      linkType: 'Entry',
    },
  }),
)

describe('Modify', () => {
  test('writes content type without def', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/migration.editContentType\('menu'\)/g)
  })

  test('sets varname on context', async () => {
    const chunks: string[] = []
    const context: IContext = {}

    await writeModify(
      fromType,
      toType,
      async (chunk) => chunks.push(chunk),
      context,
    )

    expect(context.varname).toBe('menu')
  })

  test('dumps diff as comment', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/\-\s + type\: \"Symbol\"/g)
    expect(written).toMatch(/\+\s + type\: \"Text\"/g)
  })

  test('writes created fields', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/menu.createField\('newField', {\s+name:\s+'New Field',/m)
  })

  test('moves newly created fields', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/menu.moveField\('newField'\)\s*.afterField\('movedField'\)/m)
  })

  test('writes deleted fields', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/menu.deleteField\('sideMenu'\)/g)
  })

  test('writes moved fields', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/menu.moveField\('movedField'\)\s+.afterField\('name'\)/m)
  })

  test('writes change to top-level field details', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/menu.editField\('name'\)\s+.type\('Text'\)/m)
    expect(written).toMatch(/menu.editField\('items'\)\s+.disabled\(true\)/m)
  })

  test('writes change to items', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('').replace(/\s+/g, '')
    expect(written).toContain(`
  .items({ type: 'Link',
validations:
  [ { range:
      { min: 1,
        max: 5 } },
    { linkContentType:
      [ 'menu',
        'menuButton' ],
      message: 'The items must be either buttons or drop-down menus' } ],
linkType: 'Entry' }`.replace(/\s+/g, ''),
    )
  })

  test('writes change to moved field', async () => {
    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/menu.editField\('movedField'\)\s+.required\(false\)/)
    expect(written).toMatch(/\.validations\(\[\s*{\s*in:\s*\[\s*0,\s*1,\s*2\s*\]\s*}\s*\]\)/m)
  })

  test('properly moves field when new field inserted above', async () => {
    const from = fakeContentType(
      'page',
      fakeField({
        id: 'metaDescription',
        name: 'Meta-Description',
        validations: [{ size: { max: 160 } }],
      }),
    )

    const to = fakeContentType(
      'page',
      fakeField({
        id: 'metaTitle',
        name: 'Meta-Title',
        validations: [{ regexp: { pattern: '^w+$' } }],
      }),
      fakeField({
        id: 'metaDescription',
        name: 'Meta-Description',
        validations: [{ size: { max: 160 } }],
      }),
    )

    const chunks: string[] = []

    await writeModify(from, to, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/createField\('metaTitle'/)
    expect(written).toMatch(/moveField\('metaTitle'/)
    expect(written).not.toMatch(/editField\('metaDescription'/)
  })

  test('also picks up field changes when new field inserted above', async () => {
    const from = fakeContentType(
      'page',
      fakeField({
        id: 'metaDescription',
        name: 'Meta-Description',
        validations: [{ size: { max: 160 } }],
      }),
    )

    const to = fakeContentType(
      'page',
      fakeField({
        id: 'metaTitle',
        name: 'Meta-Title',
        validations: [{ regexp: { pattern: '^w+$' } }],
      }),
      fakeField({
        id: 'metaDescription',
        name: 'Meta-Description',
        validations: [{ size: { max: 170 } }],
      }),
    )

    const chunks: string[] = []

    await writeModify(from, to, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).toMatch(/editField\('metaDescription'\)\s*\.validations\(\[\s*{\s*size:\s*{\s*max:\s*170\s*}\s*}\s*\]\)/m)
  })
})
