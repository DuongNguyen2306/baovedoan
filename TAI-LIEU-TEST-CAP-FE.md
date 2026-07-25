# Tài liệu test CAP FE — RHS (đầy đủ)

> Dùng để tester nắm **toàn bộ** màn hình, trường, thuộc tính và điều kiện trên Frontend CAP.  
> Cập nhật: 24/07/2026  
> Base URL FE: `http://localhost:5173/#/{routeId}`  
> BE API (local thường dùng): `http://localhost:5000` hoặc theo `.env` / `VITE_API_BASE_URL`

---

## Mục lục

1. [Chuẩn bị môi trường & tài khoản](#1-chuẩn-bị-môi-trường--tài-khoản)
2. [Vai trò & phân quyền](#2-vai-trò--phân-quyền)
3. [Trạng thái dùng chung](#3-trạng-thái-dùng-chung)
4. [Public (không đăng nhập)](#4-public-không-đăng-nhập)
5. [Xác thực tài khoản](#5-xác-thực-tài-khoản)
6. [eKYC — Xác minh danh tính](#6-ekyc--xác-minh-danh-tính)
7. [Hồ sơ cá nhân & bảo mật](#7-hồ-sơ-cá-nhân--bảo-mật)
8. [Người dân — Dự án & Quan tâm](#8-người-dân--dự-án--quan-tâm)
9. [Người dân — Wizard nộp hồ sơ (5 bước)](#9-người-dân--wizard-nộp-hồ-sơ-5-bước)
10. [Người dân — Danh sách & chi tiết hồ sơ](#10-người-dân--danh-sách--chi-tiết-hồ-sơ)
11. [CĐT / Sở — Thẩm định hồ sơ](#11-cdt--sở--thẩm-định-hồ-sơ)
12. [Bốc thăm (Lottery)](#12-bốc-thăm-lottery)
13. [Hợp đồng & thanh toán](#13-hợp-đồng--thanh-toán)
14. [Hậu kiểm (Audit)](#14-hậu-kiểm-audit)
15. [Thông báo, báo cáo sự cố](#15-thông-báo-báo-cáo-sự-cố)
16. [Admin hệ thống](#16-admin-hệ-thống)
17. [Ma trận test ưu tiên](#17-ma-trận-test-ưu-tiên)
18. [Checklist tổng](#18-checklist-tổng)

---

## 1. Chuẩn bị môi trường & tài khoản

### 1.1 Chạy hệ thống

| Thành phần | Cách chạy / URL |
|------------|-----------------|
| Frontend CAP | `cd CAP/FE` → `npm run dev` → `http://localhost:5173` |
| Backend API | Chạy `RHS.API` (vd `http://localhost:5000`) |
| Hash route | Ví dụ login: `#/login` |

### 1.2 Tài khoản demo BE seed (khuyến nghị test)

Mật khẩu chung: **`123456`**

| Vai trò | Email | Ghi chú |
|---------|-------|---------|
| Chủ đầu tư (CĐT) | `cdt.demo@rhs.local` | Housing Developer |
| Sở Xây dựng (SXD) | `sxd.demo@rhs.local` | Department Of Construction |
| Dân chưa có hồ sơ | `dan.free@rhs.local` | Dùng để tạo hồ sơ mới |
| Dân DRAFT | `dan.draft@rhs.local` | |
| Dân SUBMITTED | `dan.submitted@rhs.local` | |
| Dân REVIEWING | `dan.reviewing@rhs.local` | |
| Dân NEED_MORE_DOCUMENTS | `dan.needdoc@rhs.local` | |
| Dân PENDING_SXD_REVIEW | `dan.pendingsxd@rhs.local` | |
| Dân APPROVED | `dan.approved@rhs.local` | |
| Dân APPROVED_BY_TIMEOUT | `dan.timeout@rhs.local` | |
| Dân chờ hợp đồng | `dan.contract@rhs.local` | |
| Dân đã ký HĐ | `dan.signed@rhs.local` | |
| Dân đã đặt cọc | `dan.deposit@rhs.local` | |
| Dân ưu tiên đã duyệt | `dan.priority@rhs.local` | |
| Dân trượt bốc thăm | `dan.lost@rhs.local` | |
| Dân bị từ chối | `dan.rejected@rhs.local` | |
| Dân hết hạn | `dan.expired@rhs.local` | |
| Dân thanh toán đủ | `dan.fullypaid@rhs.local` | |

> Lưu ý: nhiều account dân seed **đã có hồ sơ active** → không tạo hồ sơ mới được. Muốn test wizard từ đầu dùng `dan.free@rhs.local` hoặc đăng ký tài khoản mới + eKYC.

### 1.3 File test cần chuẩn bị

| Loại | Yêu cầu |
|------|---------|
| Ảnh CCCD | JPEG/PNG/WebP ≤ 5 MB |
| Selfie | JPEG/PNG/WebP ≤ 5 MB |
| Giấy tờ hồ sơ | **PDF** ≤ **10 MB**/file |
| Case âm | File không PDF, PDF > 10 MB, ảnh quá nhỏ |

### 1.4 VNPay sandbox (nếu test thanh toán)

- Ngân hàng: **NCB**
- Thẻ: `9704198526191432198`
- Hết hạn: `07/15`
- OTP: `123456`

---

## 2. Vai trò & phân quyền

| Vai trò FE (chuỗi đúng) | Home sau login | Menu chính |
|-------------------------|----------------|------------|
| `Applicant` | `#/home-user` | Quan tâm, Hồ sơ, Dự án, Hợp đồng, Thông báo, Tài khoản |
| `Housing Developer` | `#/home-developer` | Hồ sơ, Dự án, Bốc thăm, Live, Hợp đồng, Thông báo, Tài khoản |
| `Department Of Construction` | `#/home-sxd` | Hồ sơ, Dự án, Bốc thăm, Live, Hợp đồng, Hậu kiểm, Thông báo, Tài khoản |
| `System Administrator` | `#/home-admin` | Cán bộ, Log, Danh mục, Thông báo, Tài khoản (+ truy cập hầu hết route) |

**Quy tắc eKYC (quan trọng):**  
Chỉ **chặn lúc nộp / tạo hồ sơ**. Vẫn được: duyệt dự án, lưu Quan tâm, xem thông báo công khai.

---

## 3. Trạng thái dùng chung

### 3.1 Hồ sơ đăng ký (`APPLICATION_STATUS`)

| Mã | Nhãn UI |
|----|---------|
| `DRAFT` | Nháp |
| `SUBMITTED` | Đã nộp |
| `REVIEWING` | Đang thẩm định |
| `NEED_MORE_DOCUMENTS` | Cần bổ sung |
| `PENDING_SXD_REVIEW` | Chờ Sở Xây dựng |
| `APPROVED` | Đã phê duyệt |
| `APPROVED_BY_TIMEOUT` | Duyệt quá hạn |
| `CONTRACT_SIGNED` | Đã ký hợp đồng |
| `DEPOSIT_PAID` | Đã đặt cọc |
| `REJECTED` | Từ chối |
| `CANCELED` | Đã hủy |
| `EXPIRED` | Hết hạn |
| `LOTTERY_LOST` | Không trúng bốc thăm |

**Trạng thái “đóng”** (Applicant không rút/sửa được theo rule đóng):  
`APPROVED`, `DEPOSIT_PAID`, `REJECTED`, `CANCELED`, `EXPIRED`, `LOTTERY_LOST` (+ thường gồm luôn `APPROVED_BY_TIMEOUT`, `CONTRACT_SIGNED` tùy UI).

### 3.2 Dự án (tham khảo)

`PENDING` / `UPCOMING` / `OPEN` / `CLOSED` / `FULL` / `REJECTED` (+ trạng thái liên quan bốc thăm nếu có).

### 3.3 Phiên bốc thăm (UI + FSM)

UI lịch: `NOT_SCHEDULED` → `AWAITING_APPROVAL` / `SCHEDULED` → `APPROVED` → `RUNNING` → `FINISHED`  

FSM phiên live (session): `Scheduled` → `WaitingLobby` → `Live` → `Finished` → `Published`

### 3.4 Thực trạng nhà ở

| Mã | Nhãn |
|----|------|
| `NO_HOUSE` | Chưa có nhà ở |
| `SMALL_HOUSE` | Nhà diện tích dưới 15m² |

### 3.5 Hôn nhân

| Mã | Nhãn |
|----|------|
| `SINGLE` | Độc thân |
| `MARRIED` | Đã kết hôn |
| `DIVORCED` | Ly hôn |
| `WIDOWED` | Góa |

### 3.6 Quan hệ hộ

| Mã | Nhãn |
|----|------|
| `SPOUSE` | Vợ / Chồng |
| `CHILD` | Con |
| `PARENT` | Cha / Mẹ |
| `SIBLING` | Anh / Chị / Em |
| `GRANDPARENT` | Ông / Bà |
| `GRANDCHILD` | Cháu |
| `OTHER` | Khác |

---

## 4. Public (không đăng nhập)

| Route | Tên | Việc cần test |
|-------|-----|---------------|
| `#/landing` | Trang chủ công khai | Hero, CTA, dự án nổi bật, vào Tìm nhà / Đăng nhập |
| `#/tim-nha` | Tìm kiếm nhà ở | Lọc vị trí / giá / diện tích; mở chi tiết dự án |
| `#/thong-bao` | Thông báo công khai | List + lọc loại: OFFICIAL, LOTTERY, PRICE_ADJUSTMENT, GENERAL; xem chi tiết |
| `#/tra-cuu` | Tra cứu hồ sơ | Nhập mã hồ sơ; khách xem công khai; đã login xem chi tiết + timeline đầy đủ hơn |

---

## 5. Xác thực tài khoản

| Route | Trường / thuộc tính | Điều kiện |
|-------|---------------------|-----------|
| `#/login` | Email, mật khẩu | Đúng → redirect theo role home |
| `#/register` | Email, mật khẩu (≥8), họ tên, SĐT (tuỳ), role = Applicant | Sau đăng ký → OTP |
| `#/verify-otp` | OTP 6 số | Email từ phiên đăng ký; có resend |
| `#/resend-otp` | Email | Gửi lại mã |
| `#/forgot-password` | Email | Gửi hướng dẫn |
| `#/reset-password` | OTP, mật khẩu mới, xác nhận (≥8) | Khớp confirm |

**Case âm:** mật khẩu < 8; OTP sai; email chưa đăng ký.

---

## 6. eKYC — Xác minh danh tính

**Route:** `#/verify-identity` — **Applicant**

### Bước 1 — CCCD

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| Ảnh mặt trước CCCD | Có (OCR) hoặc bỏ qua nếu nhập tay | JPEG/PNG/WebP ≤ 5MB |
| Họ tên | Có | Từ OCR hoặc nhập tay |
| Số CCCD | Có | 9 hoặc 12 chữ số; check trùng hệ thống |
| Địa chỉ | Có | |
| Ngày sinh | Có (nếu form yêu cầu) | |

**Điều kiện:** OCR bị 429 → cooldown ~30 phút, có banner; có thể nhập tay nhưng vẫn cần ảnh cho face match.

### Bước 2 — Khuôn mặt

| Trường | Bắt buộc |
|--------|----------|
| Selfie / camera | Có |
| Face match | Phải `isMatch = true` |

### Sau lưu

- Profile được cập nhật (họ tên, CCCD, địa chỉ, DOB…).
- Cache verified = true → được vào tạo hồ sơ.
- Redirect về home người dùng.

---

## 7. Hồ sơ cá nhân & bảo mật

**Route:** `#/profile` (mọi role đăng nhập)

| Trường | Sửa được? | Nguồn |
|--------|-----------|-------|
| Email | Không | Tài khoản |
| Vai trò | Không | Role |
| Họ và tên | **Không** | eKYC |
| Số CCCD | **Không** | eKYC |
| Ngày sinh | **Không** | eKYC |
| Địa chỉ thường trú | **Không** | eKYC |
| Số điện thoại | **Có** | Người dùng cập nhật |
| Ảnh đại diện | **Có** | Upload / xoá |

**Điều kiện**
- Chưa eKYC → cảnh báo + link xác minh.
- Nút lưu chỉ cập nhật **SĐT** (BE cũng chặn đổi họ tên/CCCD khi đã có CCCD).
- Đổi mật khẩu (trên profile hoặc `#/change-password`): mật khẩu hiện tại, mới ≥8, confirm khớp, khác mật khẩu cũ.
- Xóa tài khoản: nhập mật khẩu xác nhận; lý do tuỳ chọn; không hoàn tác.

---

## 8. Người dân — Dự án & Quan tâm

### 8.1 Trang chủ người dùng `#/home-user`

- Duyệt dự án / showcase.
- Tim Quan tâm (không cần eKYC).

### 8.2 Quan tâm `#/quan-tam`

| Hành động | Điều kiện |
|-----------|-----------|
| Xem danh sách đã lưu | Đã login Applicant |
| Bỏ quan tâm | Toggle |
| Empty state | CTA về trang chủ |

**Không** yêu cầu eKYC.

### 8.3 Danh sách / chi tiết dự án

| Route | Ai dùng |
|-------|---------|
| `#/projects` | Applicant, CĐT, SXD |
| `#/project-detail` | Công khai xem + action theo role |

**Applicant trên chi tiết dự án**

| Hành động | Điều kiện |
|-----------|-----------|
| Quan tâm / bỏ quan tâm | Login; **không** cần eKYC |
| Nộp hồ sơ dự án này | eKYC bắt buộc (`ensureVerifiedForApplication`); dự án đang nhận hồ sơ (OPEN / REGISTRATION…); không có hồ sơ active khác |

**CĐT:** tạo/sửa dự án; lên lịch bốc thăm (ngày, địa điểm, số căn…).  
**SXD:** xem / phê duyệt lịch bốc thăm (từ luồng lottery).

### 8.4 Tạo dự án (CĐT) `#/create-project`

Trường tối thiểu thường gồm: tên (≥5), địa chỉ (tỉnh/huyện/xã/đường), giá min/max, diện tích min/max, số căn, trạng thái; lịch bốc thăm tuỳ chọn.

---

## 9. Người dân — Wizard nộp hồ sơ (5 bước)

**Route:** `#/create-application`  
**Role:** Applicant  
**Gate vào trang:** eKYC (silent). Thiếu → chuyển xác minh.  
**Gate active:** đang có hồ sơ active → khóa form, báo xem hồ sơ hiện có.

Thứ tự: **1 Cá nhân → 2 Hộ gia đình → 3 Đối tượng → 4 Tài liệu → 5 Rà soát**

---

### 9.1 Bước 1 — Cá nhân

| # | Trường | Bắt buộc | Sửa tay | Kiểu / ràng buộc | Hiện khi |
|---|--------|----------|---------|------------------|----------|
| 1 | Dự án nhà ở | Có | Có | Dropdown | Luôn |
| 2 | Họ và tên (eKYC) | Có | **Không** | Chỉ đọc | Luôn |
| 3 | Số CCCD (eKYC) | Có | **Không** | Chỉ đọc, 9/12 số | Luôn |
| 4 | Ngày sinh (eKYC) | — | **Không** | Chỉ đọc | Khi profile có DOB |
| 5 | Nghề nghiệp | Không | Có | ≤ 200 ký tự | Luôn |
| 6 | Nơi làm việc | Không | Có | ≤ 500 ký tự | Luôn |
| 7 | Nơi ở hiện tại | Có | Có | ≤ 500; có thể ≠ thường trú | Luôn |
| 8 | Thường trú (eKYC) | Có | **Không** | Chỉ đọc | Luôn |
| 9 | Thực trạng nhà ở | Có | Có | NO_HOUSE / SMALL_HOUSE | Luôn |
| 10 | Diện tích TB/người (m²) | Có nếu SMALL_HOUSE | Có | **> 0 và < 15** | Chỉ SMALL_HOUSE |
| 11 | Tình trạng hôn nhân | Có | Có | SINGLE/MARRIED/DIVORCED/WIDOWED | Luôn |
| 12 | Thu nhập hàng tháng | Có | Có | Số ≥ 0 | Luôn |
| 13 | Thu nhập vợ/chồng | Có nếu MARRIED | Có | Số ≥ 0 (**0 hợp lệ**) | Chỉ MARRIED |

#### Điều kiện bắt buộc test

| Tình huống | Kỳ vọng |
|------------|---------|
| Thiếu eKYC (không CCCD/họ tên/thường trú) | Cảnh báo + link xác minh; **Tiếp tục** disabled |
| Chọn `NO_HOUSE` | Ẩn ô diện tích; không bắt nhập; payload diện tích = null |
| Đổi sang `SMALL_HOUSE` | Hiện ô diện tích bắt buộc |
| Diện tích trống / ≤0 / ≥15 | Lỗi; không Next |
| Diện tích ví dụ 12.5 | OK |
| Đổi lại `NO_HOUSE` | Xoá diện tích đã nhập; không gửi nhầm |
| `SINGLE` / `DIVORCED` / `WIDOWED` | Ẩn thu nhập vợ/chồng; xoá giá trị cũ |
| `MARRIED` | Hiện + bắt thu nhập vợ/chồng; 0 được |
| Nghề / nơi làm việc trống | Vẫn Next được |

---

### 9.2 Bước 2 — Hộ gia đình

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| Số thành viên thêm (ngoài bạn) | Có (≥ 0) | `0` = không thêm ai → Next OK |

**Mỗi thành viên (khi size > 0)**

| Trường | Bắt buộc | Ràng buộc |
|--------|----------|-----------|
| Họ tên | Có | Không trống |
| Quan hệ | Có | 7 mã mục 3.6 |
| Ngày sinh | Không | |
| CCCD | Có | ≥ 9 ký tự; **không trùng** thành viên khác; **không trùng** CCCD chủ hộ |
| Ghi chú | Không | |

---

### 9.3 Bước 3 — Nhóm đối tượng

| Trường | Bắt buộc | Điều kiện |
|--------|----------|-----------|
| Nhóm đối tượng ưu tiên | Có | 1 trong 11 nhóm |
| Checkbox đã từng ký HĐ NOXH | Không | Mặc định tắt |
| Ghi chú lịch sử | Có **khi** tick checkbox | Disabled khi chưa tick; ≤ 500 ký tự |

#### 11 nhóm đối tượng (Đ76)

1. Người có công với cách mạng (`MERIT_PERSON`)  
2. Hộ nghèo nông thôn (`RURAL_POOR`)  
3. Hộ cận nghèo nông thôn (`RURAL_NEAR_POOR`)  
4. Hộ nghèo đô thị (`URBAN_POOR`)  
5. Hộ cận nghèo đô thị (`URBAN_NEAR_POOR`)  
6. Người thu nhập thấp tại đô thị (`LOW_INCOME_URBAN`)  
7. Công nhân, NLĐ tại DN/HTX/KCN (`WORKER`)  
8. Lực lượng vũ trang, cơ yếu (`MILITARY_PERSONNEL`)  
9. Cán bộ, công chức, viên chức (`CIVIL_SERVANT`)  
10. Đối tượng trả lại nhà công vụ (`PUBLIC_HOUSING_RETURN`)  
11. Bị thu hồi đất / giải tỏa nhà ở (`LAND_RECOVERY_AFFECTED`)

**Nút:** Lưu nháp · Tiếp tục (tạo/cập nhật nháp rồi sang bước 4).  
**Lưu ý:** Đổi nhóm → danh sách giấy tờ bước 4 đổi theo.

---

### 9.4 Bước 4 — Tài liệu PDF

**Chung**
- Chỉ PDF, ≤ 10 MB/file.  
- Phải có mã hồ sơ nháp.  
- Upload từng loại hoặc Upload tất cả.  
- Đủ mọi loại bắt buộc (uploaded) mới sang bước 5.  
- Chỉ tiếp tục khi status `DRAFT` hoặc `NEED_MORE_DOCUMENTS`.

#### Ma trận giấy tờ bắt buộc

| Nhóm | Giấy bắt buộc (tên UI) |
|------|------------------------|
| RURAL_POOR / RURAL_NEAR_POOR / URBAN_POOR / URBAN_NEAR_POOR | 1) Thực trạng nhà ở · 2) Hộ nghèo/cận nghèo |
| MERIT_PERSON | 1) Thực trạng nhà ở · 2) Người có công |
| LOW_INCOME_URBAN | 1) Thực trạng · 2) XN thu nhập thấp đô thị · 3) XN thu nhập |
| WORKER | 1) Thực trạng · 2) XN đang làm việc DN/HTX/KCN · 3) XN thu nhập |
| MILITARY_PERSONNEL | 1) Thực trạng · 2) XN phục vụ LLVT · 3) XN thu nhập |
| CIVIL_SERVANT | 1) Thực trạng · 2) XN cán bộ/CC/VC · 3) XN thu nhập |
| PUBLIC_HOUSING_RETURN | 1) Thực trạng · 2) VB trả lại nhà công vụ · 3) XN thu nhập |
| LAND_RECOVERY_AFFECTED | 1) Thực trạng · 2) QĐ thu hồi đất · 3) XN thu nhập |

