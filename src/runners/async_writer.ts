import { Writable } from 'stream'

export type AsyncWrite = (chunk: string) => Promise<any>

export function asyncWriter(stream: Writable): (chunk: string) => Promise<any> {
  let draining = true
  let drainPromise: Promise<void> | null = null
  function doWrite(chunk: any) {
    return new Promise<void>((resolve, reject) => {
      if (draining) {
        let chunkToWrite = chunk

        if (chunkToWrite instanceof Object) {
          chunkToWrite = JSON.stringify(chunkToWrite)
        }

        draining = stream.write(chunkToWrite, (err: any) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      } else {
        if (!drainPromise) {
          drainPromise = new Promise<void>((dpResolve) => {
            stream.once('drain', () => {
              drainPromise = null
              draining = true
              dpResolve()
            })
          })
        }

        // await recursive
        drainPromise.then(
          () =>
            doWrite(chunk)
              .then(resolve)
              .catch(reject),
          (err) => reject(err),
        )
      }
    })
  }

  return doWrite
}
