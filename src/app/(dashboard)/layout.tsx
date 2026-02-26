// app/(dashboard)/layout.tsx
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Agregamos flex-col para móviles y md:flex-row para computadoras
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FBFBFA]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}