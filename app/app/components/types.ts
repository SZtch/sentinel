export type Lang = 'id' | 'en'
export type Answer = 'yes' | 'no'

export type JournalData = {
  streak: number
  journal: {
    week: string
    content: string
    sessionCount: number
    generatedAt?: number
  } | null
}

export type LangStrings = {
  yes: string
  no: string
  sub: string
  back: string
  retry: string
  streak: string
  thisWeek: string
  switchTo: string
  chatPrompt: string
  chatPlaceholder: string
  chatSend: string
  chatClose: string
}
