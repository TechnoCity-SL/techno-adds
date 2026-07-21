"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
const MAX_TITLE_LENGTH = 100;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vehicles: (
    <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM5 17H3v-4l2-5h11l3 5v4h-2M9 17h6" />
  ),
  property: (
    <path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z" />
  ),
  "techno-gadgets": (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
};
const DEFAULT_CATEGORY_ICON = (
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>
);

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
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col pb-28">
      <header className="bg-card sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Cancel and exit"
              className="hover:bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Link>
            <h1 className="text-primary text-lg font-bold">Post Ad</h1>
          </div>
          <span className="text-primary text-xs font-bold">
            Step {step + 1}/{STEPS.length}
          </span>
        </div>
        <div className="bg-accent h-1 w-full">
          <div
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex-1 px-4 py-5">
        {error ? (
          <p className="text-destructive mb-4 text-sm">{error}</p>
        ) : null}

        {step === 0 ? (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">Select Category</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {categories.map((c) => {
                  const active = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`bg-card flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center shadow-sm transition-all active:scale-95 ${
                        active
                          ? "border-primary bg-accent"
                          : "border-transparent"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {CATEGORY_ICONS[c.slug] ?? DEFAULT_CATEGORY_ICON}
                        </svg>
                      </div>
                      <span className="text-sm font-semibold">{c.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">Select City</h2>
              <div className="relative">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="bg-card border-border focus:border-primary focus:ring-primary/30 h-14 w-full appearance-none rounded-xl border pr-10 pl-12 text-sm focus:ring-1 focus:outline-none"
                >
                  <option value="">Choose your location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </section>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-6">
            <section className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
              <h3 className="text-primary text-xs font-bold tracking-widest uppercase">
                Basic Information
              </h3>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-semibold">
                  Ad Title
                </label>
                <input
                  id="title"
                  value={title}
                  maxLength={MAX_TITLE_LENGTH}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-muted border-border focus:border-primary focus:ring-primary/30 h-12 w-full rounded-xl border px-4 text-sm focus:ring-1 focus:outline-none"
                  placeholder="e.g. Toyota Aqua 2015"
                />
                <span className="text-muted-foreground self-end text-xs">
                  {title.length} / {MAX_TITLE_LENGTH}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Condition</label>
                <div className="flex gap-3">
                  {(["new", "used"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(c)}
                      className={`h-12 flex-1 rounded-xl border text-sm font-semibold capitalize transition-all ${
                        condition === c
                          ? "bg-accent border-primary text-accent-foreground"
                          : "border-border"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-xs font-semibold">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-muted border-border focus:border-primary focus:ring-primary/30 w-full rounded-xl border p-4 text-sm focus:ring-1 focus:outline-none"
                  placeholder="Describe your item..."
                />
              </div>
            </section>

            {selectedCategory && attributeDefs.length > 0 ? (
              <section className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
                <h3 className="text-primary text-xs font-bold tracking-widest uppercase">
                  {selectedCategory.nameEn} Specifics
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {attributeDefs.map((def) => (
                    <div key={def.id} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold">
                        {def.label}
                        {def.isRequired ? (
                          <span className="text-destructive"> *</span>
                        ) : null}
                      </label>
                      {def.type === "enum" && def.options ? (
                        <div className="relative">
                          <select
                            value={attributes[def.key] ?? ""}
                            onChange={(e) =>
                              setAttributes((prev) => ({
                                ...prev,
                                [def.key]: e.target.value,
                              }))
                            }
                            className="bg-muted border-border focus:border-primary focus:ring-primary/30 h-12 w-full appearance-none rounded-xl border px-4 pr-10 text-sm focus:ring-1 focus:outline-none"
                          >
                            <option value="">Select {def.label}</option>
                            {def.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
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
                          className="bg-muted border-border focus:border-primary focus:ring-primary/30 h-12 w-full rounded-xl border px-4 text-sm focus:ring-1 focus:outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
              <h3 className="text-primary text-xs font-bold tracking-widest uppercase">
                Pricing
              </h3>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="price" className="text-xs font-semibold">
                  Price (LKR)
                </label>
                <div className="relative">
                  <span className="text-primary absolute top-1/2 left-4 -translate-y-1/2 text-sm font-bold">
                    Rs.
                  </span>
                  <input
                    id="price"
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="bg-muted border-border focus:border-primary focus:ring-primary/30 h-12 w-full rounded-xl border py-4 pr-4 pl-12 text-base font-bold focus:ring-1 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <label className="bg-muted flex cursor-pointer items-center justify-between rounded-lg p-3">
                <div>
                  <span className="block text-sm font-semibold">
                    Negotiable
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    Open to offers from buyers
                  </span>
                </div>
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="bg-border peer-checked:bg-primary block h-6 w-11 rounded-full transition-colors" />
                  <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
            </section>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold">Add photos to your ad</h2>
              <p className="text-muted-foreground text-sm">
                Ads with high-quality photos get more responses. You can add up
                to {MAX_PHOTOS} photos.
              </p>
            </div>

            <label className="border-primary bg-accent/40 hover:bg-accent/70 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors active:scale-95">
              <div className="bg-primary text-primary-foreground mb-2 flex h-14 w-14 items-center justify-center rounded-full shadow-md">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span className="text-primary text-base font-bold">
                {uploading ? "Uploading..." : "Upload Photos"}
              </span>
              <span className="text-muted-foreground mt-1 text-xs">
                PNG, JPG up to 10MB
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                disabled={uploading || images.length >= MAX_PHOTOS}
                onChange={handlePhotoSelect}
              />
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img, i) => (
                <div
                  key={img.publicId}
                  className="border-border relative aspect-4/3 overflow-hidden rounded-xl border shadow-sm"
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  {i === 0 ? (
                    <span className="bg-primary text-primary-foreground absolute top-2 left-2 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase">
                      Main
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeImage(img.publicId)}
                    aria-label="Remove photo"
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {Array.from({
                length: Math.max(0, MAX_PHOTOS - images.length),
              }).map((_, i) => (
                <div
                  key={i}
                  className="border-border bg-muted flex aspect-4/3 items-center justify-center rounded-xl border-2 border-dotted"
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              ))}
            </div>

            <div className="bg-muted flex items-start gap-3 rounded-xl p-4">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p className="text-muted-foreground text-xs">
                Avoid photos with watermarks, contact details, or blurry content
                to ensure your ad gets approved quickly.
              </p>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-5">
            <div className="bg-accent flex items-center gap-3 rounded-xl p-4">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m22 4-10 10-3-3" />
                </svg>
              </div>
              <div>
                <h2 className="text-primary text-sm font-bold">
                  Almost there!
                </h2>
                <p className="text-muted-foreground text-xs">
                  Please review your ad details before posting.
                </p>
              </div>
            </div>

            {images.length > 0 ? (
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">Photos</h3>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-primary text-xs font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {images.map((img, i) => (
                    <div
                      key={img.publicId}
                      className="border-border bg-muted relative h-28 w-36 shrink-0 overflow-hidden rounded-xl border"
                    >
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                      {i === 0 ? (
                        <span className="bg-primary text-primary-foreground absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                          Main
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Category &amp; Location
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-primary text-xs font-semibold"
                >
                  Edit
                </button>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Category</p>
                <p className="text-sm">{selectedCategory?.nameEn}</p>
              </div>
              <div className="bg-border h-px" />
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="text-sm">{selectedLocation?.name}</p>
              </div>
            </section>

            <section className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Ad Details
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-primary text-xs font-semibold"
                >
                  Edit
                </button>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Title</p>
                <p className="text-base font-bold">{title}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Price</p>
                <p className="text-primary text-lg font-bold">
                  Rs. {Number(price || 0).toLocaleString()}
                  {isNegotiable ? (
                    <span className="text-muted-foreground text-xs font-normal">
                      {" "}
                      (negotiable)
                    </span>
                  ) : null}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Description</p>
                <p className="text-sm whitespace-pre-wrap">{description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Condition</p>
                  <p className="text-sm capitalize">{condition}</p>
                </div>
                {attributeDefs
                  .filter((def) => attributes[def.key])
                  .map((def) => (
                    <div key={def.id}>
                      <p className="text-muted-foreground text-xs">
                        {def.label}
                      </p>
                      <p className="text-sm">{attributes[def.key]}</p>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <div className="border-border bg-card fixed right-0 bottom-0 left-0 border-t px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="border-border h-14 flex-1 rounded-xl border text-sm font-semibold transition-transform active:scale-95"
            >
              Back
            </button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canProceedFromStep(step)}
              onClick={() => setStep((s) => s + 1)}
              className="bg-primary text-primary-foreground h-14 flex-[2] rounded-xl text-sm font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground shadow-primary/20 h-14 flex-[2] rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Your Ad Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
