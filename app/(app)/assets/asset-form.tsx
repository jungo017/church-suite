import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
} from "@/lib/assets/constants";

type Opt = { id: string; name: string };
type AssetValues = {
  name: string;
  assetType: string;
  status: string;
  quantity: number;
  tag: string | null;
  categoryId: string | null;
  departmentId: string | null;
  locationId: string | null;
  acquiredAt: string | null;
  acquiredCost: string | null;
  note: string | null;
};

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";
const label = "flex flex-col gap-1 text-sm";

function Select({
  name,
  defaultValue,
  options,
  placeholder,
}: {
  name: string;
  defaultValue: string | null;
  options: Opt[];
  placeholder: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue ?? ""} className={input}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

// 자산 생성/편집 공용 폼 (서버 컴포넌트 + 서버 액션).
export function AssetForm({
  action,
  asset,
  departments,
  locations,
  categories,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  asset?: AssetValues | null;
  departments: Opt[];
  locations: Opt[];
  categories: Opt[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <label className={label}>
        이름 *
        <input name="name" required defaultValue={asset?.name ?? ""} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          종류
          <select name="assetType" defaultValue={asset?.assetType ?? "equipment"} className={input}>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          상태
          <select name="status" defaultValue={asset?.status ?? "in_use"} className={input}>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ASSET_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          수량
          <input name="quantity" type="number" min="0" defaultValue={asset?.quantity ?? 1} className={input} />
        </label>
        <label className={label}>
          자산 태그 (QR)
          <input name="tag" defaultValue={asset?.tag ?? ""} className={input} />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className={label}>
          품목
          <Select name="categoryId" defaultValue={asset?.categoryId ?? null} options={categories} placeholder="(없음)" />
        </label>
        <label className={label}>
          부서
          <Select name="departmentId" defaultValue={asset?.departmentId ?? null} options={departments} placeholder="(없음)" />
        </label>
        <label className={label}>
          장소
          <Select name="locationId" defaultValue={asset?.locationId ?? null} options={locations} placeholder="(없음)" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          취득일
          <input name="acquiredAt" type="date" defaultValue={asset?.acquiredAt ?? ""} className={input} />
        </label>
        <label className={label}>
          취득가액 (원)
          <input name="acquiredCost" type="number" step="0.01" min="0" defaultValue={asset?.acquiredCost ?? ""} className={input} />
        </label>
      </div>

      <label className={label}>
        비고
        <textarea name="note" rows={3} defaultValue={asset?.note ?? ""} className={input} />
      </label>

      <button
        type="submit"
        className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        {submitLabel}
      </button>
    </form>
  );
}
