const PORT = parseInt(process.env.PORT || '3000', 10)

Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url)
    let path = url.pathname
    if (path === '/') path = '/index.html'

    const file = Bun.file('./dist' + path)
    if (await file.exists()) {
      return new Response(file)
    }

    return new Response('Not found', { status: 404 })
  },
})
