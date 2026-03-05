import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClientForm } from '@/components/client-form';

export default function NewClientPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">New Client</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Client</CardTitle>
          <CardDescription>Fill in the details to add a new client to your records.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </main>
  );
}
