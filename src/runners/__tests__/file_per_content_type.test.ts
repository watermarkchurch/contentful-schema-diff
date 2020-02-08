import * as fs from 'fs-extra'
import * as path from 'path'
import { DirResult, dirSync } from 'tmp'

import { FilePerContentTypeRunner } from '../file_per_content_type'

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed' +
  ' non aliquam tortor. Vivamus sed libero at metus ornare pretium vitae id velit.' +
  ' Nullam bibendum fringilla lacus, sit amet varius ex tincidunt nec. Pellentesque' +
  ' dui magna, porta at semper eu, finibus semper urna. Proin lorem nunc, dignissim' +
  ' nec sagittis eget, viverra sit amet nisl. Sed bibendum tellus sit amet nunc' +
  ' molestie, nec viverra lorem sollicitudin. Quisque sed tortor elementum, semper' +
  ' eros nec, tempor dui. Aliquam dignissim sapien vitae odio sagittis feugiat.'

let instance: FilePerContentTypeRunner
let tmpDirectory: DirResult

describe('FilePerContentType', () => {
  beforeAll(() => {
    tmpDirectory = dirSync()
  })

  afterAll(() => tmpDirectory.removeCallback && tmpDirectory.removeCallback())

  beforeEach(async () => {
    if (fs.existsSync(tmpDirectory.name)) {
      for (const f of fs.readdirSync(tmpDirectory.name)) {
        fs.removeSync(path.join(tmpDirectory.name, f))
      }
    }

    instance = new FilePerContentTypeRunner(
      tmpDirectory.name,
      '// HEADER!!!\n',
      '// FOOTER!!!\n',
    )

    await instance.init()
  })

  it('writes timestamped file for each content type', async () => {
    await Promise.all(
      instance.run(['ct-a', 'ct-b', 'ct-c'], (id, write) => {
        return write('test:' + id)
      }),
    )

    await instance.close()

    const files = fs.readdirSync(tmpDirectory.name)
    expect(files.length).toBe(3)
    expect(files[0]).toMatch(/[0-9]+_generated_diff_ct-a\.ts/)
    expect(files[1]).toMatch(/[0-9]+_generated_diff_ct-b\.ts/)
    expect(files[2]).toMatch(/[0-9]+_generated_diff_ct-c\.ts/)
  })

  it('does not write file if nothing written', async () => {
    await Promise.all(
      instance.run(['ct-a', 'ct-b', 'ct-c'], (id, write) => {
        if (id == 'ct-a') {
          return write('test:' + id)
        }

        return Promise.resolve()
      }),
    )

    await instance.close()

    const files = fs.readdirSync(tmpDirectory.name)
    expect(files.length).toBe(1)
    expect(files[0]).toMatch(/[0-9]+_generated_diff_ct-a\.ts/)
  })

  it('handles lots of lines', async () => {
    const numLines = 100

    await Promise.all(
      instance.run(['ct-a', 'ct-b', 'ct-c'], async (id, write) => {
        for (let i = 0; i < numLines; i++) {
          await write(`const t${i} = '${loremIpsum}'\n`)
        }
      }),
    )

    await instance.close()

    const [testFile] = fs.readdirSync(tmpDirectory.name)
    const contents = (fs.readFileSync(path.join(tmpDirectory.name, testFile))).toString()
    const lines = contents.split('\n')

    expect(lines.length).toBe(numLines + 3)

    for (let i = 0; i < numLines; i++) {
      const lineNum = i + 1
      expect(lines[lineNum]).toBe(`const t${i} = '${loremIpsum}'`)
    }
  })
})
