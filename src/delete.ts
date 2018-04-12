

export async function writeDelete(id: string, write: (chunk: string) => Promise<any>): Promise<string> {
  return `
  migration.deleteContentType('${id}')
`
}