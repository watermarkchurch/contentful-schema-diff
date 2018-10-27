import { expect } from 'chai'
import * as fs from 'fs-extra'
import * as path from 'path'

import { FilePerContentTypeRunner } from './file_per_content_type'

describe('FilePerContentTypeRunner', () => {
  describe('run', () => {
    let instance: FilePerContentTypeRunner

    beforeEach(async () => {

      await fs.mkdirp('db/migrate')
      instance = new FilePerContentTypeRunner('db/migrate',
        'HEADER!!!\n', 'FOOTER!!!\n')

      await instance.init()
    })

    afterEach(async () => {
      if (await fs.pathExists('db/migrate')) {
        for (const f of await fs.readdir('db/migrate')) {
          await fs.remove(`db/migrate/${f}`)
        }
        await fs.rmdir('db/migrate')
      }
    })

    it('writes timestamped file for each content type', async () => {
      // act
      await Promise.all(
        instance.run(['ct-a', 'ct-b', 'ct-c'], (id, write, ctx) => {
          return write('test:' + id)
        }),
      )

      await instance.close()

      const files = await fs.readdir('db/migrate')
      expect(files.length).to.eq(3)
      expect(files[0]).to.match(/[0-9]+_generated_diff_ct-a\.ts/)
      expect(files[1]).to.match(/[0-9]+_generated_diff_ct-b\.ts/)
      expect(files[2]).to.match(/[0-9]+_generated_diff_ct-c\.ts/)
    })

    it('does not write file if nothing written', async () => {
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

      const files = await fs.readdir('db/migrate')
      expect(files.length).to.eq(1)
      expect(files[0]).to.match(/[0-9]+_generated_diff_ct-a\.ts/)
    })

    it('handles lots of lines', async () => {
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

      const files = await fs.readdir('db/migrate')
      const contents = (await fs.readFile(path.join('db/migrate', files[0]))).toString()
      const lines = contents.split('\n')
      expect(lines.length).to.eq(numLines + 3)
      for (let i = 0; i < numLines; i++) {
        expect(lines[i + 1]).to.eq(`const t${i} = '${loremIpsum}'`)
      }
    })
  })
})

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed' +
' non aliquam tortor. Vivamus sed libero at metus ornare pretium vitae id velit.' +
' Nullam bibendum fringilla lacus, sit amet varius ex tincidunt nec. Pellentesque' +
' dui magna, porta at semper eu, finibus semper urna. Proin lorem nunc, dignissim' +
' nec sagittis eget, viverra sit amet nisl. Sed bibendum tellus sit amet nunc' +
' molestie, nec viverra lorem sollicitudin. Quisque sed tortor elementum, semper' +
' eros nec, tempor dui. Aliquam dignissim sapien vitae odio sagittis feugiat.'
