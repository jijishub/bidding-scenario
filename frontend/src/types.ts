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

export interface MessagePart {
  text: string
  color?: string
}

export interface Message {
  text: string
  color?: string
  parts?: MessagePart[]
}

export interface StepResponse {
  session_id: string
  messages: (string | Message)[]
  input: InputConfig
  state: string
  actions?: string[]
  done: boolean
}
