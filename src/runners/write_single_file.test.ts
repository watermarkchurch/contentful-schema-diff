import test from 'ava'
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

test.serial('writes a chunk to the specified file', async (t) => {
  const instance = new WriteSingleFileRunner('temp.ts')
  await instance.init()
  await Promise.all(
    instance.run(['k1', 'k2'],
      (id, write, ctx) => {
        return write(`const ${id}: string = test`)
      },
    ),
  )

  await instance.close()

  const contents = (await fs.readFile('temp.ts')).toString()

  t.regex(contents, /const k1: string = test/)
  t.regex(contents, /const k2: string = test/)
})

test.serial('writes header and footer', async (t) => {
  const instance = new WriteSingleFileRunner('temp.ts',
    { header: '// HEADER!!!\n', footer: '// FOOTER!!!\n' })

  await instance.init()

  await instance.close()

  const contents = (await fs.readFile('temp.ts')).toString()

  t.regex(contents, /HEADER!!!/)
  t.regex(contents, /FOOTER!!!/)
})

test.serial('writes timestamped file if directory specified', async (t) => {
  await fs.mkdirp('/tmp/write_single_file_test')
  const instance = new WriteSingleFileRunner('/tmp/write_single_file_test')

  await instance.init()

  await instance.close()

  const files = await fs.readdir('/tmp/write_single_file_test')
  t.deepEqual(files.length, 1)
  t.regex(files[0], /[0-9]+_generated_from_diff\.ts/)
})
