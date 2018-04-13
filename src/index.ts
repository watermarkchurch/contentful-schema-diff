import * as yargs from 'yargs'
import * as fs from 'fs-extra'

import Run from './main'

const argv = yargs
  .usage("$0 --from <export file or space> --to <export file or space>")
  .option('from', {
    alias: 'f',
    demandOption: true,
    description: 'A contentful export file, or Contentful Space ID'
  })
  .option('to', {
    alias: 't',
    demandOption: true,
    description: 'A contentful export file, space ID, or environment within the "from" space'
  })
  .option('out', {
    alias: 'o',
    description: 'The output directory in which to place the migration'
  })
  .option('token', {
    alias: 'a',
    description: 'A Contentful management token to download content types from a space'
  })
  .option('one-file', {
    description: 'Write all the migrations in a single file'
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

Run({
  from: argv.from,
  outDir: argv.out,
  to: argv.to,
  managementToken: argv.token || process.env['CONTENTFUL_MANAGEMENT_TOKEN'],
  oneFile: argv.oneFile
})
  .catch((err) => {
    console.error(err)
  })