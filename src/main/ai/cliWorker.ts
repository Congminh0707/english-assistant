// Tiến trình nền (Electron utilityProcess "aiCliWorker") chạy Claude Code CLI và các lệnh phụ (where.exe, taskkill).
// Tách khỏi main vì spawn claude.exe từ tiến trình main của Electron chặn luồng main 0,7–1,4 giây → đơ chuột toàn hệ
// thống (main giữ global mouse hook của mascot). Logic chạy duy nhất ở runCli (cliRunner.ts): không shell, env tối
// thiểu, cwd tạm riêng, timeout + kill cả cây, giới hạn stdout/stderr. Không ghi log gì.
// Giao thức (cliWorkerClient.ts): main → worker {id, exe, args, stdin, opts}; worker → main {id, ok:true, result} |
// {id, ok:false, message} — message chỉ là lý do cố định `ai-cli: ...`.
import { runCli } from './cliRunner'
import { safeCliReason, type CliWorkerRequest, type CliWorkerResponse } from './cliWorkerClient'

process.parentPort.on('message', async (event) => {
  const msg = event.data as CliWorkerRequest
  let reply: CliWorkerResponse
  try {
    const result = await runCli(msg.exe, msg.args, msg.stdin, msg.opts)
    reply = { id: msg.id, ok: true, result }
  } catch (err) {
    reply = {
      id: msg.id,
      ok: false,
      message: safeCliReason(err instanceof Error ? err.message : '')
    }
  }
  process.parentPort.postMessage(reply)
})
