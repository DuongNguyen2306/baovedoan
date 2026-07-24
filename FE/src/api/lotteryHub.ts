import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

function hubBaseUrl(): string {
  // VITE_API_BASE_URL thường kết thúc bằng /api → hub nằm ngoài /api
  return baseUrl.replace(/\/api\/?$/, '')
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
  const connection = new HubConnectionBuilder()
    .withUrl(`${hubBaseUrl()}/hubs/lottery`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  connection.on('ReceiveLobbyCount', (count: number) => handlers.onLobbyCount?.(count))
  connection.on('ReceiveSxdSupervisorCount', (count: number) => handlers.onSxdSupervisorCount?.(count))
  connection.on('ReceiveDrawResult', (data: unknown) => handlers.onDrawResult?.(data))
  connection.on('ReceiveLotteryStatus', (status: string) => handlers.onStatus?.(status))

  await connection.start()
  await connection.invoke('JoinProjectLobby', projectId, joinCode ?? null)
  return connection
}

export async function stopLotteryHub(connection: HubConnection | null) {
  if (!connection) return
  try {
    if (connection.state === HubConnectionState.Connected) await connection.stop()
  } catch {
    /* ignore */
  }
}
