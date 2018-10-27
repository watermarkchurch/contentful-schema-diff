import test from 'ava'
import { expect } from 'chai'
import * as fs from 'fs-extra'

import { WriteSingleFileRunner } from './write_single_file'

test.afterEach(async () => {
  await fs.remove('temp.ts')
  if (await fs.pathExists('/tmp/write_single_file_test')) {
    for (const f of await fs.readdir('/tmp/write_single_file_test')) {
      await fs.remove(`/tmp/write_single_file_test/${f}`)
    }
    await fs.rmdir('/tmp/write_single_file_test')
  }
})

test.serial('writes a chunk to the specified file', async () => {
  const instance = new WriteSingleFileRunner('temp.ts', '', '')
  await instance.init()
  await Promise.all(
    instance.run(['k1', 'k2'],
      (id, write, ctx) => {
        return write(`${id}: test`)
      },
    ),
  )

  await instance.close()

  const contents = (await fs.readFile('temp.ts')).toString()

  expect(contents).to.include('k1: test')
  expect(contents).to.include('k2: test')
})

test.serial('writes header and footer', async () => {
  const instance = new WriteSingleFileRunner('temp.ts',
    'HEADER!!!\n', 'FOOTER!!!\n')

  await instance.init()

  await instance.close()

  const contents = (await fs.readFile('temp.ts')).toString()

  expect(contents).to.include('HEADER!!!')
  expect(contents).to.include('FOOTER!!!')
})

test.serial('writes timestamped file if directory specified', async () => {
  await fs.mkdirp('/tmp/write_single_file_test')
  const instance = new WriteSingleFileRunner('/tmp/write_single_file_test',
    'HEADER!!!\n', 'FOOTER!!!\n')

  await instance.init()

  await instance.close()

  const files = await fs.readdir('/tmp/write_single_file_test')
  expect(files.length).to.eq(1)
  expect(files[0]).to.match(/[0-9]+_generated_from_diff\.ts/)
})
