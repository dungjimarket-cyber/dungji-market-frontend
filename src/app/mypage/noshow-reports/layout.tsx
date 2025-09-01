import RequireAuth from '@/components/auth/RequireAuth';

export default function NoShowReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}