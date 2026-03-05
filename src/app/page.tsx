import { redirect } from 'next/navigation';

export default function Home() {
  // For now, we redirect to the dashboard.
  // In a real app, you'd check for authentication and redirect to /login if not authenticated.
  redirect('/dashboard');
}
