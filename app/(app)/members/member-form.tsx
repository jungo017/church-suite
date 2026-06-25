import { GENDERS, GENDER_LABELS, MEMBER_STATUSES, MEMBER_STATUS_LABELS } from "@/lib/members/constants";
import { Field, FieldLabel, Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";

type Opt = { id: string; name: string };
type MemberValues = {
  name: string;
  gender: string | null;
  birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  position: string | null; // 레거시 텍스트(positionId 없을 때 표시 대체)
  positionId: string | null;
  departmentId: string | null;
  familyId: string | null;
  registeredDate: string | null;
  status: string;
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

export function MemberForm({
  action,
  member,
  departments,
  families,
  positions,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  member?: MemberValues | null;
  departments: Opt[];
  families: Opt[];
  positions: Opt[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="name" required>이름</FieldLabel>
        <Input id="name" name="name" required defaultValue={member?.name ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="gender">성별</FieldLabel>
          <Select id="gender" name="gender" defaultValue={member?.gender ?? ""}>
            <option value="">(선택)</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{GENDER_LABELS[g]}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="birth">생년월일</FieldLabel>
          <Input id="birth" name="birth" type="date" defaultValue={member?.birth ?? ""} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="phone">연락처</FieldLabel>
          <Input id="phone" name="phone" defaultValue={member?.phone ?? ""} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <Input id="email" name="email" type="email" defaultValue={member?.email ?? ""} />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="address">주소</FieldLabel>
        <Input id="address" name="address" defaultValue={member?.address ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="positionId">직분</FieldLabel>
          <OptSelect id="positionId" name="positionId" defaultValue={member?.positionId ?? null} options={positions} placeholder="(없음)" />
        </Field>
        <Field>
          <FieldLabel htmlFor="status">상태</FieldLabel>
          <Select id="status" name="status" defaultValue={member?.status ?? "active"}>
            {MEMBER_STATUSES.map((s) => (
              <option key={s} value={s}>{MEMBER_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="departmentId">구역/부서</FieldLabel>
          <OptSelect id="departmentId" name="departmentId" defaultValue={member?.departmentId ?? null} options={departments} placeholder="(없음)" />
        </Field>
        <Field>
          <FieldLabel htmlFor="familyId">가족</FieldLabel>
          <OptSelect id="familyId" name="familyId" defaultValue={member?.familyId ?? null} options={families} placeholder="(없음)" />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="registeredDate">등록일</FieldLabel>
        <Input id="registeredDate" name="registeredDate" type="date" defaultValue={member?.registeredDate ?? ""} />
      </Field>

      <Button type="submit" className="w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
