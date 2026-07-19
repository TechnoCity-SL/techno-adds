export default async function PostAdSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Ad submitted!</h1>
      <p className="text-muted-foreground text-sm">
        Your ad has been saved as a draft{id ? ` (id: ${id})` : ""} and is
        pending review before it goes live.
      </p>
    </div>
  );
}
