import {WriteStream} from 'fs'
import * as fs from 'fs-extra'
import * as path from 'path'

import { AsyncWrite, asyncWriter, IContext } from '.'
import { formatFile, wait } from '../utils'

export class FilePerContentTypeRunner {
  public outDir: string
  public header: string
  public footer: string

  public streams: Array<{ stream: fs.WriteStream, writer: AsyncWrite, fileName: string }> = []

  constructor(outDir: string, header: string, footer: string) {
    this.outDir = outDir
    this.header = header
    this.footer = footer
  }

  public async init(): Promise<void> {
    return
  }

  public run(
      keys: string[],
      run: (id: string, write: AsyncWrite, context: IContext) => Promise<void>): Array<Promise<void>> {
    return keys.map(async (id: string) => {
      const context: IContext = {}
      const writer = this.makeWriter(id, context)

      await run(id, writer, context)
    })
  }

  public async close() {
    return Promise.all(this.streams.map(async (tuple) => {
      await tuple.writer(this.footer)
      tuple.stream.close()
      await wait(1)
      await formatFile(tuple.fileName)
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
        fileName = path.join(this.outDir, `${timestamp}_generated_diff_${id.underscore()}.ts`)
        stream = fs.createWriteStream(fileName)
        writer = asyncWriter(stream)
        this.streams.push({ stream, writer, fileName })

        await writer(this.header)

        context.open = true
      }

      writer(chunk)
    }
  }
}
