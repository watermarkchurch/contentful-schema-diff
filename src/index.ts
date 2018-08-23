// tslint:disable no-console

import * as fs from 'fs-extra'
import * as yargs from 'yargs'

import Run from './main'

const argv = yargs
  .usage('$0 --from <export file or space> --to <export file or space>')
  .option('from', {
    alias: 'f',
    demandOption: true,
    description: 'A contentful export file, or Contentful Space ID',
  })
  .option('to', {
    alias: 't',
    demandOption: true,
    description: 'A contentful export file, space ID, or environment within the "from" space',
  })
  .option('content-type', {
    alias: 'c',
    description: 'Generate a migration only for this content type.  Repeat to select multiple types.',
  })
  .option('out', {
    alias: 'o',
    description: 'The output directory in which to place the migration',
  })
  .option('token', {
    alias: 'a',
    description: 'A Contentful management token to download content types from a space',
  })
  .option('one-file', {
    description: 'Write all the migrations in a single file',
  })
  .argv

if (!argv.out) {
  if (fs.existsSync('./db/migrate/')) {
    argv.out = './db/migrate/'
  } else {
    argv.out = './'
  }
}
fs.mkdirp(argv.out)

const contentTypes = argv.contentType && (Array.isArray(argv.contentType) ? argv.contentType : [argv.contentType])

Run({
  from: argv.from,
  outDir: argv.out,
  to: argv.to,
  managementToken: argv.token || process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  oneFile: argv.oneFile,
  contentTypes,
})
  .then((files) => {
    files.forEach((file) => console.log(file))
  })
  .catch((err) => {
    console.error(err)
  })
