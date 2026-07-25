'use client';
import { Suspense } from 'react';
import { getConceptComponent } from './index';

interface ConceptDiagramProps {
  conceptId: string | undefined;
}

function SkeletonPlaceholder() {
  return (
    <div className="w-full h-[130px] rounded-lg bg-[#1e293b] border border-[#334155] animate-pulse flex items-center justify-center">
      <span className="text-slate-600 text-xs">Loading diagram…</span>
    </div>
  );
}

export default function ConceptDiagram({ conceptId }: ConceptDiagramProps) {
  if (!conceptId) return null;

  const ConceptComponent = getConceptComponent(conceptId);
  if (!ConceptComponent) return null;

  return (
    <div className="rounded-xl border border-[#334155] bg-[#0f172a] overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#334155] bg-[#1e293b]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#326CE5]" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Concept</span>
      </div>
      <Suspense fallback={<SkeletonPlaceholder />}>
        <div className="w-full">
          <ConceptComponent />
        </div>
      </Suspense>
    </div>
  );
}
