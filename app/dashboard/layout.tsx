import { SidebarWrapper } from '@/components/layout/SiebarWrapper'
import { MobileNav } from '@/components/layout/MobileNav'
import { AuthGuard } from '@/components/AuthGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="layout">
        <SidebarWrapper />
        <div className="layout-main">
          {children}
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  )
}