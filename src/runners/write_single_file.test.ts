import { expect } from 'chai'
import * as fs from 'fs-extra'

import { WriteSingleFileRunner } from './write_single_file'

describe('WriteSingleFileRunner', () => {
  describe('run', () => {

    afterEach(async () => {
      await fs.remove('temp.ts')
      if (await fs.pathExists('db/migrate')) {
        for (const f of await fs.readdir('db/migrate')) {
          await fs.remove(`db/migrate/${f}`)
        }
        await fs.rmdir('db/migrate')
      }
    })

    it('writes a chunk to the specified file', async () => {
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

    it('writes header and footer', async () => {
      const instance = new WriteSingleFileRunner('temp.ts',
        'HEADER!!!\n', 'FOOTER!!!\n')

      await instance.init()

      await instance.close()

      const contents = (await fs.readFile('temp.ts')).toString()

      expect(contents).to.include('HEADER!!!')
      expect(contents).to.include('FOOTER!!!')
    })

    it('writes timestamped file if directory specified', async () => {
      await fs.mkdirp('db/migrate')
      const instance = new WriteSingleFileRunner('db/migrate',
        'HEADER!!!\n', 'FOOTER!!!\n')

      await instance.init()

      await instance.close()

      const files = await fs.readdir('db/migrate')
      expect(files.length).to.eq(1)
      expect(files[0]).to.match(/[0-9]+_generated_from_diff\.ts/)
    })
  })
})
