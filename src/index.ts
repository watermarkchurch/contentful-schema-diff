import * as yargs from 'yargs'

import Run from './main'

const argv = yargs
  .argv

Run({
  from: argv.from,
  to: argv.to
})
  .catch((err) => {
    console.error(err)
  })