#### Bảng mã ↔ nhãn giấy tờ

| Mã | Nhãn UI |
|----|---------|
| `HOUSING_CONDITION_PROOF` | Giấy chứng nhận thực trạng nhà ở |
| `POVERTY_HOUSEHOLD_CERTIFICATE` | Giấy chứng nhận hộ nghèo/cận nghèo |
| `MERIT_PERSON_CERTIFICATE` | Giấy xác nhận người có công với cách mạng |
| `LOW_INCOME_CERTIFICATE` | Giấy xác nhận thu nhập thấp tại đô thị |
| `EMPLOYMENT_CERTIFICATE` | Giấy xác nhận đang làm việc tại DN/HTX/KCN |
| `MILITARY_SERVICE_CERTIFICATE` | Giấy xác nhận phục vụ lực lượng vũ trang/cơ yếu |
| `CIVIL_SERVANT_CERTIFICATE` | Giấy xác nhận cán bộ/công chức/viên chức |
| `PUBLIC_HOUSING_RETURN_CERTIFICATE` | Văn bản trả lại nhà ở công vụ |
| `LAND_RECOVERY_DECISION` | Quyết định thu hồi đất/giải tỏa nhà ở |
| `INCOME_CERTIFICATE` | Giấy xác nhận thu nhập |

