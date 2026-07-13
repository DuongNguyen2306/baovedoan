# Tài khoản đăng nhập — RHS (môi trường local)

> File này dùng cho **dev/test trên máy local**. Không commit mật khẩu lên repo công khai nếu deploy production.

## Địa chỉ hệ thống

| Thành phần | URL |
|------------|-----|
| Frontend | http://localhost:5173/#/login |
| Backend API | https://localhost:7085 |
| Database | `localhost\SQLEXPRESS` / `RHS_Database` |

Chạy backend (không sửa `appsettings`):

```powershell
.\scripts\start-be-local.ps1
```

Chạy frontend:

```powershell
cd FE
npm run dev
```

---

## Tài khoản cán bộ (đã tạo sẵn)

### Quản lý phường — Ward Manager

| | |
|---|---|
| Email | `ql.phuong@fecaps.vn` |
| Mật khẩu | `QlPhuong@123` |
| Họ tên | Nguyễn Văn Quản Lý Phường |
| Trang sau đăng nhập | `#/home-ward` |

**Chức năng chính:** xem hồ sơ, phê duyệt / từ chối / yêu cầu bổ sung hồ sơ ở trạng thái *Đang thẩm định*.

---

### Cán bộ thẩm định — Verification Officer

| | |
|---|---|
| Email | `canbo.thamdinh@fecaps.vn` |
| Mật khẩu | `CanBoTd@123` |
| Họ tên | Trần Thị Cán Bộ Thẩm Định |
| Trang sau đăng nhập | `#/home-verifier` |

**Chức năng chính:** nhận hồ sơ, thẩm định, phê duyệt / từ chối hồ sơ.

---

## Tài khoản khác trong database

### Quản trị hệ thống — System Administrator

| | |
|---|---|
| Email | `toannmse170238@fpt.edu.vn` |
| Mật khẩu | *(mật khẩu bạn đã đặt khi đăng ký — không lưu trong file này)* |
| Trang sau đăng nhập | `#/home-admin` |

Dùng để: thêm cán bộ, tạo dự án, quản lý toàn hệ thống.

---

### Người đăng ký — Applicant (mẫu)

| | |
|---|---|
| Email | `nguyenminhtoanbt2003@gmail.com` |
| Mật khẩu | *(mật khẩu lúc đăng ký)* |
| Trang sau đăng nhập | `#/home-user` |

---

## Tạo lại tài khoản cán bộ (nếu xóa DB)

Chạy script SQL:

```powershell
sqlcmd -S "localhost\SQLEXPRESS" -d RHS_Database -E -i ".\scripts\seed-staff-accounts.sql"
```

Hoặc đăng nhập **admin** → **Thêm cán bộ** (`#/create-staff`).

---

## Ghi chú

- Hai tài khoản cán bộ **không cần OTP** (`IsEmailVerified = true`).
- Sau khi đổi vai trò user bằng SQL, cần **đăng xuất và đăng nhập lại** để JWT cập nhật quyền.
- Mật khẩu tối thiểu 8 ký tự khi tạo cán bộ qua giao diện admin.

---

*Cập nhật: 06/2026*
