import * as fs from 'fs-extra'
import * as path from 'path'
import { DirResult, dirSync } from 'tmp'
import { WriteSingleFileRunner } from '../write_single_file'

let tmpDirectory: DirResult
let instance: WriteSingleFileRunner

describe('WriteSingleFileRunner', () => {
  beforeEach(async () => {
    tmpDirectory = dirSync()
  })

  afterEach(async () => {
    if (tmpDirectory.removeCallback) {
      tmpDirectory.removeCallback()
    }

    if (fs.pathExistsSync(tmpDirectory.name)) {
      fs.readdirSync(tmpDirectory.name).forEach((file) => {
        fs.removeSync(path.join(tmpDirectory.name, file))
      })
    }
  })

  it('writes a chunk to the specified file', async () => {
    instance = new WriteSingleFileRunner(
      path.join(tmpDirectory.name, 'temp.ts'),
      'HEADER!!!',
      'FOOTER!!!',
    )

    await instance.init()
    await Promise.all(
      instance.run(['k1', 'k2'], (id, write, ctx) => {
        return write(`${id}: test`)
      }),
    )

    await instance.close()

    const contents = (fs.readFileSync(path.join(tmpDirectory.name, 'temp.ts'))).toString()

    expect(contents).toMatch(/k1: test/g)
    expect(contents).toMatch(/k2: test/g)
  })

  it('writes header and footer', async () => {
    instance = new WriteSingleFileRunner(
      path.join(tmpDirectory.name, 'temp.ts'),
      'HEADER!!!',
      'FOOTER!!!',
    )

    await instance.init()
    await instance.close()

    const contents = fs.readFileSync(path.join(tmpDirectory.name, 'temp.ts')).toString()

    expect(contents).toMatch(/HEADER!!!/)
    expect(contents).toMatch(/FOOTER!!!/)
  })

  it('writes timestamped file if directory specified', async () => {
    instance = new WriteSingleFileRunner(
      tmpDirectory.name,
      'HEADER!!!',
      'FOOTER!!!',
    )

    await instance.init()
    await instance.close()

    const files = fs.readdirSync(tmpDirectory.name)
    expect(files.length).toBe(1)
    expect(files[0]).toMatch(/[0-9]+_generated_from_diff\.ts/)
  })
})
