export interface Course {
  id: number
  professor_id: number
  name: string
  description: string | null
  schedule: Record<string, unknown>
  join_code: string
  created_at: string
}

export interface CreateCourseRequest {
  name: string
  description?: string | null
  schedule?: Record<string, unknown>
}

export interface UpdateCourseRequest {
  name?: string
  description?: string | null
  schedule?: Record<string, unknown>
}

export interface EnrollRequest {
  join_code: string
}

/** Public join page payload (no auth). */
export interface CourseJoinInfo {
  id: number
  name: string
}

export interface Student {
  id: number
  email: string
  display_name: string
  avatar_config: Record<string, unknown>
  coins: number
  current_streak: number
}
