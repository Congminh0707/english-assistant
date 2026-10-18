/**
 * Tác vụ định kỳ trong main (~ $schedule trong Laravel Console Kernel). Không dùng cron hệ thống:
 * app tắt thì job tắt; khi mở lại job tự "bù" dựa trên timestamp lưu trong DB (docs/03-architecture.md#6).
 */
export class Scheduler {
  private timers = new Map<string, NodeJS.Timeout>()

  every(name: string, intervalMs: number, job: () => void, runNow = false): void {
    this.stop(name)
    const run = (): void => {
      try {
        job()
      } catch (err) {
        console.error(`[job] ${name} failed:`, err)
      }
    }
    this.timers.set(name, setInterval(run, intervalMs))
    if (runNow) run()
  }

  stop(name: string): void {
    const timer = this.timers.get(name)
    if (timer) clearInterval(timer)
    this.timers.delete(name)
  }

  stopAll(): void {
    for (const name of [...this.timers.keys()]) this.stop(name)
  }
}
