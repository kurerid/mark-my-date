import {
  settingsPatch,
  settingsSchema,
  type Settings,
  type SettingsPatch,
} from './schemas';
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

export function changedSettings(
  current: Settings,
  patch: SettingsPatch,
): SettingsPatch {
  const diff = (before: unknown, next: unknown): unknown => {
    if (JSON.stringify(before) === JSON.stringify(next)) return undefined;
    if (next && typeof next === 'object' && !Array.isArray(next))
      return Object.fromEntries(
        Object.entries(next).flatMap(([key, value]) => {
          const changed = diff(
            before && typeof before === 'object'
              ? (before as Record<string, unknown>)[key]
              : undefined,
            value,
          );
          return changed === undefined ||
            (typeof changed === 'object' &&
              changed !== null &&
              !Array.isArray(changed) &&
              Object.keys(changed).length === 0)
            ? []
            : [[key, changed]];
        }),
      );
    return next;
  };
  return settingsPatch.parse(diff(current, patch) ?? {});
}
