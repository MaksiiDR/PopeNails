export default function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-pn-line bg-pn-paper flex items-stretch overflow-hidden">
      <div className="w-[76px] flex flex-col items-center justify-center py-4 border-r border-pn-line">
        <div className="skeleton h-5 w-12" />
        <div className="skeleton h-2.5 w-6 mt-2" />
      </div>
      <div className="flex-1 px-3.5 py-3.5">
        <div className="skeleton h-4 w-3/4 mb-2" />
        <div className="skeleton h-3 w-1/3" style={{ borderRadius: '999px' }} />
      </div>
      <div className="pr-3 py-3.5 flex items-center">
        <div className="skeleton h-4 w-16" />
      </div>
    </div>
  )
}
