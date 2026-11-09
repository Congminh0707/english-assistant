import { describe, expect, it } from 'vitest'
import { CloudTranslator } from './CloudTranslator'

type Sent = { url: string; headers: Record<string, string>; body: unknown }

function fakeFetch(reply: (url: string) => { status: number; body?: unknown } | Error): {
  fetch: ConstructorParameters<typeof CloudTranslator>[0]['fetch']
  sent: Sent[]
} {
  const sent: Sent[] = []
  return {
    sent,
    fetch: async (url, init) => {
      sent.push({ url, headers: init.headers, body: JSON.parse(init.body) })
      const r = reply(url)
      if (r instanceof Error) throw r
      return { ok: r.status < 400, status: r.status, json: async () => r.body }
    }
  }
}

const GOOGLE_OK = { data: { translations: [{ translatedText: 'Xin chào' }] } }
const AZURE_OK = [{ translations: [{ text: 'Xin chào (az)', to: 'vi' }] }]

describe('CloudTranslator', () => {
  it('không có key nào → không sẵn sàng, dịch thì throw mà không gọi mạng', async () => {
    const { fetch, sent } = fakeFetch(() => ({ status: 200, body: GOOGLE_OK }))
    const t = new CloudTranslator({ getKeys: () => ({ google: '  ', azureKey: '' }), fetch })
    expect(t.available()).toBe(false)
    await expect(t.translate('Hello', 'en-vi')).rejects.toThrow()
    expect(sent).toEqual([])
  })

  it('Google: gửi key qua header, đúng chiều ngôn ngữ, format text', async () => {
    const { fetch, sent } = fakeFetch(() => ({ status: 200, body: GOOGLE_OK }))
    const t = new CloudTranslator({ getKeys: () => ({ google: 'AIza-test' }), fetch })
    expect(t.available()).toBe(true)
    expect(await t.translate('Hello', 'en-vi')).toEqual({ text: 'Xin chào', engine: 'google' })
    expect(sent[0]!.url).toBe('https://translation.googleapis.com/language/translate/v2')
    expect(sent[0]!.url).not.toContain('AIza')
    expect(sent[0]!.headers['x-goog-api-key']).toBe('AIza-test')
    expect(sent[0]!.body).toEqual({ q: 'Hello', source: 'en', target: 'vi', format: 'text' })
  })

  it('Azure: gửi key + region, chiều Việt → Anh', async () => {
    const { fetch, sent } = fakeFetch(() => ({ status: 200, body: AZURE_OK }))
    const t = new CloudTranslator({
      getKeys: () => ({ azureKey: 'az-key', azureRegion: 'southeastasia' }),
      fetch
    })
    expect(await t.translate('Xin chào', 'vi-en')).toEqual({
      text: 'Xin chào (az)',
      engine: 'azure'
    })
    expect(sent[0]!.url).toBe(
      'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=vi&to=en'
    )
    expect(sent[0]!.headers['ocp-apim-subscription-key']).toBe('az-key')
    expect(sent[0]!.headers['ocp-apim-subscription-region']).toBe('southeastasia')
    expect(sent[0]!.body).toEqual([{ Text: 'Xin chào' }])
  })

  it('Google lỗi → thử Azure', async () => {
    const { fetch, sent } = fakeFetch((url) =>
      url.includes('googleapis') ? { status: 500 } : { status: 200, body: AZURE_OK }
    )
    const t = new CloudTranslator({ getKeys: () => ({ google: 'g', azureKey: 'a' }), fetch })
    expect((await t.translate('Hello', 'en-vi')).engine).toBe('azure')
    expect(sent).toHaveLength(2)
  })

  it('key sai (401/403) → tắt nhà cung cấp đó', async () => {
    const { fetch, sent } = fakeFetch(() => ({ status: 403 }))
    const t = new CloudTranslator({ getKeys: () => ({ google: 'bad' }), fetch })
    await expect(t.translate('Hello', 'en-vi')).rejects.toThrow()
    expect(t.available()).toBe(false)
    await expect(t.translate('Hello', 'en-vi')).rejects.toThrow()
    expect(sent).toHaveLength(1)
  })

  it('đổi key sau khi bị từ chối → dùng lại được', async () => {
    let key = 'bad'
    const { fetch, sent } = fakeFetch(() =>
      key === 'bad' ? { status: 401 } : { status: 200, body: GOOGLE_OK }
    )
    const t = new CloudTranslator({ getKeys: () => ({ google: key }), fetch })
    await expect(t.translate('Hello', 'en-vi')).rejects.toThrow()
    expect(t.available()).toBe(false)
    key = 'good'
    expect(t.available()).toBe(true)
    expect((await t.translate('Hello', 'en-vi')).text).toBe('Xin chào')
    expect(sent).toHaveLength(2)
  })

  it('hết hạn mức / lỗi mạng → nghỉ một lúc rồi thử lại', async () => {
    let now = 0
    let fail = true
    const { fetch, sent } = fakeFetch(() =>
      fail ? new Error('offline') : { status: 200, body: GOOGLE_OK }
    )
    const t = new CloudTranslator({ getKeys: () => ({ google: 'g' }), fetch, now: () => now })
    await expect(t.translate('Hello', 'en-vi')).rejects.toThrow()
    expect(t.available()).toBe(false)
    now += 60_000
    await expect(t.translate('Hello', 'en-vi')).rejects.toThrow()
    expect(sent).toHaveLength(1)
    fail = false
    now += 5 * 60_000
    expect(t.available()).toBe(true)
    expect((await t.translate('Hello', 'en-vi')).text).toBe('Xin chào')
  })

  it('kết quả rỗng / sai dạng → coi là lỗi', async () => {
    const { fetch } = fakeFetch(() => ({ status: 200, body: { data: { translations: [] } } }))
    const t = new CloudTranslator({ getKeys: () => ({ google: 'g' }), fetch })
    await expect(t.translate('Hello', 'en-vi')).rejects.toThrow()
  })
})
