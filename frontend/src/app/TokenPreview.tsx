const colors = [
  'bg',
  'surface',
  'surface-muted',
  'text',
  'text-muted',
  'text-subtle',
  'border',
  'divider',
  'tabbar-border',
  'accent',
  'accent-hover',
  'accent-soft',
  'booked',
  'booked-bg',
  'pending',
  'pending-bg',
  'pending-border',
  'free',
  'counter',
  'pending-dot',
  'error',
  'chevron',
  'segment',
  'segment-text',
  'avatar-warm',
];
export function TokenPreview() {
  return (
    <main className="p-4 flex flex-col gap-4">
      <h1>Расписание</h1>
      <div className="flex flex-wrap gap-4">
        {colors.map((color) => (
          <div key={color}>
            <div
              style={{
                background: `var(--color-${color})`,
                width: 80,
                height: 44,
              }}
            />
            <code>{color}</code>
          </div>
        ))}
      </div>
      {[400, 500, 600, 700].map((weight) => (
        <p key={weight} style={{ fontWeight: weight }}>
          Inter {weight} · Среда, 11 ноября
        </p>
      ))}
      {[700, 800].map((weight) => (
        <p key={weight} className="font-heading" style={{ fontWeight: weight }}>
          Manrope {weight} · Расписание
        </p>
      ))}
    </main>
  );
}