**Case âm:** `.jpg` / PDF 11MB → lỗi.

---

### 9.5 Bước 5 — Rà soát & nộp

- Xem lại: dự án, eKYC, nhà ở (+ diện tích nếu SMALL_HOUSE), hôn nhân, thu nhập (+ vợ/chồng nếu MARRIED), nhóm đối tượng, hộ, giấy tờ.
- Checkbox **cam kết thông tin chính xác** — bắt buộc.
- Nút **Nộp hồ sơ** bật khi: đã cam kết + đủ PDF + status DRAFT/NEED_MORE_DOCUMENTS.
- Sau nộp: status → SUBMITTED (hoặc tương đương BE).

---

### 9.6 Bộ dữ liệu gợi ý wizard

| Scenario | Nhà | Hôn nhân | Nhóm | Điểm kiểm |
|----------|-----|----------|------|-----------|
| A | NO_HOUSE | SINGLE | URBAN_POOR | Không diện tích; 2 PDF |
| B | SMALL_HOUSE = 12 | MARRIED (VC=0) | WORKER | Diện tích + thu nhập VC; 3 PDF |
| C | NO_HOUSE | SINGLE | MERIT_PERSON | 2 PDF (không giấy nghèo) |
| D (âm) | SMALL_HOUSE = 15 | — | — | Chặn bước 1 |
| E (âm) | — | MARRIED trống VC | — | Chặn bước 1 |

