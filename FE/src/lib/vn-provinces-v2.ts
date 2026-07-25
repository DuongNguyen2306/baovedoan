/**
 * Địa giới VN — provinces.open-api.vn API v2 (Tỉnh → Phường/Xã).
 * Product khóa Thành phố Hồ Chí Minh (code 79).
 */

export const HCM_PROVINCE_CODE = 79
export const HCM_PROVINCE = 'Thành phố Hồ Chí Minh'
export const HCM_PROVINCE_SHORT = 'Hồ Chí Minh'

const API_URL = `https://provinces.open-api.vn/api/v2/p/${HCM_PROVINCE_CODE}?depth=2`
const CACHE_KEY = 'rhs.hcm.wards.v2'

export interface VnWard {
  name: string
  code: number
  division_type?: string
  codename?: string
}

interface ProvinceV2Response {
  name: string
  code: number
  wards?: VnWard[]
}

let memoryCache: string[] | null = null
let inflight: Promise<string[]> | null = null

function readLocalCache(): string[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { wards?: string[]; at?: number }
    if (!Array.isArray(parsed.wards) || parsed.wards.length === 0) return null
    // Cache 7 ngày
    if (parsed.at && Date.now() - parsed.at > 7 * 24 * 60 * 60 * 1000) return null
    return parsed.wards
  } catch {
    return null
  }
}

function writeLocalCache(wards: string[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ wards, at: Date.now() }))
  } catch {
    /* ignore quota */
  }
}

function normalizeWards(data: ProvinceV2Response): string[] {
  const list = (data.wards ?? [])
    .map((w) => w.name?.trim())
    .filter((n): n is string => !!n)
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, 'vi'))
}

/** Lấy danh sách phường/xã HCM từ API v2 (có memory + localStorage cache). */
export async function fetchHcmWards(): Promise<string[]> {
  if (memoryCache?.length) return memoryCache
  const local = readLocalCache()
  if (local?.length) {
    memoryCache = local
    return local
  }
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ProvinceV2Response
      const wards = normalizeWards(data)
      if (wards.length === 0) throw new Error('Empty wards')
      memoryCache = wards
      writeLocalCache(wards)
      return wards
    } finally {
      inflight = null
    }
  })()

  return inflight
}

/** Sync helper — dùng cache nếu đã có, không thì []. */
export function getCachedHcmWards(): string[] {
  return memoryCache ?? readLocalCache() ?? []
}
