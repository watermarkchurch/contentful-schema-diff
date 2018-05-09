import { IContext } from './runners'

export function writeDelete(id: string, write: (chunk: string) => Promise<any>, context?: IContext): Promise<void> {
  return write(`
  migration.deleteContentType('${id}')
`)
}
