import { Heart, MapPin } from 'lucide-react'
import { navigate } from '@/hooks/useHashRoute'
import type { ProjectCard } from '@/lib/projects'

export function HouseCard({
  house,
  fav,
  onToggleFavorite,
}: {
  house: ProjectCard
  fav?: boolean
  onToggleFavorite?: () => void
}) {
  const goToDetail = () => {
    sessionStorage.setItem('projectId', house.id)
    navigate('project-detail')
  }

  const handleFavorite: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    onToggleFavorite?.()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToDetail()
        }
      }}
      className="glass-card overflow-hidden transition cursor-pointer hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="relative h-36 overflow-hidden">
        <img src={house.imageUrl} alt={house.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {onToggleFavorite && (
          <button
            type="button"
            className={`absolute right-3 top-3 rounded-full p-2 ${fav ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-400'}`}
            aria-label="Yêu thích"
            onClick={handleFavorite}
          >
            <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{house.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5" />
          {house.location}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-primary">{house.area}</span>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">{house.status}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="font-bold text-primary">{house.price}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{house.units}</span>
        </div>
      </div>
    </div>
  )
}