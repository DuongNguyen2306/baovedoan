export interface RegisterDto {
  email: string
  password: string
  fullName: string
  phoneNumber?: string | null
  role: string
}

export interface LoginDto {
  Email: string
  Password: string
}

export interface GoogleLoginDto {
  googleIdToken: string
  role?: string | null
}

export interface RefreshTokenDto {
  refreshToken: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface ResetPasswordDto {
  email: string
  otpCode: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileDto {
  fullName: string
  phoneNumber?: string | null
  citizenId?: string | null
  dateOfBirth?: string | null
  address?: string | null
}

export interface UserProfileDto {
  id?: string
  email: string
  fullName: string
  phoneNumber?: string | null
  citizenId?: string | null
  dateOfBirth?: string | null
  address?: string | null
  isCitizenIdVerified?: boolean
  role?: string
  profileImageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export type ApiResult = unknown

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}

export interface HousingProjectSummaryDto {
  id: string
  projectName: string
  province?: string
  district?: string
  street?: string
  address?: string
  availableUnits?: number
  thumbnailUrl?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  lotteryDate?: string
  applicationOpenDate?: string
  applicationCloseDate?: string
}

export interface HousingProjectDto {
  id?: string
  projectName?: string
  name?: string
  description?: string
  province?: string
  district?: string
  address?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  availableUnits?: number
  thumbnailUrl?: string
  imageUrl?: string
  status?: string
  housingProjectStatusId?: string
  createdAt?: string
  updatedAt?: string
  images?: { id: string; imageUrl: string; displayOrder: number }[]
}

export interface CreateHousingProjectRequestDto {
  projectName: string
  description: string
  province: string
  district: string
  street?: string
  ward?: string
  address?: string
  minPrice: number
  maxPrice: number
  minArea: number
  maxArea: number
  availableUnits: number
  thumbnailUrl?: string
  thumbnailFile?: File
  imagesFiles?: File[]
  decisionNumber?: string
  approvalDate?: string
  isConfirmed?: boolean
  depositAmount?: number
  lotteryDate?: string
  lotteryLocation?: string
  applicationOpenDate?: string
  applicationCloseDate?: string
  housingProjectStatusId: string
}

export interface ProjectFilterDto {
  search?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  minAvailable?: number
  status?: string
}

export interface CreatePaymentDto {
  ApplicationId: string
  OrderInfo?: string
}

export interface PaymentInfoDto {
  id?: string
  orderId: string
  orderInfo: string
  amount: number
  status?: string
  vnpTransactionNo?: string
  vnpBankCode?: string
  createdAt?: string
  paidAt?: string
}

export interface PaymentResponseDto {
  success?: boolean
  message?: string
  data?: {
    paymentUrl?: string
    orderId?: string
    amount?: number
  }
}

export interface PagedResultDto<T> {
  pageIndex?: number
  pageSize?: number
  totalCount?: number
  totalPages?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
  items?: T[]
}

export interface ApplicationFilterDto {
  pageIndex?: number
  pageSize?: number
  status?: string
  projectId?: string
  search?: string
  submittedFrom?: string
  submittedTo?: string
}

export interface HouseholdMemberDto {
  fullName: string
  citizenId?: string | null
  dateOfBirth?: string | null
  relationship: string
  note?: string | null
}

export interface CreateApplicationDto {
  projectId: string
  fullName: string
  citizenId: string
  occupation?: string | null
  workPlace?: string | null
  currentResidence: string
  permanentAddress: string
  housingStatus: string
  maritalStatus: string
  monthlyIncome?: number | null
  spouseMonthlyIncome?: number | null
  averageHousingAreaPerPerson?: number | null
  priorityGroup: string
  householdMembers?: HouseholdMemberDto[] | null
}

export interface ApplicationSummaryDto {
  applicationId: string
  projectId: string
  projectName: string
  applicantId: string
  applicantFullName: string
  citizenId: string
  applicationStatus: string
  createdAt: string
  submittedAt: string
  finalDecisionDate?: string | null
  housingStatus: string
  estimatedMonthlyIncome: number
  documentCount: number
}

export interface ApplicationDocumentDto {
  documentId: string
  documentType: string
  fileName: string
  fileUrl: string
  fileSizeBytes: number
  verificationStatus: string
  uploadedAt: string
  uploadedBy: string
}

export interface ReviewHistoryDto {
  historyId: string
  action: string
  oldStatus: string
  newStatus: string
  note?: string | null
  changedAt: string
  changedBy: string
  changedByFullName: string
}

export interface ApplicationDetailDto {
  applicationId: string
  applicationStatus: string
  priorityScore?: number
  createdAt: string
  submittedAt: string
  finalDecisionDate?: string | null
  updatedAt?: string | null
  projectId: string
  projectName: string
  applicantId: string
  fullName: string
  citizenId: string
  occupation?: string | null
  workPlace?: string | null
  currentResidence: string
  permanentAddress: string
  housingStatus: string
  estimatedMonthlyIncome: number
  officerId?: string | null
  officerFullName?: string | null
  documents?: ApplicationDocumentDto[]
  reviewHistories?: ReviewHistoryDto[]
}

export interface ReviewRequestDto {
  action: string
  note?: string | null
}

export interface OcrResultDto {
  id?: string
  name?: string
  dob?: string
  sex?: string
  nationality?: string
  home?: string
  address?: string
  doe?: string
  issueDate?: string
  issueLoc?: string
  type?: string
  overallScore?: number
}

export interface FaceMatchResultDto {
  isMatch?: boolean
  similarity?: number
  isBothImgIdCard?: boolean
  fptMessage?: string
}

export interface LivenessResultDto {
  isLive?: boolean
  spoofProbability?: number
  needToReview?: boolean
  isDeepfake?: boolean
  warning?: string
  livenessCode?: string
  livenessMessage?: string
  fptMessage?: string
}

export interface WishlistItemDto {
  wishlistId: string
  projectId: string
  projectName: string
  description?: string
  province?: string
  district?: string
  address?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  availableUnits?: number
  thumbnailUrl?: string
  status?: string
  addedAt?: string
}
