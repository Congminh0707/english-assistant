// Hạn mức lượt gọi Claude Code CLI mỗi ngày (docs/11 §5): một ô chọn duy nhất ở Cài đặt gộp hai cài đặt
// `ai.cliDailyLimit` (0–200, 0 = tắt CLI) và `ai.cliUnlimited`. Quy tắc: hạn mức 0 = tắt CLI luôn thắng; không giới hạn
// chỉ có hiệu lực khi hạn mức > 0. Ô chọn không bao giờ tạo ra trạng thái "0 + không giới hạn".

/** Các mức hạn mức/ngày có trong ô chọn (giữ 10 và 30 để giá trị người dùng đã chọn trước đây vẫn hiện đúng) */
export const CLI_LIMIT_STEPS = [10, 30, 60, 100, 150, 200] as const
/** Mặc định của `ai.cliDailyLimit`; chọn "Không giới hạn" khi đang tắt (0) thì đặt lại mức này */
export const CLI_DEFAULT_LIMIT = 60

/** Một lựa chọn trong ô: số lượt/ngày, 'unlimited', hoặc 0 = tắt */
export type CliLimitChoice = number | 'unlimited'

/** Các lựa chọn theo thứ tự hiển thị: các mức, Không giới hạn, Tắt */
export const CLI_LIMIT_CHOICES: readonly CliLimitChoice[] = [...CLI_LIMIT_STEPS, 'unlimited', 0]

/** Không giới hạn có hiệu lực không (hạn mức 0 thắng) */
export function cliUnlimitedActive(limit: number, unlimited: boolean): boolean {
  return unlimited && limit > 0
}

/** Lựa chọn đang hiện trong ô theo hai cài đặt */
export function cliLimitChoice(limit: number, unlimited: boolean): CliLimitChoice {
  return cliUnlimitedActive(limit, unlimited) ? 'unlimited' : limit
}

/** Đọc giá trị `<option>` (chuỗi) thành lựa chọn; không hợp lệ → null */
export function parseCliLimitChoice(raw: string): CliLimitChoice | null {
  if (raw === 'unlimited') return 'unlimited'
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 && n <= 200 ? n : null
}

/**
 * Các lần ghi cài đặt (theo thứ tự) để áp một lựa chọn. Thứ tự sao cho trạng thái giữa chừng không bao giờ là
 * "0 + không giới hạn": bật không giới hạn thì đặt hạn mức > 0 trước; chọn số thì tắt không giới hạn trước.
 */
export function cliLimitUpdates(
  choice: CliLimitChoice,
  currentLimit: number
): Array<['ai.cliDailyLimit', number] | ['ai.cliUnlimited', boolean]> {
  if (choice === 'unlimited') {
    return currentLimit > 0
      ? [['ai.cliUnlimited', true]]
      : [
          ['ai.cliDailyLimit', CLI_DEFAULT_LIMIT],
          ['ai.cliUnlimited', true]
        ]
  }
  return [
    ['ai.cliUnlimited', false],
    ['ai.cliDailyLimit', choice]
  ]
}
