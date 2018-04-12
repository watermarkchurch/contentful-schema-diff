import * as util from 'util'
import { IContentType } from './model';
import { Writable } from 'stream';

declare global {
  interface String {
    camelCase(): string
    underscore(): string
  }
  
  interface Object {
    dump(): string
  }
}

Object.prototype.dump = function(this: any): string {
  return util.inspect(this, {
    depth: null,
    maxArrayLength: null,
    breakLength: 0
  })
}

String.prototype.camelCase = function(this: string) { 
  return this.toLowerCase()
    .replace(/-(.)/g, (match, group1) =>
      group1.toUpperCase()
    );
}

String.prototype.underscore = function(this: string) {
	return this.replace(/([A-Z])/g, (m: string) => "_" + m.toLowerCase())
};

export function asyncWriter(stream: Writable): (chunk: string) => Promise<any> {
  let draining = true
  function doWrite(chunk: any) {
    return new Promise<void>((resolve, reject) => {
      if (draining) {
        draining = stream.write(chunk, (err: any) => {
          if(err) {
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

export function indexById(types: IContentType[]): { [id: string]: IContentType } {
  const ret: any = {}
  types.forEach(type => {
    ret[type.sys.id] = type
  })
  return ret
}