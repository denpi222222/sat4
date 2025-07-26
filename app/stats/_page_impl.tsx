import { redirect } from 'next/navigation';

export default function StatsRedirect() {
  redirect('/info');
  return null; // This line will never be reached, but satisfies TypeScript
}
