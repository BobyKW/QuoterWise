import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QuoteForm } from '@/components/quote-form';

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
          <QuoteForm />
        </CardContent>
      </Card>
    </main>
  );
}
