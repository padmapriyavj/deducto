/** Lesson row from `GET/POST/PATCH /courses/.../lessons` and `GET /lessons/{id}`. */
export type Lesson = {
  id: number
  course_id: number
  title: string
  week_number: number
  material_id: number | null
  created_at: string
}

export type CreateLessonBody = {
  title: string
  week_number: number
}

export type UpdateLessonBody = {
  title?: string
  week_number?: number
}
