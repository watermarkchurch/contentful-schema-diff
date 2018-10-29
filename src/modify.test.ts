import test from 'ava'

import {writeModify} from './modify'
import { IContext } from './runners'
import {fakeContentType, fakeField} from './test-support'

const fromType = fakeContentType('menu',
  fakeField({
    id: 'name',
    name: 'Menu Name',
    required: true,
  }),
  fakeField({
    id: 'topButton',
    name: 'Top Button',
    type: 'Link',
    validations: [ { linkContentType: ['menuButton'], message: 'The Top Button must be a...' }],
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
          linkContentType: [
            'menu',
            'menuButton',
          ],
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
          linkContentType: [
            'menu',
          ],
          message: 'The Side Menu must be a Menu',
        },
      ],
      linkType: 'Entry',
  }),
)

const toType = fakeContentType('menu',
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
    validations: [
      { in: [0, 1, 2] },
    ],
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
        linkContentType: [
          'menuButton',
        ],
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
          linkContentType: [
            'menu',
            'menuButton',
          ],
          message: 'The items must be either buttons or drop-down menus',
        },
      ],
      linkType: 'Entry',
    },
  }),
)

test('writes content type without def', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /migration.editContentType\('menu'\)/)
})

test('sets varname on context', async (t) => {

  const chunks: string[] = []
  const context: IContext = {}

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), context)

  t.deepEqual(context.varname, 'menu')
})

test('dumps diff as comment', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /\-\s+type\: \"Symbol\"/)
  t.regex(written, /\+\s+type\: \"Text\"/)
})

test('writes created fields', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /menu.createField\('newField', { name: 'New Field',/)
})

test('moves newly created fields', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /menu.moveField\('newField'\)\s*.afterField\('movedField'\)/m)
})

test('writes deleted fields', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /menu.deleteField\('sideMenu'\)/)
})

test('writes moved fields', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /menu.moveField\('movedField'\)\s*.afterField\('name'\)/m)
})

test('writes change to top-level field details', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /menu.editField\('name'\)\s+.type\('Text'\)/)
  t.regex(written, /menu.editField\('items'\)\s+.disabled\(true\)/)
})

test('writes change to items', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('').replace(/\s+/g, '')
  t.true(written.includes(`
  .items({ type: 'Link',
validations:
  [ { range:
      { min: 1,
        max: 5 } },
    { linkContentType:
      [ 'menu',
        'menuButton' ],
      message: 'The items must be either buttons or drop-down menus' } ],
linkType: 'Entry' }`.replace(/\s+/g, '')))
})

test('writes change to moved field', async (t) => {

  const chunks: string[] = []

  await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /menu.editField\('movedField'\)\s+.required\(false\)/)
  t.regex(written, /\.validations\(\[\s*{\s*in:\s*\[\s*0,\s*1,\s*2\s*\]\s*}\s*\]\)/m)
})

test('properly moves field when new field inserted above', async (t) => {
  const from = fakeContentType('page',
    fakeField({
      id: 'metaDescription',
      name: 'Meta-Description',
      validations: [ { size: { max: 160 } } ],
    }),
  )

  const to = fakeContentType('page',
    fakeField({
      id: 'metaTitle',
      name: 'Meta-Title',
      validations: [ { regexp: { pattern: '^\w+$' }} ],
    }),
    fakeField({
      id: 'metaDescription',
      name: 'Meta-Description',
      validations: [ { size: { max: 160 } } ],
    }),
  )

  const chunks: string[] = []

  await writeModify(from, to, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /createField\('metaTitle'/)
  t.regex(written, /moveField\('metaTitle'/)
  t.notRegex(written, /editField\('metaDescription'/)

})

test('also picks up field changes when new field inserted above', async (t) => {
  const from = fakeContentType('page',
    fakeField({
      id: 'metaDescription',
      name: 'Meta-Description',
      validations: [ { size: { max: 160 } } ],
    }),
  )

  const to = fakeContentType('page',
    fakeField({
      id: 'metaTitle',
      name: 'Meta-Title',
      validations: [ { regexp: { pattern: '^\w+$' }} ],
    }),
    fakeField({
      id: 'metaDescription',
      name: 'Meta-Description',
      validations: [ { size: { max: 170 } } ],
    }),
  )

  const chunks: string[] = []

  await writeModify(from, to, async (chunk) => chunks.push(chunk), {})

  const written = chunks.join('')
  t.regex(written, /editField\('metaDescription'\)\s*\.validations\(\[\s*{\s*size:\s*{\s*max:\s*170\s*}\s*}\s*\]\)/m)
})
