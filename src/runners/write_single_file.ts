import {WriteStream} from 'fs'
import * as fs from 'fs-extra'
import * as path from 'path'

import { IContext } from '.'
import { formatFile, wait } from '../utils'
import { AsyncWrite, asyncWriter } from './async_writer'

interface IOptions {
  header: string,
  footer: string,
  extension: 'js' | 'ts'

  format: boolean
}

export class WriteSingleFileRunner {
  public fileName: string
  public fileWriter: AsyncWrite
  public outputStream: WriteStream

  public readonly options: Readonly<IOptions>

  constructor(out: string, options?: Partial<IOptions>) {
    this.fileName = out

    this.options = Object.assign({
      header: '',
      footer: '',
      extension: 'js',
      format: true,
    }, options)

    if (fs.existsSync(out) && fs.statSync(out).isDirectory()) {
      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14)
      this.fileName = path.join(out, `${timestamp}_generated_from_diff.${this.options.extension}`)
    }

    this.outputStream = fs.createWriteStream(this.fileName)
    this.fileWriter = asyncWriter(this.outputStream)
  }

  public async init() {
    await this.fileWriter(this.options.header)
  }

  public run(
      keys: string[],
      doRun: (id: string, write: AsyncWrite, context: IContext) => Promise<void>): Array<Promise<void>> {
    return keys.map(async (id: string) => {
      const context: IContext = {
        operations: [],
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
    await this.fileWriter(this.options.footer)
    this.outputStream.close()
    await wait(1)
    if (this.options.format) {
      await formatFile(this.fileName)
    }
    return [this.fileName]
  }
}
