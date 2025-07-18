import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route permissions
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': [], // All authenticated users
  '/users': ['ADMIN', 'SUPERADMIN'],
  '/schools': ['SUPERADMIN'],
  '/subjects': ['ADMIN', 'SUPERADMIN'],
  '/sections': ['ADMIN', 'PROFESSOR', 'SUPERADMIN'],
  '/enrollments': ['ADMIN', 'PROFESSOR', 'STUDENT', 'SUPERADMIN'],
  '/assignments': ['ADMIN', 'PROFESSOR', 'STUDENT', 'SUPERADMIN'],
  '/submissions': ['ADMIN', 'PROFESSOR', 'STUDENT', 'SUPERADMIN'],
  '/grades': ['ADMIN', 'PROFESSOR', 'SUPERADMIN'],
  '/reports': ['ADMIN', 'PROFESSOR', 'SUPERADMIN'],
};

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: { token?: { userData?: { role?: string } } } }) {
    const token = req.nextauth?.token;
    const pathname = req.nextUrl.pathname;

    // Allow access to auth pages for unauthenticated users
    if (pathname.startsWith('/auth/')) {
      return NextResponse.next();
    }

    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Check role-based access for protected routes
    const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(route => 
      pathname.startsWith(route)
    );

    if (matchedRoute) {
      const requiredRoles = ROUTE_PERMISSIONS[matchedRoute];
      const userRole = token.userData?.role;

      if (requiredRoles.length > 0 && userRole && !requiredRoles.includes(userRole)) {
        // Redirect to access denied page or dashboard
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};