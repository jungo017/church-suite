import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
} from "@/lib/assets/constants";
import { Field, FieldLabel, Input, Select, Textarea } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";

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

function OptSelect({
  id,
  name,
  defaultValue,
  options,
  placeholder,
}: {
  id: string;
  name: string;
  defaultValue: string | null;
  options: Opt[];
  placeholder: string;
}) {
  return (
    <Select id={id} name={name} defaultValue={defaultValue ?? ""}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </Select>
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
      <Field>
        <FieldLabel htmlFor="name" required>이름</FieldLabel>
        <Input id="name" name="name" required defaultValue={asset?.name ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="assetType">종류</FieldLabel>
          <Select id="assetType" name="assetType" defaultValue={asset?.assetType ?? "equipment"}>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="status">상태</FieldLabel>
          <Select id="status" name="status" defaultValue={asset?.status ?? "in_use"}>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ASSET_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="quantity">수량</FieldLabel>
          <Input id="quantity" name="quantity" type="number" min="0" inputMode="numeric" defaultValue={asset?.quantity ?? 1} />
        </Field>
        <Field>
          <FieldLabel htmlFor="tag">자산 태그 (QR)</FieldLabel>
          <Input id="tag" name="tag" defaultValue={asset?.tag ?? ""} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field>
          <FieldLabel htmlFor="categoryId">품목</FieldLabel>
          <OptSelect id="categoryId" name="categoryId" defaultValue={asset?.categoryId ?? null} options={categories} placeholder="(없음)" />
        </Field>
        <Field>
          <FieldLabel htmlFor="departmentId">부서</FieldLabel>
          <OptSelect id="departmentId" name="departmentId" defaultValue={asset?.departmentId ?? null} options={departments} placeholder="(없음)" />
        </Field>
        <Field>
          <FieldLabel htmlFor="locationId">장소</FieldLabel>
          <OptSelect id="locationId" name="locationId" defaultValue={asset?.locationId ?? null} options={locations} placeholder="(없음)" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="acquiredAt">취득일</FieldLabel>
          <Input id="acquiredAt" name="acquiredAt" type="date" defaultValue={asset?.acquiredAt ?? ""} />
        </Field>
        <Field>
          <FieldLabel htmlFor="acquiredCost">취득가액 (원)</FieldLabel>
          <Input id="acquiredCost" name="acquiredCost" type="number" step="0.01" min="0" inputMode="numeric" defaultValue={asset?.acquiredCost ?? ""} />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="note">비고</FieldLabel>
        <Textarea id="note" name="note" rows={3} defaultValue={asset?.note ?? ""} />
      </Field>

      <Button type="submit" className="w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
