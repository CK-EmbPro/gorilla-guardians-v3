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
  folder?: string;
}

// Computed once at module load — empty string in local dev when VITE_API_URL is unset.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

// Relative paths (e.g. /api/uploads/xxx from local disk storage) must be
// made absolute so <img> loads from the API server, not the Vite dev server.
function resolveUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("/") ? `${API_BASE}${url}` : url;
}

export function ImageUpload({ value, onChange, className, label, aspect = "video", folder = "general" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(resolveUrl(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreview(resolveUrl(value ?? ""));
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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/upload?folder=${encodeURIComponent(folder)}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
      setPreview(resolveUrl(url));
      toast({ title: "Image uploaded successfully" });
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
      setPreview(resolveUrl(value ?? ""));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    onChange("");
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
