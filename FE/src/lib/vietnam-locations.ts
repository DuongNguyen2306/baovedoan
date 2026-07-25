/**
 * Adapter địa giới — khóa HCM, nguồn provinces.open-api.vn v2.
 * Giữ API cũ (VIETNAM_PROVINCES / getDistrictsByProvince) để ít đụng form,
 * nhưng "districts" thực chất là danh sách phường/xã v2.
 */
import {
  fetchHcmWards,
  getCachedHcmWards,
  HCM_PROVINCE,
  HCM_PROVINCE_CODE,
  HCM_PROVINCE_SHORT,
} from '@/lib/vn-provinces-v2'

export { HCM_PROVINCE, HCM_PROVINCE_SHORT, fetchHcmWards, getCachedHcmWards }

export interface VietnamProvince {
  code: string
  name: string
  /** v2: danh sách phường/xã (không còn quận/huyện). */
  districts: string[]
}

/** Chỉ HCM — product scope. */
export const VIETNAM_PROVINCES: VietnamProvince[] = [
  {
    code: String(HCM_PROVINCE_CODE),
    name: HCM_PROVINCE,
    districts: getCachedHcmWards(),
  },
]

/** Prefetch wards vào cache (gọi khi app/search mount). */
export async function ensureHcmLocationsLoaded(): Promise<string[]> {
  const wards = await fetchHcmWards()
  VIETNAM_PROVINCES[0].districts = wards
  return wards
}

export function getDistrictsByProvince(provinceName: string): string[] {
  if (!provinceName || provinceName !== HCM_PROVINCE) {
    // Khóa HCM: tỉnh khác → không có lựa chọn
    if (provinceName === HCM_PROVINCE || !provinceName) {
      return getCachedHcmWards()
    }
    return []
  }
  const cached = getCachedHcmWards()
  if (cached.length) return cached
  return VIETNAM_PROVINCES[0]?.districts ?? []
}

/** Alias rõ nghĩa cho UI v2. */
export function getHcmWardsSync(): string[] {
  return getCachedHcmWards()
}

export function resolveProvinceName(value: string): string {
  if (!value) return HCM_PROVINCE
  const norm = (s: string) => s.toLowerCase().normalize('NFC').trim()
  const target = norm(value)
  if (target.includes('hồ chí minh') || target.includes('ho chi minh') || target === 'hcm' || target === 'tp.hcm') {
    return HCM_PROVINCE
  }
  return HCM_PROVINCE
}
