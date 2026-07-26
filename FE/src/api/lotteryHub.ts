import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * DEV: luôn `/hubs/lottery` (same-origin → Vite proxy → API).
 * Prod: hub cùng host với VITE_API_BASE_URL.
 */
function hubUrl(): string {
  if (import.meta.env.DEV) return '/hubs/lottery'
  const base = String(apiBase).replace(/\/api\/?$/i, '').replace(/\/$/, '')
  return base ? `${base}/hubs/lottery` : '/hubs/lottery'
}

export type LotteryHubHandlers = {
  onLobbyCount?: (count: number) => void
  onSxdSupervisorCount?: (count: number) => void
  onDrawResult?: (data: unknown) => void
  onStatus?: (status: string) => void
}

export async function connectLotteryHub(
  projectId: string,
  joinCode: string | undefined,
  handlers: LotteryHubHandlers,
): Promise<HubConnection> {
  const token = localStorage.getItem('accessToken') ?? ''
  if (!token) throw new Error('Chưa đăng nhập — không kết nối được sảnh realtime.')
  if (!projectId) throw new Error('Thiếu mã dự án để vào sảnh.')

  const url = hubUrl()
  const connection = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => localStorage.getItem('accessToken') ?? token,
      transport:
        HttpTransportType.WebSockets |
        HttpTransportType.ServerSentEvents |
        HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
    .configureLogging(LogLevel.Information)
    .build()

  connection.on('ReceiveLobbyCount', (count: number) => handlers.onLobbyCount?.(Number(count) || 0))
  connection.on('ReceiveSxdSupervisorCount', (count: number) =>
    handlers.onSxdSupervisorCount?.(Number(count) || 0),
  )
  connection.on('ReceiveDrawResult', (data: unknown) => handlers.onDrawResult?.(data))
  connection.on('ReceiveLotteryStatus', (status: string) => handlers.onStatus?.(String(status ?? '')))

  const join = async () => {
    await connection.invoke('JoinProjectLobby', projectId, joinCode ?? null)
  }

  connection.onreconnected(() => {
    void join().catch((err) => console.warn('LotteryHub rejoin failed', err))
  })

  try {
    await connection.start()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Hub ${url}: ${msg}. Kiểm tra API http://127.0.0.1:5112 đang chạy và mở FE tại http://127.0.0.1:5173`,
    )
  }
  await join()
  return connection
}

export async function stopLotteryHub(connection: HubConnection | null) {
  if (!connection) return
  try {
    if (connection.state !== HubConnectionState.Disconnected) await connection.stop()
  } catch {
    /* ignore */
  }
}