---

## 10. Người dân — Danh sách & chi tiết hồ sơ

### 10.1 `#/applications`

- List hồ sơ của tôi + lọc status.  
- CTA tạo hồ sơ → gate eKYC.  
- Không tạo mới nếu đã có hồ sơ active.

### 10.2 `#/application-detail`

**Applicant**

| Status | Hành động mong đợi |
|--------|--------------------|
| DRAFT | Nộp; sửa/upload giấy |
| NEED_MORE_DOCUMENTS | Upload bổ sung; nộp lại |
| Không thuộc terminal | Rút hồ sơ (nhập lý do) |
| Đóng / terminal | Không rút/sửa |

Hiển thị: thông tin đăng ký, giấy tờ, timeline, banner vi phạm nếu `isViolation`.  
Sau nộp hoàn tất: kiểm tra có biên nhận / thông tin xác nhận nộp (theo UI hiện tại).

---

## 11. CĐT / Sở — Thẩm định hồ sơ

### 11.1 CĐT (`Housing Developer`)

| Status hồ sơ | Action |
|--------------|--------|
| SUBMITTED / NEED_MORE_DOCUMENTS | Nhận thẩm định (assign) |
| REVIEWING | Yêu cầu bổ sung / Từ chối / Gửi Sở |

### 11.2 Sở (`Department Of Construction`)

