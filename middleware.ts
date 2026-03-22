import { NextResponse, type NextRequest } from 'next/server'

// Middleware temporarily disabled for auth debugging
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}