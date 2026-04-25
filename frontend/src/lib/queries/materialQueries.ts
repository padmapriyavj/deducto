import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteMaterial, listMaterials, uploadMaterial } from '@/lib/api/materialsApi'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'

export function useMaterialsQuery(courseId: number) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: queryKeys.courseMaterials(courseId),
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return listMaterials(token, courseId)
    },
    enabled: !!token && courseId > 0,
  })
}

export function useUploadMaterialMutation(courseId: number) {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, lessonId }: { file: File; lessonId?: number }) => {
      if (!token) throw new Error('Not authenticated')
      return uploadMaterial(token, courseId, file, lessonId)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courseMaterials(courseId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.courseLessons(courseId) })
      if (variables.lessonId != null && variables.lessonId > 0) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.lesson(variables.lessonId) })
      }
    },
  })
}

export function useDeleteMaterialMutation(courseId: number) {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: number) => {
      if (!token) throw new Error('Not authenticated')
      return deleteMaterial(token, materialId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courseMaterials(courseId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.courseLessons(courseId) })
    },
  })
}
