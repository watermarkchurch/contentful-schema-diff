import * as fs from 'fs-extra'
import * as _ from 'lodash'
import * as path from 'path'

import { IContext } from '.'
import { extendPrototypes, formatFile, wait } from '../utils'
extendPrototypes()
import { AsyncWrite, asyncWriter } from './async_writer'

interface IOptions {
  header: string,
  footer: string,
  extension: 'js' | 'ts'

  format: boolean
}

export class FilePerContentTypeRunner {
  public outDir: string

  public readonly options: Readonly<IOptions>

  public streams: Array<{ stream: fs.WriteStream, writer: AsyncWrite, fileName: string, context: IContext }> = []

  constructor(outDir: string, options?: Partial<IOptions>) {
    this.outDir = outDir

    this.options = Object.assign({
      header: '',
      footer: '',
      extension: 'js',
      format: true,
    }, options)

  }

  public async init(): Promise<void> {
    return
  }

  public run(
      keys: string[],
      run: (id: string, write: AsyncWrite, context: IContext) => Promise<void>): Array<Promise<void>> {
    return keys.map(async (id: string) => {
      const context: IContext = { operations: [] }
      const writer = this.makeWriter(id, context)

      await run(id, writer, context)
    })
  }

  public async close() {
    return Promise.all(this.streams.map(async (tuple) => {
      await tuple.writer(this.options.footer)
      tuple.stream.close()
      await wait(1)

      // rename if operations all the same type
      const uniqOps = _.uniq(tuple.context.operations)
      if (uniqOps.length == 1) {
        const newFilename = tuple.fileName.replace('generated_diff', uniqOps[0])
        await fs.move(tuple.fileName, newFilename)
        tuple.fileName = newFilename
      }

      if (this.options.format) {
        await formatFile(tuple.fileName)
      }
      return tuple.fileName
    }))
  }

  private makeWriter(id: string, context: IContext): AsyncWrite {
    let stream: fs.WriteStream
    let writer: AsyncWrite
    let fileName: string

    return async (chunk: string) => {
      // don't open the file stream until first write
      if (!stream) {
        const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14)
        fileName = path.join(this.outDir, `${timestamp}_generated_diff_${id.underscore()}.${this.options.extension}`)
        stream = fs.createWriteStream(fileName)
        writer = asyncWriter(stream)
        this.streams.push({ stream, writer, fileName, context })

        await writer(this.options.header)

        context.open = true
      }

      return writer(chunk)
    }
  }
}
