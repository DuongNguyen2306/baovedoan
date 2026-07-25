import { useEffect, useMemo, useState } from 'react'
import { FormField } from '@/components/ui/label'
import { Input, Select } from '@/components/ui/input'
import {
  ensureHcmLocationsLoaded,
  HCM_PROVINCE,
} from '@/lib/vietnam-locations'

interface LocationFieldsProps {
  province: string
  district: string
  onProvinceChange: (value: string) => void
  onDistrictChange: (value: string) => void
  addressDefaultValue?: string
  addressKey?: string
}

/**
 * Khóa HCM + chọn Phường/Xã từ API v2.
 * `district` prop dùng để lưu tên phường/xã (tương thích form cũ).
 */
export function LocationFields({
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  addressDefaultValue,
  addressKey,
}: LocationFieldsProps) {
  const [wards, setWards] = useState<string[]>([])

  useEffect(() => {
    // Ép province = HCM
    if (province !== HCM_PROVINCE) onProvinceChange(HCM_PROVINCE)
    void ensureHcmLocationsLoaded()
      .then(setWards)
      .catch(() => setWards([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ mount một lần
  }, [])

  const wardOptions = useMemo(() => {
    if (district && !wards.includes(district)) return [district, ...wards]
    return wards
  }, [district, wards])

  return (
    <>
      <FormField label="Tỉnh/Thành" htmlFor="province">
        <Select
          id="province"
          name="province"
          required
          value={HCM_PROVINCE}
          disabled
          onChange={() => onProvinceChange(HCM_PROVINCE)}
        >
          <option value={HCM_PROVINCE}>{HCM_PROVINCE}</option>
        </Select>
      </FormField>

      <FormField label="Phường/Xã" htmlFor="district">
        <Select
          id="district"
          name="district"
          required
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
        >
          <option value="">{wards.length ? 'Chọn phường/xã' : 'Đang tải phường/xã...'}</option>
          {wardOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        {/* Đồng bộ CRUD: BE yêu cầu cả District + Ward — cùng tên phường v2 */}
        <input type="hidden" name="ward" value={district} />
      </FormField>

      <FormField label="Địa chỉ cụ thể" htmlFor="address">
        <Input
          id="address"
          name="address"
          required
          key={addressKey}
          defaultValue={addressDefaultValue}
          placeholder="Số nhà, tên đường..."
        />
      </FormField>
    </>
  )
}
