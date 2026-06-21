import { GENDERS, GENDER_LABELS, MEMBER_STATUSES, MEMBER_STATUS_LABELS } from "@/lib/members/constants";

type Opt = { id: string; name: string };
type MemberValues = {
  name: string;
  gender: string | null;
  birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  position: string | null;
  departmentId: string | null;
  familyId: string | null;
  registeredDate: string | null;
  status: string;
};

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";
const label = "flex flex-col gap-1 text-sm";

function Select({ name, defaultValue, options, placeholder }: { name: string; defaultValue: string | null; options: Opt[]; placeholder: string }) {
  return (
    <select name={name} defaultValue={defaultValue ?? ""} className={input}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}

export function MemberForm({
  action,
  member,
  departments,
  families,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  member?: MemberValues | null;
  departments: Opt[];
  families: Opt[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <label className={label}>
        이름 *
        <input name="name" required defaultValue={member?.name ?? ""} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          성별
          <select name="gender" defaultValue={member?.gender ?? ""} className={input}>
            <option value="">(선택)</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{GENDER_LABELS[g]}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          생년월일
          <input name="birth" type="date" defaultValue={member?.birth ?? ""} className={input} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          연락처
          <input name="phone" defaultValue={member?.phone ?? ""} className={input} />
        </label>
        <label className={label}>
          이메일
          <input name="email" type="email" defaultValue={member?.email ?? ""} className={input} />
        </label>
      </div>

      <label className={label}>
        주소
        <input name="address" defaultValue={member?.address ?? ""} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          직분
          <input name="position" defaultValue={member?.position ?? ""} placeholder="예: 집사, 권사, 장로" className={input} />
        </label>
        <label className={label}>
          상태
          <select name="status" defaultValue={member?.status ?? "active"} className={input}>
            {MEMBER_STATUSES.map((s) => (
              <option key={s} value={s}>{MEMBER_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          구역/부서
          <Select name="departmentId" defaultValue={member?.departmentId ?? null} options={departments} placeholder="(없음)" />
        </label>
        <label className={label}>
          가족
          <Select name="familyId" defaultValue={member?.familyId ?? null} options={families} placeholder="(없음)" />
        </label>
      </div>

      <label className={label}>
        등록일
        <input name="registeredDate" type="date" defaultValue={member?.registeredDate ?? ""} className={input} />
      </label>

      <button type="submit" className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
        {submitLabel}
      </button>
    </form>
  );
}