| Status | Action |
|--------|--------|
| PENDING_SXD_REVIEW | Phê duyệt / Từ chối |
| UI | Banner đếm ngày (ý tưởng duyệt mặc định ~20 ngày nếu quá hạn — đối chiếu BE) |

---

## 12. Bốc thăm (Lottery)

### 12.1 Routes

| Route | Role |
|-------|------|
| `#/lottery-sessions` | CĐT, SXD |
| `#/lottery-create` | CĐT (thường hướng về lên lịch từ dự án) |
| `#/lottery-detail` | CĐT, SXD |
| `#/lottery-lobby` | Applicant (+ staff join giám sát) |
| `#/lottery-live` | Applicant, CĐT, SXD |

### 12.2 Luồng chuẩn (đủ điều kiện pháp lý Đ36.2.b)

1. **CĐT** lên lịch: `lotteryDate`, `lotteryLocation`, số căn / mô tả…  
2. **SXD** phê duyệt lịch → sinh **OTP 6 số** vào sảnh (gửi thông báo).  
3. **CĐT** mở sảnh (`WaitingLobby`).  
4. **SXD phải vào sảnh/Live** (online giám sát) — badge **SXD giám sát ≥ 1**.  
5. **CĐT** Start Live — **disabled / lỗi** nếu chưa có SXD online.  
6. Applicant vào lobby bằng OTP; bốc khi session = `Live` **và** còn SXD online.  
7. CĐT Finish phiên (cũng cần SXD online).  
8. **Chỉ SXD** Công bố (`Published`) — CĐT không còn nút công bố.  
9. Tải **biên bản PDF** (có tên SXD giám sát).

