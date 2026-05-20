import type { ClipboardEvent } from "react";
import { useEffect, useState } from "react";
import type { Asset } from "@clear-position/shared";
import { deleteAsset, listAssets, updateAsset, uploadAsset } from "../api/client";

const maxUploadBytes = 5 * 1024 * 1024;

interface AssetLibraryProps {
  selectedAssetId?: string;
  usedAssetIds?: Set<string>;
  onSelect: (asset: Asset) => void;
  onClear: () => void;
  onDeleted?: (assetId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
}

export function AssetLibrary({
  selectedAssetId,
  usedAssetIds = new Set(),
  onSelect,
  onClear,
  onDeleted,
}: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  async function refreshAssets() {
    setIsLoading(true);
    setError(null);
    try {
      setAssets(await listAssets());
    } catch {
      setError("Assets could not be loaded. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshAssets();
  }, []);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Unsupported file type. Upload a PNG, JPG, WEBP, or GIF image.");
      return;
    }
    if (file.size > maxUploadBytes) {
      setError("Image is too large. Maximum size is 5 MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const asset = await uploadAsset(file, { alt_text: file.name.replace(/\.[^.]+$/, "") });
      setAssets((current) => [asset, ...current]);
      onSelect(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed. Please try a different image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    await handleFile(file);
  }

  async function saveAltText(asset: Asset, altText: string) {
    setAssets((current) => current.map((item) => (
      item.id === asset.id ? { ...item, alt_text: altText } : item
    )));
    await updateAsset(asset.id, { alt_text: altText }).catch(() => {
      setError("Alt text could not be saved. Please try again.");
    });
  }

  async function handleDelete(asset: Asset) {
    const isUsed = usedAssetIds.has(asset.id);
    if (isUsed && !window.confirm("This image is used on the current page. Delete it and clear those references?")) {
      return;
    }
    if (!isUsed && !window.confirm("Delete this image from the asset library?")) {
      return;
    }

    setDeletingAssetId(asset.id);
    setError(null);
    try {
      await deleteAsset(asset.id);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      if (selectedAssetId === asset.id) {
        onClear();
      }
      onDeleted?.(asset.id);
    } catch {
      setError("Image could not be deleted. Please try again.");
    } finally {
      setDeletingAssetId(null);
    }
  }

  return (
    <div className="asset-library" onPaste={(event) => void handlePaste(event)} tabIndex={0}>
      <div className="asset-library__header">
        <strong>Background image</strong>
        <button type="button" className="button" onClick={onClear} disabled={!selectedAssetId}>
          Clear
        </button>
      </div>
      <label className="asset-upload">
        Upload image
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
      </label>
      <p className="asset-library__hint">
        {isUploading ? "Uploading image..." : "Paste an image here to upload and assign it."}
      </p>
      {isLoading ? <p className="asset-library__hint">Loading assets...</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
      {!isLoading && assets.length === 0 ? (
        <p className="asset-library__empty">No images uploaded yet.</p>
      ) : null}
      <div className="asset-grid" aria-label="Asset library">
        {assets.map((asset) => (
          <article
            className={selectedAssetId === asset.id ? "asset-card asset-card--selected" : "asset-card"}
            key={asset.id}
          >
            <button
              type="button"
              className="asset-card__thumb"
              aria-pressed={selectedAssetId === asset.id}
              onClick={() => onSelect(asset)}
            >
              <img src={asset.url} alt={asset.alt_text || asset.original_filename} />
            </button>
            <div className="asset-card__meta">
              <strong>{asset.original_filename}</strong>
              <span>{asset.width ?? "?"}x{asset.height ?? "?"} · {formatBytes(asset.size_bytes)}</span>
              {!asset.alt_text.trim() ? <span className="asset-card__warning">Alt text is empty.</span> : null}
            </div>
            <label>
              Alt text
              <input
                aria-label={`Alt text for ${asset.original_filename}`}
                value={asset.alt_text}
                onChange={(event) => void saveAltText(asset, event.target.value)}
              />
            </label>
            <button
              type="button"
              className="asset-card__delete"
              disabled={deletingAssetId === asset.id}
              onClick={() => void handleDelete(asset)}
            >
              {deletingAssetId === asset.id ? "Deleting..." : "Delete"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
