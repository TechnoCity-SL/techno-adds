"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export function BankTransferUpload({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "bank-transfer-proofs" }),
      });
      if (!signResponse.ok) throw new Error("Could not get upload signature");
      const sign = await signResponse.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sign.apiKey);
      formData.append("timestamp", String(sign.timestamp));
      formData.append("signature", sign.signature);
      formData.append("folder", sign.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!uploadResponse.ok) throw new Error("Receipt upload failed");
      const uploaded = await uploadResponse.json();

      const submitResponse = await fetch(
        `/api/orders/${orderId}/bank-transfer-proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cloudinaryPublicId: uploaded.public_id }),
        },
      );
      const submitData = await submitResponse.json();
      if (!submitResponse.ok) {
        throw new Error(
          typeof submitData.error === "string"
            ? submitData.error
            : "Failed to submit receipt",
        );
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <label className="border-border hover:border-primary hover:bg-accent/40 group flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground group-hover:text-primary mb-2 transition-colors"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <p className="text-sm font-semibold">
          {uploading ? "Uploading..." : "Upload Transfer Receipt"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          JPG or PNG (Max 5MB)
        </p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
    </div>
  );
}
