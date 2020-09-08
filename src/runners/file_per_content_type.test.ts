import test from 'ava'
import * as fs from 'fs-extra'
import * as path from 'path'

import { FilePerContentTypeRunner } from './file_per_content_type'

let instance: FilePerContentTypeRunner

test.beforeEach(async () => {
  if (await fs.pathExists('/tmp/file_per_content_type_test')) {
    for (const f of await fs.readdir('/tmp/file_per_content_type_test')) {
      await fs.remove(`/tmp/file_per_content_type_test/${f}`)
    }
    await fs.rmdir('/tmp/file_per_content_type_test')
  }

  await fs.mkdirp('/tmp/file_per_content_type_test')
  instance = new FilePerContentTypeRunner('/tmp/file_per_content_type_test',
    { header: '// HEADER!!!\n', footer: '// FOOTER!!!\n', extension: 'ts', format: false })

  await instance.init()
})

test.serial('writes timestamped file for each content type', async (t) => {
  // act
  await Promise.all(
    instance.run(['ct-a', 'ct-b', 'ct-c'], (id, write, ctx) => {
      return write('test:' + id)
    }),
  )

  await instance.close()

  const files = await fs.readdir('/tmp/file_per_content_type_test')
  t.deepEqual(files.length, 3)
  t.regex(files[0], /[0-9]+_generated_diff_ct-a\.ts/)
  t.regex(files[1], /[0-9]+_generated_diff_ct-b\.ts/)
  t.regex(files[2], /[0-9]+_generated_diff_ct-c\.ts/)
})

test.serial('does not write file if nothing written', async (t) => {
  // act
  await Promise.all(
    instance.run(['ct-a', 'ct-b', 'ct-c'], (id, write, ctx) => {
      if (id == 'ct-a') {
        return write('test:' + id)
      }
      return Promise.resolve()
    }),
  )

  await instance.close()

  const files = await fs.readdir('/tmp/file_per_content_type_test')
  t.deepEqual(files.length, 1)
  t.regex(files[0], /[0-9]+_generated_diff_ct-a\.ts/)
})

test.serial('renames file when only create operations performed', async (t) => {
  // act
  await Promise.all(
    instance.run(['ct-a'], (id, write, ctx) => {
      ctx.operations.push('create')
      return write('test:' + id)
    }),
  )

  await instance.close()

  const files = await fs.readdir('/tmp/file_per_content_type_test')
  t.deepEqual(files.length, 1)
  t.regex(files[0], /[0-9]+_create_ct-a\.ts/)
})

test.serial('renames file when only modify operations performed', async (t) => {
  // act
  await Promise.all(
    instance.run(['ct-a'], (id, write, ctx) => {
      ctx.operations.push('modify')
      return write('test:' + id)
    }),
  )

  await instance.close()

  const files = await fs.readdir('/tmp/file_per_content_type_test')
  t.deepEqual(files.length, 1)
  t.regex(files[0], /[0-9]+_modify_ct-a\.ts/)
})

test.serial('renames file when only delete operations performed', async (t) => {
  // act
  await Promise.all(
    instance.run(['ct-a'], (id, write, ctx) => {
      ctx.operations.push('delete')
      return write('test:' + id)
    }),
  )

  await instance.close()

  const files = await fs.readdir('/tmp/file_per_content_type_test')
  t.deepEqual(files.length, 1)
  t.regex(files[0], /[0-9]+_delete_ct-a\.ts/)
})

test.serial('handles lots of lines', async (t) => {
  // disable formatting for this test
  await instance.close()
  instance = new FilePerContentTypeRunner('/tmp/file_per_content_type_test',
    { header: '// HEADER!!!\n', footer: '// FOOTER!!!\n', format: false })
  await instance.init()

  const numLines = 100
  // act
  await Promise.all(
    instance.run(['ct-a', 'ct-b', 'ct-c'], async (id, write, ctx) => {
      for (let i = 0; i < numLines; i++) {
        await write(`const t${i} = '${loremIpsum}'\n`)
      }
    }),
  )

  await instance.close()

  const files = await fs.readdir('/tmp/file_per_content_type_test')
  const contents = (await fs.readFile(path.join('/tmp/file_per_content_type_test', files[0]))).toString()
  const lines = contents.split('\n')
  t.deepEqual(lines.length, numLines + 3)
  for (let i = 0; i < numLines; i++) {
    const lineNum = i + 1
    t.deepEqual(lines[lineNum], `const t${i} = '${loremIpsum}'`)
  }
})

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed' +
' non aliquam tortor. Vivamus sed libero at metus ornare pretium vitae id velit.' +
' Nullam bibendum fringilla lacus, sit amet varius ex tincidunt nec. Pellentesque' +
' dui magna, porta at semper eu, finibus semper urna. Proin lorem nunc, dignissim' +
' nec sagittis eget, viverra sit amet nisl. Sed bibendum tellus sit amet nunc' +
' molestie, nec viverra lorem sollicitudin. Quisque sed tortor elementum, semper' +
' eros nec, tempor dui. Aliquam dignissim sapien vitae odio sagittis feugiat.'
