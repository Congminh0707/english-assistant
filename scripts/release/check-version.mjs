// Quyết định có phát hành hay không dựa trên version trong package.json và các tag `v*` hiện có.
//   - version chưa có tag → phát hành (release=true); workflow sẽ tạo release + tag `v<version>`
//   - version đã có tag → không phát hành (release=false), thoát thành công
//   - version thấp hơn tag cao nhất → lỗi (thường là quên tăng/giảm nhầm version)
// Chạy thử trên máy: node scripts/release/check-version.mjs
// Trong GitHub Actions ghi kết quả vào $GITHUB_OUTPUT (release, version, tag).
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

function parse(v) {
  const m = SEMVER.exec(v)
  return m ? { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null } : null
}

/** So sánh semver: <0 nếu a < b. Bản có hậu tố (-beta) thấp hơn bản chính cùng số. */
export function compareVersions(a, b) {
  const pa = parse(a)
  const pb = parse(b)
  for (let i = 0; i < 3; i++) {
    if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] - pb.nums[i]
  }
  if (pa.pre === pb.pre) return 0
  if (pa.pre === null) return 1
  if (pb.pre === null) return -1
  return pa.pre < pb.pre ? -1 : 1
}

/** Quyết định thuần (dễ test): tags là danh sách tag dạng `v1.2.3` */
export function decide(version, tags) {
  if (!parse(version)) {
    return { release: false, error: `package.json: version "${version}" không phải semver (x.y.z)` }
  }
  const tag = `v${version}`
  if (tags.includes(tag))
    return { release: false, tag, reason: `Tag ${tag} đã tồn tại — không có version mới, bỏ qua` }
  const existing = tags.map((t) => t.replace(/^v/, '')).filter((v) => parse(v))
  const newest = existing.sort(compareVersions).at(-1)
  if (newest && compareVersions(version, newest) < 0) {
    return {
      release: false,
      tag,
      error: `Version ${version} thấp hơn bản đã phát hành v${newest}. Hãy tăng version trong package.json.`
    }
  }
  return {
    release: true,
    tag,
    reason: `Version mới ${version} (bản trước: ${newest ? `v${newest}` : 'chưa có'})`
  }
}

function main() {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
  const tags = execFileSync('git', ['tag', '-l', 'v*'], { encoding: 'utf8' })
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
  const result = decide(version, tags)

  if (result.error) {
    console.error(`✗ ${result.error}`)
    process.exit(1)
  }
  if (
    result.release &&
    existsSync('CHANGELOG.md') &&
    !readFileSync('CHANGELOG.md', 'utf8').includes(version)
  ) {
    console.error(`✗ CHANGELOG.md chưa có mục cho phiên bản ${version}`)
    process.exit(1)
  }
  console.log(`${result.release ? '✓' : '•'} ${result.reason}`)

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `release=${result.release}\nversion=${version}\ntag=${result.tag}\n`
    )
  }
}

// Chỉ chạy khi gọi trực tiếp (để test import được compareVersions/decide)
if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())
)
  main()
