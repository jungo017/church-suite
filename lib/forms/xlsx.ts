import "server-only";
import ExcelJS from "exceljs";
import { buildResponseRows } from "./aggregate";

/**
 * 설문 응답 xlsx 내보내기 (S.5 후속). exceljs 로 워크북 생성 → Buffer.
 * 데이터 행 구성은 CSV 와 동일(buildResponseRows 공유).
 * exceljs 가 무거우므로 별도 모듈 — 내보내기 라우트만 import(화면 번들 제외).
 */
export async function exportResponsesXlsx(
  churchId: string,
  formId: string,
): Promise<Buffer> {
  const { header, rows } = await buildResponseRows(churchId, formId);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("응답");

  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };
  for (const row of rows) ws.addRow(row);

  // 열 너비 자동(라벨 길이 기준, 상한)
  ws.columns.forEach((col, i) => {
    const maxLen = Math.max(
      String(header[i] ?? "").length,
      ...rows.map((r) => String(r[i] ?? "").length),
    );
    col.width = Math.min(Math.max(maxLen + 2, 8), 50);
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
