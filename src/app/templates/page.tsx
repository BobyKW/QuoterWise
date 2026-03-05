import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TemplatesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Templates</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>A powerful template management system is on its way.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This section is under construction. Soon you'll be able to create and manage quote templates to speed up your workflow!</p>
        </CardContent>
      </Card>
    </main>
  );
}
