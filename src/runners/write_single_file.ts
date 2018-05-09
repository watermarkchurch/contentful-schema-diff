import {WriteStream} from 'fs'
import * as fs from 'fs-extra'
import * as path from 'path'

import { AsyncWrite, asyncWriter, IContext } from '.'
import { formatFile, wait } from '../utils'

export class WriteSingleFileRunner {
  public fileName: string
  public fileWriter: AsyncWrite
  public outputStream: WriteStream
  public header: string
  public footer: string

  constructor(outDir: string, header: string, footer: string) {
    const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14)
    this.fileName = path.join(outDir, `${timestamp}_generated_from_diff.ts`)
    this.outputStream = fs.createWriteStream(this.fileName)
    this.fileWriter = asyncWriter(this.outputStream)
    this.header = header
    this.footer = footer
  }

  public async init() {
    await this.fileWriter(this.header)
  }

  public run(
      keys: string[],
      doRun: (id: string, write: AsyncWrite, context: IContext) => Promise<void>): Array<Promise<void>> {
    return keys.map(async (id: string) => {
      const context: IContext = {
        open: true,
      }
      const chunks: string[] = []

      await doRun(id, (chunk: string) => Promise.resolve(chunks.push(chunk)), context)

      if (chunks.length > 0) {
        const header = `
  /************  ${id}  ******************/
`
        await this.fileWriter(header + chunks.join(''))
      }
    })
  }

  public async close() {
    await this.fileWriter(this.footer)
    this.outputStream.close()
    await wait(1)
    await formatFile(this.fileName)
    return [this.fileName]
  }
}
