import { ESLint } from 'eslint'

const budgetArg = process.argv.find((arg) => arg.startsWith('--budget='))
const budget = budgetArg ? Number(budgetArg.split('=')[1]) : 0

if (!Number.isInteger(budget) || budget < 0) {
  console.error('Use --budget=<numero inteiro maior ou igual a zero>.')
  process.exit(2)
}

try {
  var report = await new ESLint().lintFiles(['.'])
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Nao foi possivel executar o ESLint.')
  process.exit(2)
}

const files = report
  .map((file) => ({
    filePath: file.filePath,
    count: (file.messages || []).filter((message) => message.ruleId === '@typescript-eslint/no-explicit-any').length,
  }))
  .filter((file) => file.count > 0)
  .sort((a, b) => b.count - a.count)

const total = files.reduce((sum, file) => sum + file.count, 0)

console.log(`Any count: ${total}`)
for (const file of files.slice(0, 25)) {
  console.log(`${String(file.count).padStart(4, ' ')}  ${file.filePath}`)
}

if (total > budget) {
  console.error(`Any budget exceeded: ${total} > ${budget}`)
  process.exit(1)
}
