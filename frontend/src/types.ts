export type InputType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'choice'
  | 'continue'
  | 'done'

export interface InputConfig {
  type: InputType
  label: string
  placeholder: string
  options?: string[]
}

export interface StepResponse {
  session_id: string
  messages: string[]
  input: InputConfig
  state: string
  done: boolean
}
