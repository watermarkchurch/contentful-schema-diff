// tslint:disable no-console

import * as fs from 'fs-extra'
import * as path from 'path'
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
    description: 'The output directory (or file if "--one-file" was specified) in which to place the migration',
  })
  .option('js', {
    type: 'boolean',
    description: 'force writing javascript files'
  })
  .option('ts', {
    type: 'boolean',
    description: 'force writing typescript files',
  })
  .option('token', {
    alias: 'a',
    description: 'A Contentful management token to download content types from a space',
  })
  .option('one-file', {
    description: 'Write all the migrations in a single file',
  })
  .option('no-format', {
    alias: 'F',
    type: 'boolean',
    description: 'disables formatting the output file',
  })
  .argv

if (!argv.out) {
  if (fs.existsSync('./db/migrate/')) {
    argv.out = './db/migrate/'
  } else {
    argv.out = './'
  }
}
fs.mkdirpSync(argv.out)

let extension: 'js' | 'ts' | undefined
if (argv.ts) {
  extension = 'ts'
} else if (argv.js) {
  extension = 'js'
} else {
  // auto-detect extension
  const contents = fs.readdirSync(argv.out)
  if (contents.find((filename) => /\.ts/.test(filename))) {
    extension = 'ts'
  } else {
    extension = 'js'
  }
}

const contentTypes = argv.contentType && (Array.isArray(argv.contentType) ? argv.contentType : [argv.contentType])

Run({
  from: argv.from,
  out: argv.out,
  to: argv.to,
  managementToken: argv.token || process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  oneFile: argv.oneFile,
  format: !argv['no-format'],
  extension,
  contentTypes,
})
  .then((files) => {
    files.forEach((file) => console.log(file))
  })
  .catch((err) => {
    console.error(err)
  })
