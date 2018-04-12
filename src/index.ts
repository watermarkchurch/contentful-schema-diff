import * as yargs from 'yargs'
import * as fs from 'fs-extra'

import Run from './main'

const argv = yargs
  .usage("$0 --from <export file> --to <export file>")
  .option('from', {
    alias: 'f',
    demandOption: true,
    description: 'A contentful export file from the space that needs to be migrated'
  })
  .option('to', {
    alias: 't',
    demandOption: true,
    description: 'A contentful export file from the space containing the newest versions of the content types'
  })
  .option('out', {
    alias: 'o',
    description: 'The output directory in which to place the migration'
  })
  .option('one-file', {
    description: 'Write all the migrations in a single file'
  })
  .argv

if (!argv.out) {
  if (fs.existsSync('./data/db/')) {
    argv.out = './data/db/'
  } else {
    argv.out = './'
  }
}
fs.mkdirp(argv.out)

Run({
  from: argv.from,
  outDir: argv.out,
  to: argv.to,
  oneFile: argv.oneFile
})
  .catch((err) => {
    console.error(err)
  })