/**
 * ARK TOOLS — Tool Skeleton Loader
 *
 * Esqueleto animado estandarizado para la carga lazy de herramientas.
 */

export function ToolSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-40 rounded-[8px] bg-line" />
          <div className="h-10 w-72 max-w-full rounded-[12px] bg-line" />
          <div className="h-4 w-96 max-w-full rounded-[8px] bg-line" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-[420px] rounded-card border border-line bg-surface-2" />
          <div className="h-[420px] rounded-card border border-line bg-surface-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-card border border-line bg-surface-2" />
          <div className="h-28 rounded-card border border-line bg-surface-2" />
          <div className="h-28 rounded-card border border-line bg-surface-2" />
          <div className="h-28 rounded-card border border-line bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

export default ToolSkeleton;
