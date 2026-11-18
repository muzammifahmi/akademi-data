"use client";

import React, { useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

interface SafeJoditEditorProps {
  value: string;
  config?: Record<string, any>;
  onBlur?: (newContent: string) => void;
  onChange?: (newContent: string) => void;
}

export default function SafeJoditEditor({
  value,
  config,
  onBlur,
  onChange,
}: SafeJoditEditorProps) {
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const stateRef = useRef({
    mountCounter: 0,
    mountedValue: value || "",
    latestValue: value || "",
  });

  // Jika value berubah dari luar (misal: pindah soal, pindah sub-bab, atau menerapkan template soal),
  // perbarui mountedValue dan naikkan mountCounter agar JoditEditor di-remount secara bersih
  if ((value || "") !== stateRef.current.latestValue) {
    stateRef.current.mountCounter += 1;
    stateRef.current.mountedValue = value || "";
    stateRef.current.latestValue = value || "";
  }

  const stableConfig = useMemo(() => {
    return {
      ...(config || {}),
      addNewLine: false,
      addNewLineOnDBLClick: false,
      saveSelectionOnBlur: false,
    };
  }, [config]);

  const handleEditorRef = useCallback((jodit: any) => {
    if (!jodit || !jodit.s) return;
    try {
      const proto = Object.getPrototypeOf(jodit.s);
      if (proto && !proto.__safeSelectionPatched) {
        proto.__safeSelectionPatched = true;
        const origNear = proto.setCursorNearWith;
        const origIn = proto.setCursorIn;
        const origSelect = proto.select;

        if (typeof origNear === "function") {
          proto.setCursorNearWith = function (node: any, inStart: any) {
            try {
              return origNear.call(this, node, inStart);
            } catch {
              return null;
            }
          };
        }

        if (typeof origIn === "function") {
          proto.setCursorIn = function (node: any, inStart: any) {
            try {
              return origIn.call(this, node, inStart);
            } catch {
              return this.area || null;
            }
          };
        }

        if (typeof origSelect === "function") {
          proto.select = function (node: any, inward: any) {
            try {
              return origSelect.call(this, node, inward);
            } catch {
              return this;
            }
          };
        }
      }
    } catch {
      // ignore prototype patch errors
    }
  }, []);

  const handleChange = useCallback((newContent: string) => {
    stateRef.current.latestValue = newContent || "";
    if (onChangeRef.current) {
      onChangeRef.current(newContent);
    }
  }, []);

  const handleBlur = useCallback((newContent: string) => {
    stateRef.current.latestValue = newContent || "";
    if (onBlurRef.current) {
      onBlurRef.current(newContent);
    }
  }, []);

  return (
    <JoditEditor
      key={`safe_jodit_${stateRef.current.mountCounter}`}
      editorRef={handleEditorRef}
      value={stateRef.current.mountedValue}
      config={stableConfig}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
