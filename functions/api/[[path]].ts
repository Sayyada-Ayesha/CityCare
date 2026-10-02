export async function onRequest(context: { request: Request; env?: Record<string, unknown>; params?: { path?: string[] } }) {
  const request = context.request
  const url = new URL(request.url)
  const pathname = url.pathname

  if (request.method === 'GET' && pathname === '/api/health') {
    return Response.json({ ok: true, app: 'CityCare AI', status: 'healthy' })
  }

  if (request.method === 'GET' && pathname === '/api/authorities') {
    return Response.json({
      authorities: [
        { id: 'authority-1', name: 'Municipal Services', category: 'Public Infrastructure', active: true },
        { id: 'authority-2', name: 'Waste Management', category: 'Garbage', active: true },
        { id: 'authority-3', name: 'Water & Sanitation', category: 'Water', active: true },
        { id: 'authority-4', name: 'Roads / Public Works', category: 'Road Damage', active: true },
        { id: 'authority-5', name: 'Drainage / Sanitation', category: 'Drainage', active: true },
      ],
    })
  }

  if (request.method === 'POST' && pathname === '/api/complaints') {
    const payload = await request.json().catch(() => ({}))
    if (!payload || typeof payload !== 'object') {
      return Response.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request.' } }, { status: 400 })
    }

    return Response.json({
      success: true,
      complaint: {
        id: 'complaint-demo-1',
        complaintNumber: 'CC-2026-000001',
        status: 'SUBMITTED',
        title: payload.title ?? 'Streetlight not functioning',
      },
    }, { status: 201 })
  }

  if (request.method === 'GET' && pathname.startsWith('/api/complaints/')) {
    const id = pathname.split('/').at(-1)
    return Response.json({
      id,
      complaintNumber: 'CC-2026-000001',
      status: 'SUBMITTED',
      category: 'Streetlight',
      title: 'Streetlight not functioning',
      citizenTokenHash: 'hashed',
    })
  }

  if (pathname.startsWith('/api/admin/')) {
    const adminPin = request.headers.get('X-Admin-Pin')
    const expectedPin = (context.env?.CITYCARE_ADMIN_PIN as string | undefined) ?? 'replace-with-your-own-secret'
    if (!adminPin || adminPin !== expectedPin) {
      return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Admin PIN required.' } }, { status: 401 })
    }

    if (request.method === 'GET' && pathname === '/api/admin/stats') {
      return Response.json({
        total: 1,
        submitted: 1,
        inReview: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
      })
    }

    if (request.method === 'GET' && pathname === '/api/admin/complaints') {
      return Response.json({ complaints: [{ id: 'complaint-demo-1', complaintNumber: 'CC-2026-000001', status: 'SUBMITTED', title: 'Streetlight not functioning' }] })
    }
  }

  return Response.json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }, { status: 404 })
}
