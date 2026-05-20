import type { Asset } from "@clear-position/shared";
import { AssetLibrary } from "../AssetLibrary";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { ColorField, issueFor } from "./fields";

interface BackgroundControlsProps {
  props: {
    background_color?: string;
    background_image_asset_id?: string;
    background_size?: "cover" | "contain";
    background_position?: "center" | "top" | "bottom" | "left" | "right";
  };
  usedAssetIds?: Set<string>;
  validationIssues?: ValidationIssue[];
  onAssetDeleted?: (assetId: string) => void;
  onChange: (patch: SectionPropsPatch) => void;
}

export function BackgroundControls({
  props,
  usedAssetIds = new Set(),
  validationIssues = [],
  onAssetDeleted,
  onChange,
}: BackgroundControlsProps) {
  const backgroundColorError = issueFor(validationIssues, "background_color");

  function assignAsset(asset: Asset) {
    onChange({ background_image_asset_id: asset.id });
  }

  return (
    <div className="background-controls">
      <ColorField
        label="Background color"
        value={props.background_color ?? "#f6f7f3"}
        error={backgroundColorError}
        onChange={(background_color) => onChange({ background_color })}
      />
      <AssetLibrary
        selectedAssetId={props.background_image_asset_id}
        usedAssetIds={usedAssetIds}
        onSelect={assignAsset}
        onClear={() => onChange({ background_image_asset_id: undefined })}
        onDeleted={(assetId) => {
          if (props.background_image_asset_id === assetId) {
            onChange({ background_image_asset_id: undefined });
          }
          onAssetDeleted?.(assetId);
        }}
      />
      <label>
        Background size
        <select
          value={props.background_size ?? "cover"}
          onChange={(event) => onChange({ background_size: event.target.value })}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>
      </label>
      <label>
        Background position
        <select
          value={props.background_position ?? "center"}
          onChange={(event) => onChange({ background_position: event.target.value })}
        >
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  );
}
