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
      <label className="border-border block cursor-pointer rounded-md border border-dashed px-4 py-6 text-center text-sm">
        {uploading ? "Uploading..." : "Upload your transfer receipt"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
