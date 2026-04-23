/** Material row from materials API. */
export type Material = {
  id: number
  course_id: number
  type: string
  filename: string
  processing_status: string
  metadata: Record<string, unknown>
  created_at: string
}
