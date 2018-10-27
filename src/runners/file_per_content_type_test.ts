import { expect } from 'chai'
import * as fs from 'fs-extra'

import { FilePerContentTypeRunner } from './file_per_content_type'

describe('FilePerContentTypeRunner', () => {
  describe('run', () => {

    afterEach(async () => {
      if (await fs.pathExists('db/migrate')) {
        for (const f of await fs.readdir('db/migrate')) {
          await fs.remove(`db/migrate/${f}`)
        }
        await fs.rmdir('db/migrate')
      }
    })

    it('writes timestamped file for each content type', async () => {
      await fs.mkdirp('db/migrate')
      const instance = new FilePerContentTypeRunner('db/migrate',
        'HEADER!!!\n', 'FOOTER!!!\n')

      await instance.init()

      await instance.run(['ct-a', 'ct-b', 'ct-c'], (id, write, ctx) => {
        return write('test:' + id)
      })

      await instance.close()

      const files = await fs.readdir('db/migrate')
      expect(files.length).to.eq(3)
      expect(files[0]).to.match(/[0-9]+_generated_from_diff\.ts/)
    })
  })
})
