import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewQuotePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">New Quote</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Quote</CardTitle>
          <CardDescription>Fill in the details to create a new quote.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Quote creation form will be here.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4">Cancel</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
