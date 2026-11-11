// Khởi tạo & nối các service (~ Service Providers trong Laravel). Không import electron ở đây
// để test dựng được toàn bộ container với SQLite in-memory + FakeClock.
import type { Clock } from './core/Clock'
import { EventBus } from './core/EventBus'
import type { UserDbConnection } from './db/client'
import { InventoryRepository } from './db/repositories/InventoryRepository'
import { PetRepository } from './db/repositories/PetRepository'
import { ProfileRepository } from './db/repositories/ProfileRepository'
import { SettingsRepository } from './db/repositories/SettingsRepository'
import { XpRepository } from './db/repositories/XpRepository'
import { InventoryService } from './services/InventoryService'
import { PetService } from './services/PetService'
import { ProfileService } from './services/ProfileService'
import { SettingsService } from './services/SettingsService'
import type { Transaction } from './services/types'
import { XpService } from './services/XpService'
import { VocabService } from './services/VocabService'
import { VocabRepository } from './db/repositories/VocabRepository'
import { InstalledPackRepository } from './db/repositories/InstalledPackRepository'
import { ContentPackService } from './content/ContentPackService'
import { DictionaryService } from './content/DictionaryService'
import { pickHardWords, wordLevel } from './content/hardWords'
import { SrsService } from './services/SrsService'
import { MicroLearningService } from './services/MicroLearningService'
import { StudyService } from './services/StudyService'
import { AchievementService } from './services/AchievementService'
import { CourseService } from './services/CourseService'
import { DailyPlanService } from './services/DailyPlanService'
import { KidsService } from './services/KidsService'
import { KidsWorldService } from './services/KidsWorldService'
import { MissionService } from './services/MissionService'
import { ProgressService } from './services/ProgressService'
import { ParentService } from './services/ParentService'
import { PlacementService } from './services/PlacementService'
import { PracticeService } from './services/PracticeService'
import { ShopService } from './services/ShopService'
import { StatsService } from './services/StatsService'
import { LessonService } from './services/LessonService'
import { LessonLibrary } from './content/LessonLibrary'
import {
  bundledCourseFiles,
  bundledGrammarFiles,
  bundledLessonFiles,
  bundledListeningFiles,
  bundledPhrasebookFiles,
  bundledKidsFiles,
  bundledKidsPlaceFiles,
  bundledKidsWorldFiles,
  bundledPlacementFiles,
  bundledToeicFiles,
  bundledVideoFiles,
  bundledReadingFiles
} from './content/bundledLessons'
import { PhrasebookLibrary } from './content/PhrasebookLibrary'
import { CourseLibrary } from './content/CourseLibrary'
import { KidsLibrary } from './content/KidsLibrary'
import { KidsWorldLibrary } from './content/KidsWorldLibrary'
import { PlacementBank } from './content/PlacementBank'
import { ToeicBank } from './content/ToeicBank'
import { VideoBank } from './content/VideoBank'
import { VideoService } from './services/VideoService'
import { ToeicService } from './services/ToeicService'
import { ExamRepository } from './db/repositories/ExamRepository'
import {
  GrammarUnitFileSchema,
  ListeningUnitFileSchema,
  ReadingUnitFileSchema
} from '@shared/schemas/lesson'
import { UsageRepository } from './db/repositories/UsageRepository'
import { ProgressRepository } from './db/repositories/ProgressRepository'
import { LessonRepository } from './db/repositories/LessonRepository'
import { AnthropicClient, type AiClient } from './ai/AiClient'
import { AiService } from './ai/AiService'
import { ClaudeCliClient } from './ai/ClaudeCliClient'
import type { CliRunner } from './ai/cliRunner'
import { ClaudeCliLocator, NO_CLI, type CliProbe } from './ai/resolveClaudeCli'
import { DiaryRepository } from './db/repositories/DiaryRepository'
import { DiaryService } from './services/DiaryService'

export interface Container {
  clock: Clock
  bus: EventBus
  settings: SettingsService
  profiles: ProfileService
  inventory: InventoryService
  pet: PetService
  xp: XpService
  packs: ContentPackService
  dictionary: DictionaryService
  vocab: VocabService
  srs: SrsService
  micro: MicroLearningService
  study: StudyService
  missions: MissionService
  achievements: AchievementService
  placement: PlacementService
  toeic: ToeicService
  video: VideoService
  practice: PracticeService
  shop: ShopService
  stats: StatsService
  lessons: LessonService
  progress: ProgressService
  /** Điểm ngữ pháp và bài đọc: cùng cơ chế với bài học nền tảng */
  grammar: LessonService
  readings: LessonService
  listening: LessonService
  phrasebook: PhrasebookLibrary
  kids: KidsService
  kidsWorld: KidsWorldService
  courses: CourseService
  /** Lộ trình hôm nay (docs/07 §13) */
  dailyPlan: DailyPlanService
  parent: ParentService
  /** AI dùng key Claude của người dùng: giải thích ngữ pháp, sửa nhật ký (docs/11 §5) */
  ai: AiService
  /** Nhật ký tiếng Anh buổi tối (docs/07 §14) */
  diary: DiaryService
}

