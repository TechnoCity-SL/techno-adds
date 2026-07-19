"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  icon: string | null;
}

interface Location {
  id: string;
  slug: string;
  name: string;
}

interface AttributeDef {
  id: string;
  key: string;
  label: string;
  type: string;
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
}

interface UploadedImage {
  publicId: string;
  url: string;
}

const STEPS = ["Category & Location", "Details", "Photos", "Review"] as const;
const MAX_PHOTOS = 5;

export function PostAdWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [attributeDefs, setAttributeDefs] = useState<AttributeDef[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? []));
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setAttributeDefs([]);
      return;
    }
    setAttributes({});
    fetch(`/api/categories/${categoryId}/attributes`)
      .then((r) => r.json())
      .then((d) => setAttributeDefs(d.attributes ?? []));
  }, [categoryId]);

  async function handlePhotoSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        if (images.length >= MAX_PHOTOS) break;

        const signResponse = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "ads" }),
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
          {
            method: "POST",
            body: formData,
          },
        );
        if (!uploadResponse.ok) throw new Error("Photo upload failed");
        const uploaded = await uploadResponse.json();
        setImages((prev) => [
          ...prev,
          { publicId: uploaded.public_id, url: uploaded.secure_url },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(publicId: string) {
    setImages((prev) => prev.filter((img) => img.publicId !== publicId));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          locationId,
          title,
          description,
          price: Number(price),
          isNegotiable,
          condition,
          attributes,
          images: images.map((img) => img.publicId),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : (data.issues?.join(", ") ?? "Failed to post ad.");
        setError(message);
        return;
      }
      router.push(`/post-ad/success?id=${data.id}`);
    } catch {
      setError("Failed to post ad. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedLocation = locations.find((l) => l.id === locationId);

  function canProceedFromStep(current: number): boolean {
    if (current === 0) return Boolean(categoryId && locationId);
    if (current === 1) {
      if (!title || !description || !price) return false;
      return attributeDefs.every(
        (def) => !def.isRequired || Boolean(attributes[def.key]),
      );
    }
    return true;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col pb-24">
      <div className="border-border bg-background sticky top-0 z-10 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <div className="flex-1 px-4 py-4">
        {error ? (
          <p className="text-destructive mb-4 text-sm">{error}</p>
        ) : null}

        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Category
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="border-border rounded-md border px-3 py-3 text-base"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Location
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="border-border rounded-md border px-3 py-3 text-base"
              >
                <option value="">Select a location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-border rounded-md border px-3 py-3 text-base"
                placeholder="e.g. Toyota Aqua 2015"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="border-border rounded-md border px-3 py-3 text-base"
                placeholder="Describe your item..."
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Price (Rs.)
              <input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="border-border rounded-md border px-3 py-3 text-base"
                placeholder="0"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="h-5 w-5"
              />
              Price is negotiable
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Condition
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as "new" | "used")}
                className="border-border rounded-md border px-3 py-3 text-base"
              >
                <option value="used">Used</option>
                <option value="new">New</option>
              </select>
            </label>

            {selectedCategory && attributeDefs.length > 0 ? (
              <div className="border-border flex flex-col gap-4 border-t pt-4">
                <p className="text-sm font-semibold">
                  {selectedCategory.nameEn} details
                </p>
                {attributeDefs.map((def) => (
                  <label
                    key={def.id}
                    className="flex flex-col gap-1.5 text-sm font-medium"
                  >
                    {def.label}
                    {def.isRequired ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                    {def.type === "enum" && def.options ? (
                      <select
                        value={attributes[def.key] ?? ""}
                        onChange={(e) =>
                          setAttributes((prev) => ({
                            ...prev,
                            [def.key]: e.target.value,
                          }))
                        }
                        className="border-border rounded-md border px-3 py-3 text-base"
                      >
                        <option value="">Select {def.label}</option>
                        {def.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        inputMode={def.type === "number" ? "numeric" : "text"}
                        value={attributes[def.key] ?? ""}
                        onChange={(e) =>
                          setAttributes((prev) => ({
                            ...prev,
                            [def.key]: e.target.value,
                          }))
                        }
                        className="border-border rounded-md border px-3 py-3 text-base"
                      />
                    )}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Add up to {MAX_PHOTOS} photos.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <div
                  key={img.publicId}
                  className="border-border relative aspect-square overflow-hidden rounded-md border"
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.publicId)}
                    className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < MAX_PHOTOS ? (
                <label className="border-border text-muted-foreground flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-xs">
                  {uploading ? "Uploading..." : "+ Add photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={uploading}
                    onChange={handlePhotoSelect}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-semibold">Category:</span>{" "}
              {selectedCategory?.nameEn}
            </p>
            <p>
              <span className="font-semibold">Location:</span>{" "}
              {selectedLocation?.name}
            </p>
            <p>
              <span className="font-semibold">Title:</span> {title}
            </p>
            <p>
              <span className="font-semibold">Description:</span> {description}
            </p>
            <p>
              <span className="font-semibold">Price:</span> Rs. {price}{" "}
              {isNegotiable ? "(negotiable)" : ""}
            </p>
            <p>
              <span className="font-semibold">Condition:</span> {condition}
            </p>
            {attributeDefs.map((def) =>
              attributes[def.key] ? (
                <p key={def.id}>
                  <span className="font-semibold">{def.label}:</span>{" "}
                  {attributes[def.key]}
                </p>
              ) : null,
            )}
            <p>
              <span className="font-semibold">Photos:</span> {images.length}
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-border bg-background fixed right-0 bottom-0 left-0 flex gap-3 border-t px-4 py-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="border-border flex-1 rounded-md border px-4 py-3 text-sm font-medium"
          >
            Back
          </button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canProceedFromStep(step)}
            onClick={() => setStep((s) => s + 1)}
            className="bg-primary text-primary-foreground flex-1 rounded-md px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground flex-1 rounded-md px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Ad"}
          </button>
        )}
      </div>
    </div>
  );
}
