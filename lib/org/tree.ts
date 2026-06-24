export type DepartmentLike = {
  departmentId: string;
  parentId: string | null;
  name: string;
};

export type DepartmentTreeRow = DepartmentLike & {
  depth: number;
  label: string;
};

export function departmentTreeRows(
  departments: DepartmentLike[],
): DepartmentTreeRow[] {
  const children = new Map<string | null, DepartmentLike[]>();
  for (const dept of departments) {
    const parentId = dept.parentId ?? null;
    children.set(parentId, [...(children.get(parentId) ?? []), dept]);
  }

  for (const list of children.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }

  const rows: DepartmentTreeRow[] = [];
  const visited = new Set<string>();

  function walk(parentId: string | null, depth: number) {
    for (const dept of children.get(parentId) ?? []) {
      if (visited.has(dept.departmentId)) continue;
      visited.add(dept.departmentId);
      rows.push({
        ...dept,
        depth,
        label: `${"— ".repeat(depth)}${dept.name}`,
      });
      walk(dept.departmentId, depth + 1);
    }
  }

  walk(null, 0);

  // 깨진 parentId 또는 순환 데이터가 있어도 화면에서 사라지지 않게 뒤에 붙인다.
  for (const dept of departments) {
    if (!visited.has(dept.departmentId)) {
      rows.push({ ...dept, depth: 0, label: dept.name });
    }
  }

  return rows;
}
