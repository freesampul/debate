export type QuestionStatus = 'open' | 'in_debate' | 'closed'

export interface Question {
  id: string
  content: string
  submitted_by: string
  vote_count: number
  status: QuestionStatus
  created_at: string
}
