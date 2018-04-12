import * as yargs from 'yargs'
import * as fs from 'fs-extra'

import Run from './main'

const argv = yargs
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
  to: argv.to
})
  .catch((err) => {
    console.error(err)
  })