export type NodeState = {
  llm_config_id: string
  model_name: string
  prompt_override: string
  temperature: number | null
  max_tokens: number | null
  timeout: number | null
}

export type ApiNodeSource = {
  llm_config_id?: number | null | string
  model_name?: string | null
  prompt_override?: string | null
  temperature?: number | null
  max_tokens?: number | null
  timeout?: number | null
}
