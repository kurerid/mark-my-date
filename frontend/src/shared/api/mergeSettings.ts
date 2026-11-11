import { settingsSchema, type Settings, type SettingsPatch } from './schemas';
export function mergeSettings(
  current: Settings,
  patch: SettingsPatch,
): Settings {
  return settingsSchema.parse({
    ...current,
    ...patch,
    schedule: {
      ...current.schedule,
      ...patch.schedule,
      workHours: {
        ...current.schedule.workHours,
        ...patch.schedule?.workHours,
      },
    },
    slotConfirmation: {
      ...current.slotConfirmation,
      ...patch.slotConfirmation,
    },
    customerNotification: {
      ...current.customerNotification,
      ...patch.customerNotification,
      dayBefore: {
        ...current.customerNotification.dayBefore,
        ...patch.customerNotification?.dayBefore,
      },
      sameDay: {
        ...current.customerNotification.sameDay,
        ...patch.customerNotification?.sameDay,
      },
    },
    personalNotification: {
      ...current.personalNotification,
      ...patch.personalNotification,
    },
  });
}
