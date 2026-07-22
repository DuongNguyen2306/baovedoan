export interface FeaturedHouse {
  id: string
  name: string
  location: string
  address: string
  price: string
  units: string
  color: string
  type: string
  area: string
  bedrooms: string
  floors: string
  developer: string
  status: string
  handover: string
  description: string
  paymentAmount: number
  imageUrl: string
}

export const FEATURED_HOUSES: FeaturedHouse[] = []

const FAV_KEY = 'favoriteHouses'

export function getFavorites(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')
    return Array.isArray(raw) ? (raw as string[]) : []
  } catch {
    return []
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id)
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites()
  const idx = favs.indexOf(id)
  if (idx >= 0) {
    favs.splice(idx, 1)
    localStorage.setItem(FAV_KEY, JSON.stringify(favs))
    return false
  }
  favs.push(id)
  localStorage.setItem(FAV_KEY, JSON.stringify(favs))
  return true
}