### 12.3 Applicant lobby

| Trường / hành động | Điều kiện |
|--------------------|-----------|
| OTP 6 số | Bắt buộc với dân; staff không cần |
| Vào sảnh | Lịch đã duyệt; phiên cho join |
| Bốc căn | Session = Live + SXD online ≥ 1 |
| Ticker realtime | SignalR |

### 12.4 Case âm lottery

- Start Live không có SXD → lỗi Đ36.2.b.  
- CĐT gọi publish → 403.  
- Publish khi chưa ghi nhận supervisor → lỗi.  
- Applicant OTP sai → không vào sảnh.

---

## 13. Hợp đồng & thanh toán

| Route | Role | Việc test |
|-------|------|-----------|
| `#/contracts` | Applicant, CĐT, SXD | List HĐ / hồ sơ đủ điều kiện |
| `#/contract-create` | CĐT | Tạo HĐ cho hồ sơ trúng / được chọn |
| `#/contract-detail` | Các role | Xem; Applicant **ký** nếu chưa ký; xem lịch đợt |
| Thanh toán đợt | Applicant | Đợt UNPAID/OVERDUE/PARTIAL → VNPay; PAID không trả lại |
| `#/payments`, `#/create-payment` | Chủ yếu Admin / test | Sandbox VNPay; return `?payment=success\|failed\|cancelled\|error` |

