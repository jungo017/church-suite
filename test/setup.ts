// .env 로드(APP_DATABASE_URL / DATABASE_URL / JWT_SECRET 등).
// CI 에서는 process.env 가 이미 설정되어 있으면 dotenv 가 덮어쓰지 않는다.
import "dotenv/config";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 로컬 스토리지 어댑터는 STORAGE_LOCAL_DIR 필수(기본 드라이버=local).
// 명시값이 없으면 테스트는 임시 디렉터리를 쓴다(개별 테스트가 override 가능).
process.env.STORAGE_LOCAL_DIR ||= join(tmpdir(), "church-suite-test-storage");
