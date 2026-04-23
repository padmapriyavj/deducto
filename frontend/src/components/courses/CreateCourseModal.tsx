import { SimpleModal } from '@/components/ui/SimpleModal'
import type { CreateCourseRequest, UpdateCourseRequest } from '@/lib/api/types/course'
import { useCreateCourseMutation } from '@/lib/queries/courseQueries'

import { CourseForm } from './CourseForm'

type CreateCourseModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message)
      return parsed.detail || error.message
    } catch {
      return error.message
    }
  }
  return 'Something went wrong. Please try again.'
}

export function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
  const createCourse = useCreateCourseMutation()

  const handleSubmit = (data: CreateCourseRequest | UpdateCourseRequest) => {
    const body: CreateCourseRequest = {
      name: data.name ?? '',
      description: data.description ?? null,
      schedule: 'schedule' in data && data.schedule != null ? data.schedule : {},
    }
    createCourse.mutate(body, {
      onSuccess: () => {
        onSuccess?.()
        onClose()
      },
    })
  }

  const handleClose = () => {
    createCourse.reset()
    onClose()
  }

  return (
    <SimpleModal title="Create a New Course" isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-4">
        {createCourse.isError ? (
          <p className="text-danger text-sm" role="alert">
            {parseApiError(createCourse.error)}
          </p>
        ) : null}
        <CourseForm
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={createCourse.isPending}
          submitLabel="Create Course"
        />
      </div>
    </SimpleModal>
  )
}
