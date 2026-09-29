"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

// Shrinks the photo on the phone before upload (WebP, small), so saving is quick on mobile data.
async function shrink(file: File, square: boolean): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxW = square ? 400 : 1200;
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (square) {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    sw = sh = side;
  }
  const scale = Math.min(1, maxW / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.82));
  if (!blob) return file;
  return new File([blob], `${square ? "logo" : "cover"}.webp`, { type: "image/webp" });
}

export function StorePictureField({
  name,
  label,
  hint,
  current,
  square,
  labels,
}: {
  name: "logo" | "cover";
  label: string;
  hint: string;
  current: string | null;
  square: boolean;
  labels: { choose: string; change: string; remove: string };
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(current);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const small = await shrink(file, square);
      const dt = new DataTransfer();
      dt.items.add(small);
      e.target.files = dt.files;
      setPreview(URL.createObjectURL(small));
      setRemoved(false);
    } catch {
      setPreview(URL.createObjectURL(file));
    } finally {
      setBusy(false);
    }
  }
  function remove() {
    if (input.current) input.current.value = "";
    setPreview(null);
    setRemoved(true);
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold">
      {label}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={`grid shrink-0 place-items-center overflow-hidden border-2 border-dashed border-line bg-surface-2 text-muted transition hover:border-accent ${square ? "h-20 w-20 rounded-2xl" : "h-20 w-28 rounded-2xl"}`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-normal text-muted">{hint}</span>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="chip h-9 hover:text-foreground">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {busy ? "…" : preview ? labels.change : labels.choose}
            </button>
            {preview && (
              <button type="button" onClick={remove} className="chip h-9 text-danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {labels.remove}
              </button>
            )}
          </div>
        </div>
      </div>
      <input ref={input} name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />
      {removed && <input type="hidden" name={`${name}_remove`} value="1" />}
    </div>
  );
}
