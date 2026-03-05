import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ClientsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Clients</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Client management will be available here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This section is under construction. Stay tuned!</p>
        </CardContent>
      </Card>
    </main>
  );
}
