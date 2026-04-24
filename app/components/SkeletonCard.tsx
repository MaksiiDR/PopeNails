export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#F0D8D4' }}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-11 h-11 rounded-2xl flex-shrink-0" />
        <div className="flex-1">
          <div className="skeleton h-4 w-3/4 mb-2" />
          <div className="skeleton h-3 w-1/3" style={{ borderRadius: '999px' }} />
        </div>
        <div className="text-right">
          <div className="skeleton h-4 w-16 mb-2 ml-auto" />
          <div className="skeleton h-3 w-12 ml-auto" />
        </div>
      </div>
    </div>
  )
}
