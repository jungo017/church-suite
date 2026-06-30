// 저장소 추상화 (스펙 §10). 앱은 이 인터페이스로만 파일에 접근(백엔드 교체 자유).

export interface StorageAdapter {
  put(key: string, data: Buffer | Uint8Array, contentType?: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  url(key: string): string;
}

/** 교회별 프리픽스 키 (스펙 §10: church-{id}/...). */
export function churchPrefix(churchId: string, path: string): string {
  return `church-${churchId}/${path.replace(/^\/+/, "")}`;
}
