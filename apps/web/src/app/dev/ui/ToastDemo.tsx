"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

const courses = ["MA 1024", "CS 2022", "PH 1110"];

export function ToastDemo() {
  const [removed, setRemoved] = useState<string | null>(null);
  const [note, setNote] = useState("Nothing removed yet.");

  return (
    <>
      {courses.map((code) => (
        <Button
          key={code}
          variant="secondary"
          size="md"
          onClick={() => {
            setRemoved(code);
            setNote(`${code} removed.`);
          }}
        >
          Remove {code}
        </Button>
      ))}
      <p className="text-10 leading-14-5 text-ink-muted">{note}</p>
      <Toast
        message={removed && `Removed ${removed}`}
        action={{
          label: "Undo",
          onAction: () => {
            setNote(`${removed} is back.`);
            setRemoved(null);
          },
        }}
        onDismiss={() => {
          setNote(`The toast for ${removed} timed out.`);
          setRemoved(null);
        }}
      />
    </>
  );
}
