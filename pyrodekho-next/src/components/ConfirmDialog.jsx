"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// In-page confirmation popup that replaces the browser's window.confirm.
//
//   const { confirm, confirmDialog } = useConfirm();
//   ...
//   if (!(await confirm({ title: "Cancel order?", message: "...", confirmLabel: "Yes, cancel" }))) return;
//   ...
//   return (<>... {confirmDialog}</>);
//
// confirm() resolves true on the confirm button, false on Cancel, Escape or a
// click outside the box.
export function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setOptions(opts);
      }),
    [],
  );

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirmDialog = options && (
    <ConfirmDialog {...options} onConfirm={() => close(true)} onCancel={() => close(false)} />
  );

  return { confirm, confirmDialog };
}

function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  // Focus the safe choice, close on Escape, and stop the page scrolling behind
  useEffect(() => {
    cancelRef.current?.focus();

    const onKey = (e) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  return (
    <div className="cfm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="cfm-box" role="alertdialog" aria-modal="true" aria-labelledby="cfm-title">
        <h2 id="cfm-title" className="cfm-title">{title}</h2>
        {message && <p className="cfm-message">{message}</p>}

        <div className="cfm-actions">
          <button type="button" ref={cancelRef} className="cfm-btn cfm-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`cfm-btn ${danger ? "cfm-btn-danger" : "cfm-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