**Thứ tự nghiệp vụ thường:** duyệt / trúng → hợp đồng → ký → đặt cọc / các đợt thanh toán.

---

## 14. Hậu kiểm (Audit)

| Route | Role |
|-------|------|
| `#/audit-list` | CĐT, SXD |
| `#/audit-create` | SXD |
| `#/audit-detail` | CĐT, SXD |

Checklist mẫu: CCCD, hộ khẩu, thu nhập, chưa sở hữu nhà… đánh giá OK / WARN / FAIL.  
Trạng thái: DRAFT, PUBLISHED, ARCHIVED, FLAGGED, PENDING, IN_PROGRESS, APPROVED, REJECTED…  
SXD sửa khi chưa ARCHIVED; công bố / lưu trữ.

---

## 15. Thông báo, báo cáo sự cố

### 15.1 `#/notifications` (đã login)

- List thông báo hệ thống; đánh dấu đã đọc.

### 15.2 `#/report-issue` (Applicant)

| Trường | Giá trị |
|--------|---------|
| Loại | Bug, FeatureRequest, DataIssue, AccountIssue, Other |
| Nội dung | Bắt buộc mô tả |
| Lịch sử | Open / InReview / Resolved / Closed / Rejected |

---

## 16. Admin hệ thống

| Route | Việc test |
|-------|-----------|
| `#/home-admin` | Hub liên kết |
| `#/admin-staff` | List / lọc role / status / search |
| `#/create-staff` | Email, họ tên, SĐT, role chỉ `Department Of Construction` hoặc `Housing Developer`, mật khẩu tạm ≥8 |
| `#/staff-detail` | Sửa; reset password; Active/Inactive/Suspended; deactivate + lý do |
| `#/admin-logs` | Xem log hoạt động |
| `#/admin-categories` | CRUD danh mục (trạng thái dự án, loại giấy tờ, nhóm thu nhập…) |

---

## 17. Ma trận test ưu tiên

| # | Luồng | Role | Pass khi |
|---|-------|------|----------|
| 1 | Public landing → tìm nhà → chi tiết | Guest | Xem OK không login |
| 2 | Register → OTP → eKYC → home | Applicant | Verified |
| 3 | Quan tâm không eKYC | Applicant | Tim/bỏ tim OK |
| 4 | Nộp hồ sơ bị chặn khi chưa eKYC | Applicant | Redirect/confirm xác minh |
| 5 | Wizard điều kiện nhà + hôn nhân + giấy tờ | Applicant | Đúng ẩn/hiện & validate |
| 6 | Nộp → CĐT nhận → gửi Sở → Sở duyệt | 3 role | Status đúng chuỗi |
| 7 | Lottery: SXD online mới Live; chỉ SXD publish | CĐT+SXD+dân | Gate Đ36.2.b |
| 8 | Ký HĐ + thanh toán đợt VNPay | Applicant | Return success |
| 9 | Profile chỉ sửa SĐT | Applicant | eKYC readonly |
| 10 | Active hồ sơ chặn tạo mới | Applicant | Khóa wizard |

