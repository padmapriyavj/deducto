import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { useUploadMaterialMutation } from '@/lib/queries/materialQueries'

type Props = {
  courseId: number
  isOpen: boolean
  onClose: () => void
  /** When set, upload uses ``POST .../materials?lesson_id=`` so the lesson is linked on the server. */
  lessonId?: number
  onUploaded?: () => void
}

function isAllowedFilename(name: string): boolean {
  const n = name.toLowerCase()
  return n.endsWith('.pdf') || n.endsWith('.ppt') || n.endsWith('.pptx')
}

export function UploadMaterialModal({ courseId, isOpen, onClose, lessonId, onUploaded }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const upload = useUploadMaterialMutation(courseId)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const finish = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const doUpload = useCallback(
    (file: File) => {
      setError(null)
      upload.mutate(
        { file, lessonId },
        {
          onSuccess: () => {
            onUploaded?.()
            finish()
          },
          onError: (err) => {
            setError(err instanceof Error ? err.message : 'Upload failed.')
          },
        },
      )
    },
    [upload, lessonId, onUploaded, finish],
  )

  const onPickFiles = (files: FileList | null) => {
    if (!files?.length) return
    const f = files[0]
    if (!isAllowedFilename(f.name)) {
      setError('Only .pdf, .ppt, and .pptx files are allowed.')
      return
    }
    doUpload(f)
  }

  return (
    <SimpleModal title="Upload course material" isOpen={isOpen} onClose={finish}>
      <p className="text-foreground/70 mb-4 text-sm">
        PDF and PowerPoint only (.pdf, .ppt, .pptx). Files are sent to the platform and processed on the server
        (status updates in the materials list).
      </p>
      {error ? (
        <p className="text-danger mb-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className={`border-divider mb-4 rounded-[var(--radius-md)] border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'bg-background/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          onPickFiles(e.dataTransfer.files)
        }}
      >
        <p className="text-foreground/80 mb-2 text-sm">Drag a file here or</p>
        <label className="inline-block">
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.ppt,.pptx"
            disabled={upload.isPending}
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <span className="text-primary cursor-pointer text-sm font-semibold underline-offset-2 hover:underline">
            choose file
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={finish} disabled={upload.isPending}>
          Cancel
        </Button>
      </div>
      {upload.isPending ? <p className="text-foreground/60 mt-3 text-xs">Uploading…</p> : null}
    </SimpleModal>
  )
}
