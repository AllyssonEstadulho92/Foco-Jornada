import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkHoursEntry, WorkHoursEntryInput } from '../../domain/work-hours/WorkHours'

interface WorkHoursState {
  entries: WorkHoursEntry[]
  add: (input: WorkHoursEntryInput) => WorkHoursEntry
  update: (id: string, input: WorkHoursEntryInput) => void
  remove: (id: string) => void
  clearMonth: (monthKey: string) => void
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `work-hours-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useWorkHoursStore = create<WorkHoursState>()(
  persist(
    (set) => ({
      entries: [],
      add: (input) => {
        const entry: WorkHoursEntry = {
          ...input,
          id: createId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          // A calculadora representa o apuramento diário completo (inclui vários segmentos
          // da jornada). Guardar novamente a mesma data substitui o apuramento anterior,
          // impedindo que o resumo mensal conte o mesmo dia duas vezes.
          entries: [entry, ...state.entries.filter((item) => item.date !== input.date)].slice(0, 500),
        }))
        return entry
      },
      update: (id, input) =>
        set((state) => ({
          entries: state.entries
            .filter((item) => item.id === id || item.date !== input.date)
            .map((item) =>
              item.id === id
                ? {
                    ...input,
                    id: item.id,
                    createdAt: item.createdAt,
                  }
                : item,
            ),
        })),
      remove: (id) => set((state) => ({ entries: state.entries.filter((item) => item.id !== id) })),
      clearMonth: (monthKey) =>
        set((state) => ({ entries: state.entries.filter((item) => !item.date.startsWith(monthKey)) })),
    }),
    {
      name: 'foco-jornada-work-hours-v1',
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
)
