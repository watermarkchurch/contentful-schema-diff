import {expect} from 'chai'

import {IContentType} from './model'
import {writeModify} from './modify'
import { IContext } from './runners'
import {fakeContentType, fakeField} from './test-support'
import * as utils from './utils'

describe('writeModify', () => {
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

  it('writes content type without def', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.include('migration.editContentType(\'menu\')')
  })

  it('sets varname on context', async () => {

    const chunks: string[] = []
    const context: IContext = {}

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), context)

    expect(context.varname).to.eq('menu')
  })

  it('dumps diff as comment', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.match(/\-\s+type\: \"Symbol\"/)
    expect(written).to.match(/\+\s+type\: \"Text\"/)
  })

  it('writes created fields', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.include('menu.createField(\'newField\', { name: \'New Field\',')
  })

  it('moves newly created fields', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.include('menu.moveField(\'newField\')\n        .afterField(\'movedField\')')
  })

  it('writes deleted fields', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.include('menu.deleteField(\'sideMenu\')')
  })

  it('writes moved fields', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.include('menu.moveField(\'movedField\')\n        .afterField(\'name\')')
  })

  it('writes change to top-level field details', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.match(/menu.editField\('name'\)\s+.type\('Text'\)/)
    expect(written).to.match(/menu.editField\('items'\)\s+.disabled\(true\)/)
  })

  it('writes change to items', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('').replace(/\s+/g, '')
    expect(written).to.include(`
    .items({ type: 'Link',
  validations:
    [ { range:
        { min: 1,
          max: 5 } },
      { linkContentType:
        [ 'menu',
          'menuButton' ],
        message: 'The items must be either buttons or drop-down menus' } ],
  linkType: 'Entry' }`.replace(/\s+/g, ''))
  })

  it('writes change to moved field', async () => {

    const chunks: string[] = []

    await writeModify(fromType, toType, async (chunk) => chunks.push(chunk), {})

    const written = chunks.join('')
    expect(written).to.match(/menu.editField\('movedField'\)\s+.required\(false\)/)
    expect(written.replace(/\s+/g, '')).to.include(`
  .validations([ { in: [0, 1, 2] } ])`.replace(/\s+/g, ''))
  })

})
