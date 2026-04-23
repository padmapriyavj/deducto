import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextField } from '@/components/ui/FormField'
import { Spinner } from '@/components/ui/Spinner'
import { uploadMaterial } from '@/lib/api/materialsApi'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useCreateLessonMutation } from '@/lib/queries/lessonQueries'
import { useAuthStore } from '@/stores/authStore'

function isAllowedFilename(name: string): boolean {
  const n = name.toLowerCase()
  return n.endsWith('.pdf') || n.endsWith('.ppt') || n.endsWith('.pptx')
}

export function CreateLessonPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const id = parseInt(courseId ?? '', 10)
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const course = useCourseQuery(id)
  const createLesson = useCreateLessonMutation(id)

  const [title, setTitle] = useState('')
  const [week, setWeek] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !token) return
    setError(null)
    try {
      const lesson = await createLesson.mutateAsync({
        title: title.trim(),
        week_number: week,
      })
      if (file) {
        await uploadMaterial(token, id, file, lesson.id)
      }
      navigate(`/professor/lesson/${lesson.id}/concepts`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create lesson.')
    }
  }

  if (course.isLoading) return <Spinner label="Loading course..." />
  if (course.isError || !course.data) {
    return (
      <p className="text-danger text-sm">
        Could not load course.{' '}
        <Link to="/professor" className="text-primary underline">
          Back
        </Link>
      </p>
    )
  }

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={`/professor/course/${id}?tab=lessons`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to lessons
        </Link>
      </nav>

      <PageHeader
        title="Create lesson"
        description={`Course: ${course.data.name}. Add a title and week, then optionally upload one PDF or PowerPoint — it will be linked to this lesson on the server.`}
      />

      {error ? (
        <p className="text-danger mb-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-2xl space-y-6">
        <TextField
          id="lesson-title"
          label="Lesson title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Week 3: Sorting"
        />
        <TextField
          id="lesson-week"
          label="Week number"
          type="number"
          min={1}
          max={52}
          value={String(week)}
          onChange={(e) => setWeek(parseInt(e.target.value, 10) || 1)}
        />

        <div>
          <p className="text-foreground mb-2 text-sm font-medium">Material (optional)</p>
          <p className="text-foreground/65 mb-3 text-xs">
            Upload a .pdf, .ppt, or .pptx to attach to this lesson. You can also add one later from the course
            Materials tab.
          </p>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx"
            className="text-foreground text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              if (f && !isAllowedFilename(f.name)) {
                setFile(null)
                setError('Only PDF and PowerPoint files are allowed.')
                return
              }
              setFile(f)
              setError(null)
            }}
          />
          {file ? (
            <p className="text-foreground/70 mt-2 text-xs">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || createLesson.isPending}>
            {createLesson.isPending ? 'Saving…' : 'Save and review concepts'}
          </Button>
        </div>
      </form>
    </div>
  )
}
