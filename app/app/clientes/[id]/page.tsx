export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detalle Cliente</h1>
      <p className="text-muted-foreground">ID: {id} — Fase 3</p>
    </div>
  );
}
