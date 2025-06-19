import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserRole } from '@/lib/rbac'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin&error=SessionRequired')
  }

  // Check role
  const userRole = await getUserRole(session.user.id)
  
  if (!userRole || (userRole !== 'admin' && userRole !== 'moderator')) {
    redirect('/dashboard?error=AccessDenied&reason=Admin+access+required')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-sm text-gray-600">Role: {userRole}</p>
          </div>
          <nav className="mt-8">
            <a href="/admin" className="block px-4 py-2 hover:bg-gray-100">
              Dashboard
            </a>
            {userRole === 'admin' && (
              <a href="/admin/users" className="block px-4 py-2 hover:bg-gray-100">
                Users
              </a>
            )}
            <a href="/admin/analytics" className="block px-4 py-2 hover:bg-gray-100">
              Analytics
            </a>
            <a href="/admin/content" className="block px-4 py-2 hover:bg-gray-100">
              Content
            </a>
            <a href="/dashboard" className="block px-4 py-2 hover:bg-gray-100 text-blue-600">
              ← Back to App
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}