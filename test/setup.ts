// .env 로드(APP_DATABASE_URL / DATABASE_URL / JWT_SECRET 등).
// CI 에서는 process.env 가 이미 설정되어 있으면 dotenv 가 덮어쓰지 않는다.
import "dotenv/config";
