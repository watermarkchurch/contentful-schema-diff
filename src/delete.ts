

export function writeDelete(id: string, write: (chunk: string) => Promise<any>): Promise<void> {
  return write(`
  migration.deleteContentType('${id}')
`)
}