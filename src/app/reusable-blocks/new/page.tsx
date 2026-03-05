import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReusableBlockForm } from '@/components/reusable-block-form';

export default function NewReusableBlockPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Nuevo Bloque Reutilizable</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Bloque</CardTitle>
          <CardDescription>Rellena los detalles para añadir un nuevo bloque reutilizable.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReusableBlockForm />
        </CardContent>
      </Card>
    </main>
  );
}
