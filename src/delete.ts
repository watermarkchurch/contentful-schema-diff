import { IContext } from './runners'

export function writeDelete(id: string, write: (chunk: string) => Promise<any>, context?: IContext): Promise<void> {
  if (context) { context.operations.push('delete') }

  return write(`
  migration.deleteContentType('${id}')
`)
}
