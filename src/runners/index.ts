import { Writable } from "stream";

export type AsyncWrite = (chunk: string) => Promise<any>

export function asyncWriter(stream: Writable): (chunk: string) => Promise<any> {
  let draining = true
  function doWrite(chunk: any) {
    return new Promise<void>((resolve, reject) => {
      if (draining) {
        draining = stream.write(chunk, (err: any) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      } else {
        stream.once('drain', () => {
          // await recursive
          doWrite(chunk)
            .then(resolve)
            .catch(reject)
        })
      }
    })
  }

  return doWrite
}

export interface IContext {
  open?: boolean,

  [key: string]: any
}