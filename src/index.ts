import { initApp } from './app'

async function main() {
  const port = process.env.PORT || 8443
  const app = await initApp()
  app.listen(port, () => {
    console.info(`mediasoup-test server listening at http://localhost:${port}`)
  })
}

main()
