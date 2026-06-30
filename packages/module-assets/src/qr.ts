import "server-only";
import QRCode from "qrcode";

/**
 * 자산 QR 라벨용 데이터 URL(PNG) 생성. (스펙 §7.1)
 * 스캔하면 자산 상세로 이동하도록 절대 URL 을 인코딩한다.
 */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 160 });
}

/** 호스트 기준 자산 상세 절대 URL. */
export function assetUrl(host: string, assetId: string): string {
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${proto}://${host}/assets/${assetId}`;
}
