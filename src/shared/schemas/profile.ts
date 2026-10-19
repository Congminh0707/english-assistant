import { z } from 'zod'
import { Track } from './content/level'

/** Một hồ sơ người học (nhiều người dùng chung máy) */
export const ProfileInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  track: Track,
  /** Hồ sơ trẻ em: ẩn từ nhạy cảm, chỉ số thú cưng giảm chậm hơn */
  isChild: z.boolean(),
  petName: z.string(),
  /** Hồ sơ đang dùng */
  active: z.boolean()
})
export type ProfileInfo = z.infer<typeof ProfileInfoSchema>

/** Thông tin tạo hồ sơ mới / thiết lập hồ sơ đầu tiên (onboarding) */
export const ProfileSetupInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  track: Track,
  petName: z.string().trim().min(1).max(20).optional()
})
export type ProfileSetupInput = z.infer<typeof ProfileSetupInputSchema>

/** Track dành cho trẻ nhỏ → hồ sơ trẻ em */
export const CHILD_TRACKS: readonly Track[] = ['preschool', 'primary']
export const isChildTrack = (track: Track): boolean => CHILD_TRACKS.includes(track)
