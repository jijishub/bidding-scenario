import axios from 'axios'
import type { StepResponse } from './types'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

const client = axios.create({ baseURL: BASE_URL })

export async function createSession(): Promise<StepResponse> {
  const { data } = await client.post<StepResponse>('/session')
  return data
}

export async function sendStep(
  sessionId: string,
  value: string,
): Promise<StepResponse> {
  const { data } = await client.post<StepResponse>(
    `/session/${sessionId}/step`,
    { value },
  )
  return data
}
