import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
  aspect?: "square" | "video" | "wide";
}

const STORAGE_ORIGIN = "/api/storage/objects/";

function isStorageUrl(url: string): boolean {
  return url.startsWith(STORAGE_ORIGIN);
}

function objectPathFromUrl(url: string): string {
  return url.slice("/api/storage".length);
}

async function deleteStorageObject(url: string): Promise<void> {
  if (!isStorageUrl(url)) return;
  const objectPath = objectPathFromUrl(url);
  try {
    await fetch(`/api/storage${objectPath}`, { method: "DELETE" });
  } catch {
    // best-effort — don't block the user
  }
}

export function ImageUpload({ value, onChange, className, label, aspect = "video" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreview(value ?? "");
  }, [value]);

  const handleFile = async (file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload JPG, PNG, or WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5 MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const previousUrl = preview;

    setUploading(true);
    try {
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Failed to upload file");

      const url = `/api/storage${objectPath}`;
      onChange(url);
      setPreview(url);
      toast({ title: "Image uploaded successfully" });

      // Delete the old image after the new one is safely stored
      if (previousUrl) {
        deleteStorageObject(previousUrl);
      }
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
      setPreview(value ?? "");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const urlToDelete = preview;
    setPreview("");
    onChange("");
    if (urlToDelete) {
      deleteStorageObject(urlToDelete);
    }
  };

  const aspectClass = aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-[3/1]" : "aspect-video";

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group",
          preview ? aspectClass : "h-32",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <Upload className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm font-medium">Click to replace</p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Upload className="w-7 h-7" />
            <p className="text-sm font-medium">Click to upload image</p>
            <p className="text-xs">JPG, PNG or WebP · max 5 MB</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {preview && (
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
          onClick={handleRemove}
        >
          <X className="w-3 h-3" /> Remove image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
