# 🐞 BUG: BE tính 6 đợt thanh toán sai nghiệp vụ (cộng PBT vào base)

**Severity:** 🔴 Critical — Pháp lý / tài chính
**Reporter:** FE Team
**Phát hiện:** 11/08/2026
**Trạng thái:** CĐT gán căn B-408 (1.12 tỷ) → lịch 6 đợt = 1.142.400.000 VNĐ

---

## 1. Tóm tắt

BE trả `sum(amounts-toàn-bộ-đợt) = 1.142.400.000 VNĐ` cho căn B-408 có **giá bán 1.120.000.000 VNĐ**.

Con số 1.142 tỷ là **đúng tổng tiền người mua phải trả** (giá căn 1.12 tỷ + 2% phí bảo trì 22.4 triệu theo Luật Nhà ở).

**NHƯNG** cách BE phân bổ tiền vào 6 đợt đang **sai nghiệp vụ**: cộng 2% PBT vào `basePrice` rồi áp % cho 6 đợt, thay vì chỉ áp % lên `basePrice` và **cộng riêng PBT vào đợt 5**.

## 2. Nghiệp vụ chuẩn (theo PAY.MD + Luật Nhà ở VN)

| Đợt | % | Trigger | Cách tính |
|---|---|---|---|
| 1 | 10% | Cọc / cấp nhà | 10% × **giá căn** |
| 2 | 20% | Sau ký HĐ | 20% × **giá căn** |
| 3 | 20% | Xây thô | 20% × **giá căn** |
| 4 | 20% | Cất nóc | 20% × **giá căn** |
| **5** | **25% + 2% PBT** | Bàn giao | 25% × **giá căn** + 2% × **giá căn** |
| 6 | 5% (dư) | Sổ hồng | 5% × **giá căn** |

Tổng: 10+20+20+25+5 = **80% giá căn** + 2% PBT = **82% giá căn** (đợt 5 + 1.02, đợt 1–4+6 = 1.0)

**Phí bảo trì 2%** (PBT) phải thu **kèm đợt 5**, nộp vào quỹ bảo trì chung cư theo Điều 109 Luật Nhà ở 2014. Đây là trách nhiệm CĐT chuyển cho BQT chung cư, **KHÔNG được tính chung vào giá bán** để tránh cạnh tranh không lành mạnh.

## 3. Dữ liệu thật (anh B-408)

```
Apartment: B-408
Diện tích: 58.7 m²
Giá bán (price): 1.120.000.000 VNĐ ← theo Apartment, đúng catalog
Phí bảo trì 2%: 22.400.000 VNĐ
Tổng thực phải thu: 1.142.400.000 VNĐ
```

## 4. So sánh BE trả vs. đúng nghiệp vụ

| Đợt | BE hiện tại (sai) | Đúng nghiệp vụ | Chênh |
|---|---|---|---|
| 1 | 114.240.000 (10% × 1.142.400.000) | **112.000.000** (10% × 1.12 tỷ) | +2.240.000 |
| 2 | 228.480.000 (20%) | **224.000.000** (20%) | +4.480.000 |
| 3 | 228.480.000 (20%) | **224.000.000** (20%) | +4.480.000 |
| 4 | 228.480.000 (20%) | **224.000.000** (20%) | +4.480.000 |
| 5 | 285.600.000 (25% × 1.142.400.000) | **302.400.000** (25% + 2% PBT × 1.12 tỷ) | -16.800.000 |
| 6 | 57.120.000 (5%) | **56.000.000** (5%) | +1.120.000 |
| **Tổng** | **1.142.400.000** | **1.142.400.000** | **0** ✓ |

**→ Tổng đúng, cách phân bổ sai.**

## 5. Hệ quả pháp lý

1. **Người mua đợt 1–4, 6 trả dư** 22.4 triệu (không được phân loại PBT → vi phạm thông tư).
2. **Đợt 5 không đủ 2% PBT** → CĐT phải bù 16.8 triệu (22.4 − 16.8 = 5.6 triệu đợt 5 thiếu thật so với 25% × 1.12 + 2%).
3. **VNPay/PBT không ghi thuế VAT** → kế toán + thuế TNCN không khớp hóa đơn.
4. **Người mua sổ hồng trả thừa** 1.12 triệu ở đợt 6 → audit.

## 6. Nguyên nhân gốc (code review)

