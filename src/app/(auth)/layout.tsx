export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Nested layout: do not re-declare <html>/<body>; rely on root layout for head and global styles
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
