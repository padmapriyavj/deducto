import { apiFetch, apiFetchJson } from '@/lib/api/client'
import type { Material } from '@/lib/api/types/material'

export async function listMaterials(token: string, courseId: number): Promise<Material[]> {
  const res = await apiFetch(`/courses/${courseId}/materials`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`)
  return text ? (JSON.parse(text) as Material[]) : []
}

export async function uploadMaterial(
  token: string,
  courseId: number,
  file: File,
  lessonId?: number,
): Promise<Material> {
  const fd = new FormData()
  fd.append('file', file)
  const q = lessonId != null && Number.isFinite(lessonId) ? `?lesson_id=${lessonId}` : ''
  const res = await apiFetch(`/courses/${courseId}/materials${q}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`)
  return JSON.parse(text) as Material
}

export async function deleteMaterial(token: string, materialId: number): Promise<void> {
  const res = await apiFetch(`/materials/${materialId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
}

export async function getMaterial(token: string, materialId: number): Promise<Material> {
  return apiFetchJson<Material>(`/materials/${materialId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
