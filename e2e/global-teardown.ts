async function globalTeardown() {
  if (process.env.PLAYWRIGHT_FORCE_EXIT === 'false') return

  setTimeout(() => {
    process.exit(0)
  }, 100)
}

export default globalTeardown
