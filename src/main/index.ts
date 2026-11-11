import { app, powerMonitor, screen } from 'electron'
import { autoUpdater } from 'electron-updater'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'path'
import { electronApp } from '@electron-toolkit/utils'
import { systemClock } from './core/Clock'
import { paths } from './core/paths'
import { CloudTranslator } from './translate/CloudTranslator'
import { OnlineTranslator } from './translate/OnlineTranslator'
import { SafeStorageSecretStore } from './system/SecretStore'
import { openUserDb, type UserDbConnection } from './db/client'
import { createContainer } from './container'
import { runCli } from './ai/cliRunner'
import { claudeFallbackCandidates, findClaudeCandidates } from './ai/resolveClaudeCli'
import { MascotWindow } from './windows/MascotWindow'
import { PopupWindow } from './windows/PopupWindow'
import { StudyWindow } from './windows/StudyWindow'
import { registerAppIpc } from './ipc/app.ipc'
import { registerMascotIpc } from './ipc/mascot.ipc'
import { registerPopupIpc } from './ipc/popup.ipc'
import { registerStudyIpc } from './ipc/study.ipc'
import { broadcast, sendTo } from './ipc/broadcast'
import { createTray, type AppTray } from './system/tray'
import { showMascotMenu } from './system/mascotMenu'
import { DEFAULT_SHORTCUTS, registerShortcuts, shortcutLabel } from './system/shortcuts'
import { applyPermissionPolicy, applySecurityDefaults } from './system/security'
import { installVideoPlayer, registerVideoScheme } from './system/videoPlayer'
import { UpdateManager } from './system/UpdateManager'
import { applyLaunchAtLogin } from './system/autostart'
import { readClipboardForLookup } from './system/clipboard'
import { readSelectionOrClipboard } from './system/selection'
import { getForegroundInfo, getUserNotificationState, monitorOfNativeHandle } from './system/win32'
import { QuietModeService } from './services/QuietModeService'
import { SleepService } from './services/SleepService'
import { TranslationService } from './services/TranslationService'
import { ModelManager } from './translate/ModelManager'
import { NLLB_200, OPUS_MT_EN_VI, OPUS_MT_VI_EN } from './translate/modelFiles'
import { OpusMtEngine } from './translate/OpusMtEngine'
import { TtsService } from './services/TtsService'
import { AudioPackService } from './services/AudioPackService'
import { AudioPackManager } from './audio/AudioPackManager'
import { LISTENING_AUDIO_PACK } from './audio/packSpec'
import { SttService } from './services/SttService'
import { PronunciationService } from './services/PronunciationService'
import { WhisperEngine } from './stt/WhisperEngine'
import { Wav2Vec2Engine } from './stt/Wav2Vec2Engine'
import { PRONUNCIATION_MODEL, WHISPER_BASE_EN } from './stt/modelFiles'
import { KokoroEngine } from './tts/KokoroEngine'
import { KOKORO } from './tts/modelFiles'
import { TtsCache } from './tts/TtsCache'
import { Scheduler } from './jobs/Scheduler'
import { schedulePetJobs } from './jobs/petJobs'
import { scheduleQuizJob } from './jobs/quizJobs'
import { scheduleDiaryJob } from './jobs/diaryJob'

const APP_ID = 'net.gonbi.englishassistant'

// Dev: REMOTE_DEBUG_PORT=9222 mở Chrome DevTools Protocol để công cụ/AI agent kiểm tra renderer từ ngoài
if (!app.isPackaged && process.env['REMOTE_DEBUG_PORT']) {
  app.commandLine.appendSwitch('remote-debugging-port', process.env['REMOTE_DEBUG_PORT'])
}

// Cố định thư mục dữ liệu là %APPDATA%\english-assistant (productName khi đóng gói có dấu cách sẽ đổi đường dẫn mặc định)
// EA_USER_DATA: scripts/ui-shot.mjs chạy trên dữ liệu riêng, không đụng dữ liệu thật
app.setPath(
  'userData',
  process.env['EA_USER_DATA'] ?? join(app.getPath('appData'), 'english-assistant')
)

// Giữ tham chiếu ở cấp module để không bị garbage collect
let conn: UserDbConnection | null = null
let container: ReturnType<typeof createContainer> | null = null
let mascot: MascotWindow | null = null
let popup: PopupWindow | null = null
let study: StudyWindow | null = null
let tray: AppTray | null = null
let quietMode: QuietModeService | null = null
let translation: TranslationService | null = null
let speech: TtsService | null = null
let recognition: SttService | null = null
let pronunciation: PronunciationService | null = null
const scheduler = new Scheduler()

