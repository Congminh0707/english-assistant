import { clipboard, type ClipboardItem } from 'electron'
import { canSimulateCopy, cleanSelection } from './selectionRules'
import { clipboardSequenceNumber, getForegroundInfo, sendCopyShortcut } from './win32'

/** Chờ tối đa chừng này ms để ứng dụng đích xử lý Ctrl+C */
const COPY_WAIT_MS = 450
const POLL_MS = 15

/** Sao lưu mọi định dạng đang có trong clipboard (chữ, HTML, ảnh...) để trả lại nguyên vẹn sau khi lấy vùng bôi đen */
type ClipboardBackup = ClipboardItem[]

const backupClipboard = (): Promise<ClipboardBackup> => clipboard.read()

async function restoreClipboard(backup: ClipboardBackup): Promise<void> {
  if (backup.length) await clipboard.write(backup)
  else clipboard.clear()
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Lấy chữ người dùng muốn dịch khi bấm phím tắt: ưu tiên chữ ĐANG BÔI ĐEN (gửi Ctrl+C giả lập rồi khôi phục lại
 * clipboard như cũ); nếu không bôi đen gì / ứng dụng không cho sao chép / cửa sổ là terminal thì dùng chữ đã Ctrl+C
 * trong clipboard như trước. Chỉ chạy khi người dùng chủ động bấm phím tắt. Không bao giờ ghi nội dung ra log.
 */
export async function readSelectionOrClipboard(
  fallback: () => Promise<string>,
  enabled: boolean
): Promise<string> {
  if (process.platform !== 'win32' || !enabled) return fallback()
  if (!canSimulateCopy(getForegroundInfo())) return fallback()

  const before = clipboardSequenceNumber()
  let backup: ClipboardBackup
  try {
    backup = await backupClipboard()
  } catch {
    return fallback()
  }
  if (!sendCopyShortcut()) return fallback()

  const deadline = Date.now() + COPY_WAIT_MS
  while (clipboardSequenceNumber() === before && Date.now() < deadline) await sleep(POLL_MS)
  if (clipboardSequenceNumber() === before) return fallback() // không có gì được sao chép

  const selected = cleanSelection(await clipboard.readText())
  try {
    await restoreClipboard(backup)
  } catch {
    /* không khôi phục được: để nguyên chữ vừa chép */
  }
  return selected || fallback()
}