---

## 18. Checklist tổng

### Public & Auth
- [ ] Landing / Tìm nhà / Thông báo / Tra cứu  
- [ ] Login / Register / OTP / Forgot / Reset  

### eKYC & Profile
- [ ] OCR + face match thành công  
- [ ] OCR 429 có cooldown  
- [ ] Profile: họ tên/CCCD/DOB/địa chỉ chỉ đọc; SĐT sửa được  
- [ ] Đổi mật khẩu / xoá tài khoản  

### Applicant dự án & hồ sơ
- [ ] Quan tâm không cần eKYC  
- [ ] Apply cần eKYC  
- [ ] Active hồ sơ chặn tạo mới  
- [ ] Wizard bước 1–5 đủ case dương/âm mục 9  
- [ ] Ma trận PDF theo từng nhóm đối tượng  
- [ ] Rút hồ sơ khi chưa đóng  

### CĐT / Sở
- [ ] Thẩm định / bổ sung / từ chối / gửi Sở / duyệt Sở  
- [ ] Tạo & sửa dự án  

### Lottery
- [ ] Lên lịch → SXD duyệt → OTP  
- [ ] Không Start Live khi SXD = 0  
- [ ] Live + draw + finish có SXD  
- [ ] Chỉ SXD publish + biên bản có supervisor  

### HĐ / TT / Audit / Admin
- [ ] Ký HĐ + trả đợt  
- [ ] Hậu kiểm checklist  
- [ ] Tạo cán bộ Dev/SXD  
- [ ] Thông báo in-app + báo cáo sự cố  

---

## Phụ lục A — Bảng route đầy đủ

| Route id | Tên | Ai dùng |
|----------|-----|---------|
| landing | Trang chủ công khai | Public |
| tim-nha | Tìm nhà | Public |
| thong-bao | Thông báo công khai | Public |
| tra-cuu | Tra cứu hồ sơ | Public / login |
| login | Đăng nhập | Public |
| register | Đăng ký | Public |
| verify-otp | Xác thực OTP | Public |
| resend-otp | Gửi lại OTP | Public |
| forgot-password | Quên mật khẩu | Public |
| reset-password | Đặt lại mật khẩu | Public |
| verify-identity | eKYC | Applicant |
| home-user | Home dân | Applicant |
| quan-tam | Quan tâm | Applicant |
| home-developer | Home CĐT | Housing Developer |
| home-sxd | Home Sở | Department Of Construction |
| home-admin | Home Admin | System Administrator |
| dashboard | Tổng quan | Auth |
| profile | Hồ sơ cá nhân | Auth |
| change-password | Đổi mật khẩu | Auth |
| projects | Danh sách dự án | Applicant, Dev, DOC |
| create-project | Tạo dự án | Dev |
| project-detail | Chi tiết dự án | Public + role |
| applications | Danh sách hồ sơ | Applicant, Dev, DOC |
| create-application | Tạo hồ sơ | Applicant |
| application-detail | Chi tiết hồ sơ | Applicant, Dev, DOC |
| notifications | Thông báo in-app | Auth |
| report-issue | Báo cáo sự cố | Applicant |
| lottery-sessions | Phiên bốc thăm | Dev, DOC |
| lottery-create | Tạo phiên | Dev |
| lottery-detail | Chi tiết phiên | Dev, DOC |
| lottery-lobby | Sảnh chờ | Applicant |
| lottery-live | Giám sát live | Applicant, Dev, DOC |
| contracts | Hợp đồng | Applicant, Dev, DOC |
| contract-create | Tạo HĐ | Dev |
| contract-detail | Chi tiết HĐ | Applicant, Dev, DOC |
| audit-list | Hậu kiểm list | Dev, DOC |
| audit-create | Tạo hậu kiểm | DOC |
| audit-detail | Chi tiết hậu kiểm | Dev, DOC |
| payments | Lịch sử TT | Admin (chính) |
| create-payment | Tạo TT test | Admin |
| admin-staff | Cán bộ | Admin |
| create-staff | Thêm cán bộ | Admin |
| staff-detail | Chi tiết cán bộ | Admin |
| admin-logs | Log | Admin |
| admin-categories | Danh mục | Admin |

---

*Hết tài liệu. Khi phát hiện lệch UI so với tài liệu, ghi bug kèm route + role + bước + dữ liệu nhập + ảnh chụp.*
