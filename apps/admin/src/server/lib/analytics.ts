import { BetaAnalyticsDataClient } from '@google-analytics/data'

type AnalyticsConfig = {
  propertyId: string
  keyFilePath: string | undefined
}

function readConfig(): AnalyticsConfig | null {
  const propertyId = process.env.GA_PROPERTY_ID?.trim()
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (!propertyId) return null
  return { propertyId, keyFilePath: keyFilePath || undefined }
}

let clientSingleton: BetaAnalyticsDataClient | null = null
function getClient(cfg: AnalyticsConfig): BetaAnalyticsDataClient {
  if (clientSingleton) return clientSingleton
  clientSingleton = cfg.keyFilePath
    ? new BetaAnalyticsDataClient({ keyFilename: cfg.keyFilePath })
    : new BetaAnalyticsDataClient()
  return clientSingleton
}

export type OverviewRow = {
  date: string
  pageViews: number
  sessions: number
  users: number
}

export type TopPageRow = {
  path: string
  title: string
  pageViews: number
}

export type RefererRow = {
  source: string
  sessions: number
}

export type AnalyticsOverview = {
  configured: true
  propertyId: string
  range: { startDate: string; endDate: string }
  totals: { pageViews: number; sessions: number; users: number }
  byDay: OverviewRow[]
  topPages: TopPageRow[]
  referers: RefererRow[]
}

export type AnalyticsResult = AnalyticsOverview | { configured: false; hint: string }

export async function fetchOverview(days: number): Promise<AnalyticsResult> {
  const cfg = readConfig()
  if (!cfg) {
    return {
      configured: false,
      hint: 'GA_PROPERTY_ID 및 GOOGLE_APPLICATION_CREDENTIALS 환경변수를 설정하세요.'
    }
  }
  const client = getClient(cfg)
  const startDate = `${Math.max(1, days)}daysAgo`
  const endDate = 'today'
  const property = `properties/${cfg.propertyId}`

  const [dailyRes, pagesRes, referersRes] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }]
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10
    })
  ])

  // GA Data API 는 이벤트가 발생한 날짜만 반환. 그래프에 요청 범위 전체가 표시되도록
  // 빈 날짜를 0 으로 채운다.
  const rawByDate = new Map<string, OverviewRow>(
    (dailyRes[0].rows ?? []).map((r) => {
      const d = r.dimensionValues?.[0]?.value ?? ''
      return [
        d,
        {
          date: d,
          pageViews: Number(r.metricValues?.[0]?.value ?? 0),
          sessions: Number(r.metricValues?.[1]?.value ?? 0),
          users: Number(r.metricValues?.[2]?.value ?? 0)
        }
      ]
    })
  )

  const today = new Date()
  const byDay: OverviewRow[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key =
      String(d.getFullYear()) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0')
    byDay.push(
      rawByDate.get(key) ?? { date: key, pageViews: 0, sessions: 0, users: 0 }
    )
  }

  const totals = byDay.reduce(
    (acc, r) => ({
      pageViews: acc.pageViews + r.pageViews,
      sessions: acc.sessions + r.sessions,
      users: acc.users + r.users
    }),
    { pageViews: 0, sessions: 0, users: 0 }
  )

  const topPages: TopPageRow[] = (pagesRes[0].rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? '',
    title: r.dimensionValues?.[1]?.value ?? '',
    pageViews: Number(r.metricValues?.[0]?.value ?? 0)
  }))

  const referers: RefererRow[] = (referersRes[0].rows ?? []).map((r) => ({
    source: r.dimensionValues?.[0]?.value ?? '',
    sessions: Number(r.metricValues?.[0]?.value ?? 0)
  }))

  return {
    configured: true,
    propertyId: cfg.propertyId,
    range: { startDate, endDate },
    totals,
    byDay,
    topPages,
    referers
  }
}
