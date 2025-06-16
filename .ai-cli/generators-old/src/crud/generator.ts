import { Tree } from '@nx/devkit'
import { execSync } from 'child_process'

const sleep = (seconds = 1) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))
function run(command) {
  console.log(`Running command: ${command}`)
  execSync(command, { stdio: 'inherit' })
}

export default async function (
  host: Tree,
  { model, primaryField, plural }: { model: string; primaryField: string; plural: string },
) {
  run(`nx g @muzebook/tools:api-crud ${model} --plural ${plural} --primaryField ${primaryField}`)
  run(`pnpm prisma:apply`)

  console.log('Please restart the API, will continue in 10 seconds...')
  await sleep(10)

  run(`nx g @muzebook/tools:web-admin-crud ${model} --plural ${plural} --primaryField ${primaryField}`)
  run(`pnpm sdk`)

  run(`nx g @muzebook/tools:web-user-crud ${model} --plural ${plural} --primaryField ${primaryField}`)
  run(`pnpm sdk`)
}
