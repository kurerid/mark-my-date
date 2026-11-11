import { useEffect, useRef, type ReactNode } from 'react';
import { backButton } from '@tma.js/sdk';
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    const supported = backButton.isMounted();
    if (supported) backButton.show();
    const off = supported
      ? backButton.onClick(() => close.current())
      : undefined;
    return () => {
      off?.();
      if (supported) backButton.hide();
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.clientY < rect.top ||
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY > rect.bottom
        )
          onClose();
      }}
      className="bottom-sheet"
    >
      <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-free" />
      <h2 className="mb-4">{title}</h2>
      {children}
    </dialog>
  );
}