export interface ContainerOptions {
  /** Thư mục giải nén content pack (userData/packs) */
  packsDir: string
  /** Tắt bản đồ thế giới của bé (test cũ của thẻ nghe–chạm hình tự giới thiệu hình mới) */
  kidsWorld?: boolean
  /**
   * AI (docs/11 §5): `getKey` đọc key Anthropic (index.ts truyền cùng secret 'anthropic' với Dịch online; bỏ trống = không
   * có key); `client` / `cliClient` thay client thật (test truyền client giả). `cli`: cách chạy + tìm Claude Code CLI
   * (index.ts truyền runCli + findClaudeCandidates; bỏ trống = không có CLI, không chạy tiến trình nào — mặc định của test)
   */
  ai?: {
    getKey?: () => string | null
    client?: AiClient
    cliClient?: AiClient
    cli?: {
      run: CliRunner
      findCandidates: () => Promise<string[]>
      fallbackCandidates?: () => string[]
      isFile?: (path: string) => boolean
    }
  }
}

export function createContainer(
  conn: UserDbConnection,
  clock: Clock,
  options: ContainerOptions
): Container {
  const { db, sqlite } = conn
  const bus = new EventBus()
  const transaction: Transaction = (fn) => sqlite.transaction(fn)()

  const repos = {
    profiles: new ProfileRepository(db),
    pets: new PetRepository(db),
    inventory: new InventoryRepository(db),
    xp: new XpRepository(db),
    settings: new SettingsRepository(db),
    vocab: new VocabRepository(db),
    lessons: new LessonRepository(db),
    usage: new UsageRepository(db),
    exam: new ExamRepository(db),
    progress: new ProgressRepository(db),
    packs: new InstalledPackRepository(db),
    diary: new DiaryRepository(db)
  }

  const settings = new SettingsService(repos.settings, clock, bus)
  const profiles = new ProfileService({
    profiles: repos.profiles,
    pets: repos.pets,
    inventory: repos.inventory,
    settings,
    clock,
    transaction
  })
  const inventory = new InventoryService({ inventory: repos.inventory, profiles, clock })
  const pet = new PetService({
    pets: repos.pets,
    inventory: repos.inventory,
    profiles,
    clock,
    bus,
    transaction
  })
  const xp = new XpService({
    xp: repos.xp,
    pets: repos.pets,
    petService: pet,
    profiles,
    clock,
    bus,
    transaction
  })

  const packs = new ContentPackService({ repo: repos.packs, packsDir: options.packsDir, clock })
  const dictionary = new DictionaryService(packs)
  const phrasebook = new PhrasebookLibrary(bundledPhrasebookFiles)
  const vocab = new VocabService({
    vocab: repos.vocab,
    profiles,
    xp,
    clock,
    bus,
    transaction
  })

  const srs = new SrsService({
    vocab: repos.vocab,
    profiles,
    settings,
    dictionary,
    xp,
    clock,
    bus,
    transaction
  })
  const micro = new MicroLearningService({
    srs,
    dictionary,
    vocab: repos.vocab,
    profiles,
    settings,
    clock
  })
  const study = new StudyService({
    vocab: repos.vocab,
    vocabService: vocab,
    srs,
    dictionary,
    phrasebook,
    profiles,
    settings,
    clock,
    transaction
  })

  const missions = new MissionService({
    vocab: repos.vocab,
    xpRepo: repos.xp,
    xp,
    srs,
    profiles,
    settings,
    clock,
    bus
  })

  const progress = new ProgressService({
    repo: repos.progress,
    usage: repos.usage,
    profiles,
    settings,
    clock
  })

  const placement = new PlacementService({
    dictionary,
    bank: new PlacementBank(bundledPlacementFiles),
    profiles,
    settings,
    progress,
    xp,
    xpRepo: repos.xp,
    clock
  })

  const toeic = new ToeicService({
    bank: new ToeicBank(bundledToeicFiles),
    repo: repos.exam,
    profiles,
    clock,
    xp,
    xpRepo: repos.xp
  })

  const video = new VideoService({
    bank: new VideoBank(bundledVideoFiles),
    repo: repos.exam,
    profiles,
    clock,
    xp,
    xpRepo: repos.xp
  })

  const practice = new PracticeService({
    dictionary,
    profiles,
    settings,
    xp,
    xpRepo: repos.xp,
    progress,
    clock
  })

  const shop = new ShopService({
    inventory: repos.inventory,
    pets: repos.pets,
    petService: pet,
    xp,
    profiles,
    clock,
    bus,
    transaction
  })

  const stats = new StatsService({
    vocab: repos.vocab,
    lessonRepo: repos.lessons,
    usage: repos.usage,
    progress,
    settings,
    xpRepo: repos.xp,
    dictionary,
    profiles,
    clock
  })

  const achievements = new AchievementService({ stats, xpRepo: repos.xp, xp, profiles, bus })

  const lessonDeps = {
    repo: repos.lessons,
    xpRepo: repos.xp,
    xp,
    profiles,
    clock,
    transaction,
    progress
  }
  const lessons = new LessonService({
    library: new LessonLibrary(bundledLessonFiles),
    ...lessonDeps,
    source: 'lesson'
  })
  const grammar = new LessonService({
    library: new LessonLibrary(bundledGrammarFiles, console.warn, GrammarUnitFileSchema),
    ...lessonDeps,
    source: 'grammar'
  })
  const readings = new LessonService({
    library: new LessonLibrary(bundledReadingFiles, console.warn, ReadingUnitFileSchema),
    ...lessonDeps,
    source: 'reading',
    // Lần đầu đạt bài đọc: tự lưu tối đa 8 từ khó của bài vào sổ từ (docs/07 §5)
    onFirstPass: (lesson) => {
      if (profiles.active().isChild || !settings.get('review.autoSaveReading')) return 0
      try {
        const paragraphs = lesson.blocks.flatMap((b) =>
          b.type === 'passage' ? b.paragraphs.map((p) => p.en) : []
        )
        const items = pickHardWords(
          paragraphs,
          (word) => wordLevel(dictionary, word, false),
          settings.get('learning.level'),
          new Set(repos.vocab.savedContentIdList(profiles.activeId()))
        )
        return items.length ? study.saveMany(items).saved : 0
      } catch (err) {
        console.warn('[reading] auto-save hard words failed', err)
        return 0
      }
    }
  })
  const listening = new LessonService({
    library: new LessonLibrary(bundledListeningFiles, console.warn, ListeningUnitFileSchema),
    ...lessonDeps,
    source: 'listening'
  })

  const lessonServices = { lesson: lessons, grammar, reading: readings, listening }
  const courses = new CourseService({
    library: new CourseLibrary(bundledCourseFiles),
    services: lessonServices,
    repo: repos.lessons,
    profiles
  })
  const dailyPlan = new DailyPlanService({
    srs,
    vocab: repos.vocab,
    xpRepo: repos.xp,
    courses,
    progress,
    services: lessonServices,
    lessonRepo: repos.lessons,
    settings,
    profiles,
    clock
  })

  // Chế độ trẻ em + khu vực phụ huynh (parent cần kids để báo cáo, kids cần parent để biết đã có PIN → nối qua hàm)
  let parentService: ParentService | null = null
  let worldService: KidsWorldService | null = null
  const kids = new KidsService({
    library: new KidsLibrary(bundledKidsFiles),
    vocab: repos.vocab,
    lessonRepo: repos.lessons,
    xpRepo: repos.xp,
    usage: repos.usage,
    srs,
    xp,
    inventory,
    pet,
    profiles,
    settings,
    clock,
    transaction,
    pinSet: () => parentService?.pinSet() ?? false,
    worldProgress: () => worldService?.progress() ?? { done: 0, total: 0 },
    introduceInReview: () => !(worldService?.enabled ?? false)
  })
  const kidsWorld = new KidsWorldService({
    library: new KidsWorldLibrary(
      options.kidsWorld === false ? [] : bundledKidsWorldFiles,
      options.kidsWorld === false ? [] : bundledKidsPlaceFiles
    ),
    vocab: repos.vocab,
    lessonRepo: repos.lessons,
    xpRepo: repos.xp,
    settingsRepo: repos.settings,
    settings,
    srs,
    xp,
    kids,
    profiles,
    clock,
    transaction
  })
  worldService = kidsWorld
  const parent = new ParentService({
    settingsRepo: repos.settings,
    settings,
    usage: repos.usage,
    vocab: repos.vocab,
    kids,
    profiles,
    clock
  })
  parentService = parent

  const aiKey = options.ai?.getKey ?? ((): string | null => null)
  const cliOpts = options.ai?.cli
  const cliProbe: CliProbe = cliOpts
    ? new ClaudeCliLocator({
        run: cliOpts.run,
        findCandidates: cliOpts.findCandidates,
        fallbackCandidates: cliOpts.fallbackCandidates,
        isFile: cliOpts.isFile,
        now: () => clock.now()
      })
    : NO_CLI
  const ai = new AiService({
    clients: {
      api:
        options.ai?.client ??
        new AnthropicClient({ getKey: aiKey, getModel: () => settings.get('ai.model') }),
      cli:
        options.ai?.cliClient ??
        new ClaudeCliClient({
          run: cliOpts?.run ?? (() => Promise.reject(new Error('ai-cli: not available'))),
          getExe: () => cliProbe.exe(),
          getModel: () => settings.get('ai.model')
        })
    },
    cli: cliProbe,
    getKey: aiKey,
    settings,
    profiles,
    clock
  })
  const diary = new DiaryService({
    repo: repos.diary,
    xpRepo: repos.xp,
    xp,
    ai,
    profiles,
    settings,
    clock
  })

  return {
    clock,
    bus,
    settings,
    profiles,
    inventory,
    pet,
    xp,
    packs,
    dictionary,
    vocab,
    srs,
    micro,
    study,
    missions,
    placement,
    toeic,
    video,
    practice,
    shop,
    stats,
    achievements,
    lessons,
    progress,
    grammar,
    readings,
    listening,
    phrasebook,
    kids,
    kidsWorld,
    parent,
    courses,
    dailyPlan,
    ai,
    diary
  }
}