```csharp
// ❌ Code hiện tại (đoán)
var basePrice = apartment.Price * 1.02m; // ← nhân nhầm 2% PBT vào base
var phases = new[]
{
    new Phase { Ordinal = 1, Amount = basePrice * 0.10m, ... },
    new Phase { Ordinal = 2, Amount = basePrice * 0.20m, ... },
    ...
    new Phase { Ordinal = 5, Amount = basePrice * 0.25m, ... }, // ← không cộng PBT riêng
    new Phase { Ordinal = 6, Amount = basePrice * 0.05m, ... },
};
```

```csharp
// ✅ Code đúng
var basePrice = apartment.Price; // 1.120.000.000
var pbt = apartment.Price * 0.02m; // 22.400.000
var phases = new[]
{
    new Phase { Ordinal = 1, Amount = basePrice * 0.10m, ... },                        // 112M
    new Phase { Ordinal = 2, Amount = basePrice * 0.20m, ... },                        // 224M
    new Phase { Ordinal = 3, Amount = basePrice * 0.20m, ... },                        // 224M
    new Phase { Ordinal = 4, Amount = basePrice * 0.20m, ... },                        // 224M
    new Phase { Ordinal = 5, Amount = basePrice * 0.25m + pbt, IsPBT = true, ... },    // 280M + 22.4M = 302.4M
    new Phase { Ordinal = 6, Amount = basePrice * 0.05m, ... },                        // 56M
};
```

## 7. Đề xuất fix

### Backend
1. **Sửa hàm `GenerateInstallments(applicationId, apartmentId)`**:
   - `basePrice = apartment.Price` (KHÔNG nhân 1.02)
   - `pbtAmount = apartment.Price * 0.02m` (chỉ tính 1 lần, lưu ở đợt 5)
   - 6 đợt theo % × basePrice
   - Đợt 5 `Amount = basePrice × 0.25m + pbtAmount; IsPBT = true`

2. **Migration `/api/Payment/installments/{id}` cần đánh dấu đợt 5 trả PBT** (field `IsPBT` hoặc `MaintenanceFee`):
   - FE phải phân biệt để xuất hóa đơn đúng từng diện VAT/PBT
   - Kế toán BQT chung cư chỉ lấy đúng 22.4M còn 280M là doanh thu CĐT

3. **Job re-generate** đối với hồ sơ đã sinh sai (cần báo CĐT trước khi thu đợt 1).

### Frontend (tạm thời)
- Hiển thị 2 ô: "Giá căn" (1.12 tỷ, từ Apartment) và "Tổng phải trả" (1.142.400.000 từ installment).
- Hiển thị đợt 5 với breakdown "Gồm 280M bàn giao + 22.4M PBT".
- Cảnh báo khi `sum(amounts) ≠ apartment.Price × 1.02` (BE chưa fix).

## 8. Test case

| ID | Apartment | Price | Expected Đợt 1 | Expected Tổng |
|---|---|---|---|---|
| 1 | B-408 (58.7m²) | 1.120.000.000 | 112.000.000 | 1.142.400.000 |
| 2 | C-501 (larger) | 1.280.000.000 | 128.000.000 | 1.305.600.000 |
| 3 | Edge: 0% PBT | 1.000.000.000 | 100.000.000 | 1.000.000.000 (không có PBT) |

(Edge case: studio/căn hộ thương mại không thu PBT → cần config theo dự án.)

## 9. Tài liệu tham khảo

- PAY.MD (định nghĩa 6 đợt, tỉ lệ PBT)
- Điều 109 Luật Nhà ở 2014 (quy định 2% PBT)
- Thông tư 02/2016/TT-BXD (hướng dẫn quản lý quỹ bảo trì)
- Screenshot từ FE: `/contract-detail` của hồ sơ B-408 (1.142.400.000)

## 10. Owner / Deadline

- **Owner đề xuất:** Backend team (Phòng Core/Billing)
- **Test owner:** QA (anh Hùng)
- **Deadline đề xuất:** 12/08/2026 (24h vì ảnh hưởng tiền người mua)
- **Pilot:** Căn B-408 trước khi rollout toàn bộ

---

**Reply:**
- @FE — Mai sẽ ship UI breakdown PBT trước khi BE fix.
- @BE — Phản hồi sau khi review code `GenerateInstallments`.