// Chỉ cho chạy 1 instance: mở lần 2 thì hiện lại mascot đang có
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  applySecurityDefaults()
  registerVideoScheme() // phải trước app ready

  app.on('second-instance', () => mascot?.show())

  app.whenReady().then(() => {
    electronApp.setAppUserModelId(APP_ID)
    applyPermissionPolicy()
    installVideoPlayer()

    // Dữ liệu: mở user.db (tự migrate) và dựng các service
    conn = openUserDb(paths.userDb(), paths.migrations())
    // Key người dùng nhập (mã hoá bằng safeStorage): key Claude 'anthropic' dùng chung cho Dịch online và AI (#56)
    const secrets = new SafeStorageSecretStore(paths.secrets())
    const c = createContainer(conn, systemClock, {
      packsDir: paths.packs(),
      // AI qua Claude Code CLI (gói Pro/Max, #57): chạy không shell, env tối thiểu, thư mục tạm riêng (cliRunner.ts)
      ai: {
        getKey: () => secrets.get('anthropic'),
        cli: {
          run: runCli,
          findCandidates: () => findClaudeCandidates(),
          fallbackCandidates: claudeFallbackCandidates
        }
      }
    })
    c.profiles.active() // lần đầu chạy: tạo profile + thú cưng + túi đồ khởi đầu
    container = c
    // Cài gói nội dung đi kèm (từ điển...) ở nền — lần đầu mất vài giây để giải nén
    void c.packs
      .ensureBundled(paths.bundledPacks())
      .then((ids) => ids.length && console.info(`[content-pack] Đã cài: ${ids.join(', ')}`))

    // Gói sprite 288px (đã bỏ từ khi thú cưng vẽ vector): xoá thư mục của người đã tải, bỏ qua lỗi
    rmSync(paths.spritePacks(), { recursive: true, force: true })

    // Cửa sổ & IPC
    const m = new MascotWindow(c.settings.get('mascot.scale'))
    const p = new PopupWindow()
    mascot = m
    popup = p
    const s = new StudyWindow()
    study = s
    // Dịch câu offline: model tải về userData/models khi người dùng đồng ý, chạy trong utilityProcess
    const onlineTranslator = new OnlineTranslator({ getKey: () => secrets.get('anthropic') })
    // Google/Azure: key người dùng nhập trong Cài đặt (mã hoá bằng safeStorage); không có key thì không bao giờ gọi mạng
    const CLOUD_SECRET = { google: 'google-translate', azure: 'azure-translator' } as const
    const cloudTranslator = new CloudTranslator({
      getKeys: () => ({
        google: secrets.get(CLOUD_SECRET.google),
        azureKey: secrets.get(CLOUD_SECRET.azure),
        azureRegion: secrets.get('azure-translator-region')
      })
    })
    const translationService = new TranslationService({
      models: {
        'en-vi': new ModelManager({ modelsDir: paths.models(), spec: OPUS_MT_EN_VI }),
        'vi-en': new ModelManager({ modelsDir: paths.models(), spec: OPUS_MT_VI_EN }),
        high: new ModelManager({ modelsDir: paths.models(), spec: NLLB_200 })
      },
      engine: new OpusMtEngine(paths.models()),
      preferHigh: () => c.settings.get('translate.highQuality'),
      online: {
        enabled: () => c.settings.get('translate.online'),
        translate: (text, direction) => onlineTranslator.translate(text, direction)
      },
      cloud: {
        enabled: () => c.settings.get('translate.cloud'),
        available: () => cloudTranslator.available(),
        translate: (text, direction) => cloudTranslator.translate(text, direction),
        keys: {
          canStore: () => secrets.canStore(),
          has: (provider) => !!secrets.get(CLOUD_SECRET[provider]),
          set: (provider, key, region) => {
            secrets.set(CLOUD_SECRET[provider], key)
            if (provider === 'azure') {
              if (region) secrets.set('azure-translator-region', region)
              else secrets.delete('azure-translator-region')
            }
          },
          clear: (provider) => {
            secrets.delete(CLOUD_SECRET[provider])
            if (provider === 'azure') secrets.delete('azure-translator-region')
          }
        }
      },
      keys: {
        canStore: () => secrets.canStore(),
        has: () => onlineTranslator.hasKey(),
        set: (key) => secrets.set('anthropic', key),
        clear: () => secrets.delete('anthropic')
      },
      onStatus: (direction, status) => broadcast('translate:status-changed', { direction, status })
    })
    translation = translationService
    // mBART-50 (~890 MB) đã được thay bằng NLLB-200 (docs/decisions.md #34): xoá bản cũ còn sót trên đĩa
    const oldMbart = join(paths.models(), 'Xenova', 'mbart-large-50-many-to-many-mmt')
    if (existsSync(oldMbart)) rmSync(oldMbart, { recursive: true, force: true })
    // Không nạp sẵn model dịch lúc khởi động (NLLB-200 giữ ~1,7–3,7 GB RAM dù không dùng — docs/decisions.md #54):
    // chỉ nạp khi mở popup tra (quickTranslate bên dưới)
    // Giọng đọc tự nhiên offline (Kokoro): model tải khi người dùng đồng ý, chạy trong utilityProcess riêng
    const ttsService = new TtsService({
      models: new ModelManager({ modelsDir: paths.models(), spec: KOKORO }),
      engine: new KokoroEngine(paths.models()),
      cache: new TtsCache(paths.ttsCache()),
      voices: () => ({ us: c.settings.get('tts.voiceUs'), uk: c.settings.get('tts.voiceUk') }),
      onStatus: (status) => broadcast('tts:status-changed', status)
    })
    speech = ttsService
    // Gói âm thanh bài nghe tạo sẵn (MP3): người dùng tải thêm trong Cài đặt / trang Nghe
    const audioPackService = new AudioPackService({
      pack: new AudioPackManager({ packsDir: paths.audioPacks(), spec: LISTENING_AUDIO_PACK }),
      onStatus: (status) => broadcast('audio:status-changed', status)
    })
    // Nhận dạng giọng nói offline (Whisper base.en) + model phát âm âm vị tuỳ chọn (tải thêm/premium)
    const sttService = new SttService({
      models: new ModelManager({ modelsDir: paths.models(), spec: WHISPER_BASE_EN }),
      engine: new WhisperEngine(paths.models()),
      onStatus: (status) => broadcast('stt:status-changed', status)
    })
    recognition = sttService
    const pronunciationService: PronunciationService = new PronunciationService({
      models: PRONUNCIATION_MODEL
        ? new ModelManager({ modelsDir: paths.models(), spec: PRONUNCIATION_MODEL })
        : null,
      engine: new Wav2Vec2Engine(paths.models()),
      onStatus: (status) => broadcast('pron:status-changed', status)
    })
    pronunciation = pronunciationService
    // Cập nhật tự động: chỉ bản đã đóng gói; kiểm tra nền (tắt được trong Cài đặt), tải/cài khi người dùng đồng ý
    const updates = new UpdateManager({
      updater: autoUpdater,
      currentVersion: app.getVersion(),
      enabled: app.isPackaged,
      onStatus: (status) => broadcast('update:status-changed', status)
    })
    registerAppIpc(
      c,
      translationService,
      ttsService,
      audioPackService,
      sttService,
      pronunciationService,
      updates,
      !app.isPackaged
    )
    if (app.isPackaged) {
      const autoCheck = (): void => {
        if (c.settings.get('app.autoUpdate')) void updates.check()
      }
      setTimeout(autoCheck, 45_000)
      scheduler.every('update-check', 6 * 60 * 60_000, autoCheck)
    }
    // Ngủ: người dùng vắng mặt lâu hoặc thú cưng hết năng lượng
    const sleepService = new SleepService({
      pet: c.pet,
      getIdleSeconds: () => powerMonitor.getSystemIdleTime(),
      onChange: ({ sleeping, reason }) => {
        console.info(`[sleep] ${sleeping ? `mascot đi ngủ (${reason})` : 'mascot thức dậy'}`)
        sendTo(m.win, 'mascot:sleep', { sleeping, reason })
      }
    })
    scheduler.every('sleep-check', 15_000, () => sleepService.check(), true)
    scheduler.every('sleep-rest', 60_000, () => sleepService.rest(60_000))
    // Micro-learning: mascot hỏi ôn thẻ đến hạn / giới thiệu từ mới định kỳ
    const mascotFree = (): boolean =>
      m.win.isVisible() && !p.win.isVisible() && !sleepService.sleeping
    const quizJob = scheduleQuizJob(scheduler, c, {
      canShow: mascotFree,
      show: (quiz) => sendTo(m.win, 'mascot:quiz', quiz)
    })
    // Nhắc viết nhật ký tối: cùng điều kiện hiện như câu hỏi ôn (mascot ẩn khi yên lặng → không nhắc)
    scheduleDiaryJob(scheduler, c, {
      canShow: mascotFree,
      show: () => sendTo(m.win, 'mascot:react', { kind: 'diary' })
    })
    registerMascotIpc(
      m,
      () => showMascotMenu(c, m, { quizNow: () => quizJob.trigger(), openStudy: () => s.open() }),
      () => s.open('diary')
    )
    registerPopupIpc(p)
    registerStudyIpc(s, m)
    registerShortcuts({
      // Bôi đen chữ (hoặc đã Ctrl+C) rồi bấm phím tắt → popup tra từ cạnh con trỏ
      quickTranslate: async () => {
        if (p.win.isVisible()) return p.hide()
        const text = await readSelectionOrClipboard(
          readClipboardForLookup,
          c.settings.get('translate.autoCopy')
        )
        p.showAtCursor()
        // Nạp model dịch song song với việc tra từ điển để bản dịch hiện nhanh hơn
        translationService.warmup(text)
        sendTo(p.win, 'popup:query', { text })
      }
    })
    tray = createTray(
      m,
      shortcutLabel(DEFAULT_SHORTCUTS.quickTranslate),
      () => c.settings.get('ui.language'),
      () => s.open()
    )
    m.onVisibilityChanged = () => tray?.refresh()

    // Lần đầu chạy: mở cửa sổ Học tập để chào hỏi (tên, mục tiêu, trình độ)
    // --open-study: scripts/ui-shot.mjs mở thẳng cửa sổ Học tập để chụp
    if (!c.settings.get('app.onboarded') || process.argv.includes('--open-study'))
      setTimeout(() => s.open(), 800)

    // Sự kiện nội bộ → đẩy xuống các cửa sổ
    c.bus.on('pet.updated', (state) => broadcast('pet:updated', state))
    c.bus.on('pet.fed', () => sendTo(m.win, 'mascot:react', { kind: 'eat' }))
    c.bus.on('pet.hungry', () => sendTo(m.win, 'mascot:react', { kind: 'hungry' }))
    c.bus.on('level.up', () => sendTo(m.win, 'mascot:react', { kind: 'level-up' }))
    c.bus.on('mission.completed', () => sendTo(m.win, 'mascot:react', { kind: 'mission' }))
    c.bus.on('achievement.unlocked', ({ ids }) => {
      // Thông báo thành tựu cao nhất (cuối danh sách: nhóm sau thường khó hơn) kèm số lượng
      sendTo(m.win, 'mascot:react', {
        kind: 'achievement',
        achievementId: ids[ids.length - 1],
        count: ids.length
      })
    })
    c.bus.on('settings.changed', ({ key, settings }) => {
      broadcast('settings:changed', settings)
      if (key === 'mascot.scale') {
        m.setScale(settings['mascot.scale'])
        m.ensureOnScreen()
      }
      if (key === 'ui.language') tray?.refresh()
      if (key === 'app.launchAtLogin') applyLaunchAtLogin(settings['app.launchAtLogin'])
    })

    // Chế độ yên lặng: tự ẩn khi có app toàn màn hình
    quietMode = new QuietModeService(
      () => (m.win.isDestroyed() ? null : monitorOfNativeHandle(m.win.getNativeWindowHandle())),
      ({ quiet, reason }) => {
        console.info(`[quiet-mode] ${quiet ? `tạm ẩn mascot (${reason})` : 'hiện lại mascot'}`)
        m.setQuiet(quiet)
      },
      () => ({
        meetings: c.settings.get('quiet.meetings'),
        dnd: {
          enabled: c.settings.get('quiet.dnd.enabled'),
          from: c.settings.get('quiet.dnd.from'),
          to: c.settings.get('quiet.dnd.to')
        }
      }),
      {
        userNotificationState: getUserNotificationState,
        foreground: getForegroundInfo,
        now: () => new Date()
      }
    )
    quietMode.start()

    // Tác vụ định kỳ
    schedulePetJobs(scheduler, c, () => !m.win.isVisible() || sleepService.sleeping)

    const keepOnScreen = (): void => m.ensureOnScreen()
    screen.on('display-metrics-changed', keepOnScreen)
    screen.on('display-added', keepOnScreen)
    screen.on('display-removed', keepOnScreen)
  })

  // App mascot sống ở tray: không thoát khi đóng hết cửa sổ, chỉ thoát qua menu tray
  app.on('window-all-closed', () => {})

  app.on('before-quit', () => {
    scheduler.stopAll()
    quietMode?.stop()
    popup?.win.destroy()
    study?.destroy()
    translation?.dispose()
    speech?.dispose()
    recognition?.dispose()
    pronunciation?.dispose()
    tray?.tray.destroy()
    tray = null
    container?.packs.closeAll()
    conn?.close()
    conn = null
  })
}
