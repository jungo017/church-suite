import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageAdapter } from "./types";

/**
 * S3 호환 저장소 어댑터 (스펙 §10·§14). SeaweedFS/MinIO/AWS S3 등.
 * SeaweedFS·MinIO 는 path-style 주소가 필요하므로 forcePathStyle=true.
 * 설정: STORAGE_ENDPOINT / STORAGE_BUCKET / STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY / STORAGE_REGION.
 */
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 환경 변수가 설정되지 않았습니다(STORAGE_DRIVER=s3).`);
  return v;
}

function isNotFound(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404;
}

export class S3Adapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicBase: string;

  constructor() {
    const endpoint = requireEnv("STORAGE_ENDPOINT").replace(/\/+$/, "");
    this.bucket = requireEnv("STORAGE_BUCKET");
    this.publicBase = `${endpoint}/${this.bucket}`;
    this.client = new S3Client({
      endpoint,
      region: process.env.STORAGE_REGION ?? "us-east-1",
      forcePathStyle: true, // SeaweedFS/MinIO
      credentials: {
        accessKeyId: requireEnv("STORAGE_ACCESS_KEY"),
        secretAccessKey: requireEnv("STORAGE_SECRET_KEY"),
      },
    });
  }

  async put(
    key: string,
    data: Buffer | Uint8Array,
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!res.Body) return null;
      return await res.Body.transformToByteArray();
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  url(key: string): string {
    // 공개 버킷용 path-style URL. 비공개는 다운로드 라우트(get 스트리밍) 또는 서명 URL 사용.
    return `${this.publicBase}/${key.replace(/^\/+/, "")}`;
  }
}
