1. Tổng quan
Khái niệm	Là gì
PaymentInstallment	Khoản phải thu theo đợt (LOCKED/PENDING/PAID/OVERDUE/CANCELLED)
Payment	Giao dịch VNPay (Pending/Paid/Success/Failed/Cancelled)
PrincipleAgreement + ký HĐ	PDF HĐ + POST /api/contract-sign/{id}/sign
Luồng chuẩn hiện tại:
APPROVED / APPROVED_BY_TIMEOUT
  → CĐT chốt (CLOSE_AND_SIGN / ưu tiên / trúng bốc thăm)
  → CONTRACT_PENDING (+ HĐ; cần có căn trước khi ký)
  → gán căn → sinh 6 đợt; Đợt 1 = PENDING
  → người dân ký → CONTRACT_SIGNED (+ unlock Đợt 2)
  → TT Đợt 1 (cọc) trong 168h từ SignedAt
  → Đợt 3–6: CĐT unlock-phase theo tiến độ
  → tất cả PAID → FULLY_PAID

2. Status hồ sơ (exact)
DRAFT, SUBMITTED, REVIEWING, NEED_MORE_DOCUMENTS, PENDING_SXD_REVIEW, APPROVED, APPROVED_BY_TIMEOUT, REJECTED, CANCELED, EXPIRED, DEPOSIT_PENDING, DEPOSIT_PAID, INSTALLMENT_IN_PROGRESS, FULLY_PAID, CONTRACT_SIGNED, CONTRACT_PENDING, LOTTERY_LOST
Installment: LOCKED | PENDING | PAID | OVERDUE | CANCELLED

3. 6 đợt thanh toán
Đợt	%	Trigger	Ý nghĩa
Đợt 1	10%	ON_LOTTERY_WON	Cọc / cấp nhà
Đợt 2	20%	ON_CONTRACT_SIGNED	Sau ký HĐ
Đợt 3	20%	CONSTRUCTION_ROUGH_FLOOR	Xây thô
Đợt 4	20%	ROOFING_COMPLETED	Cất nóc
Đợt 5	25% + 2% PBT	HANDOVER	Bàn giao
Đợt 6	5% (dư)	RED_BOOK_ISSUED	Sổ hồng
Unlock: Đợt 1 PENDING → ký HĐ unlock Đợt 2 → CĐT unlock 3–6 (đợt trước phải PAID).