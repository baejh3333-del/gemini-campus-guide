// 응모 폼 검증. 클라이언트와 서버가 같은 규칙을 쓴다.
// (클라이언트 검증은 UX용일 뿐, 서버는 절대 신뢰하지 않고 다시 검사한다)

export const normalizePhone = (raw: string) => raw.replace(/[^0-9]/g, "");

/**
 * 입력하는 대로 010-1234-5678 모양으로. 10자리 옛 번호(011-234-5678)만 3-3-4.
 * 010 은 항상 11자리라, 10번째 숫자에서 모양이 3-3-4 로 튀었다 돌아오지 않게 뺀다.
 */
export function formatPhone(raw: string): string {
  const d = normalizePhone(raw).slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10 && !d.startsWith("010")) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// 숫자와 구분기호 외의 글자가 섞이면 오타다. 그냥 걸러내면
// "010-1234-567a" 가 조용히 다른 유효 번호(010-123-4567)로 바뀌어
// 경품 안내가 엉뚱한 사람에게 간다. 그래서 모양부터 먼저 본다.
const PHONE_SHAPE = /^[0-9\s()+-]+$/;

/** 010-1234-5678 / 01012345678 / 010 1234 5678 모두 허용 */
export const isValidPhone = (raw: string) =>
  PHONE_SHAPE.test(raw.trim()) && /^01[016789]\d{7,8}$/.test(normalizePhone(raw));

export const isValidName = (raw: string) => {
  const n = raw.trim();
  return n.length >= 2 && n.length <= 20;
};

// 가입 화면 캡처. 클라이언트가 캔버스로 줄여 JPEG data URL 로 보낸다.
// Vercel 요청 본문 한도(4.5MB) 안에 넉넉히 들도록 base64 기준 3MB 로 자른다.
export const MAX_IMAGE_CHARS = 3_000_000;
export const isValidImage = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length <= MAX_IMAGE_CHARS &&
  // /9j/ = JPEG 매직넘버(FF D8 FF). 이름만 JPEG 인 다른 파일을 막는다.
  /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+=*$/.test(v);

export type EntryErrors = {
  name?: string;
  phone?: string;
  image?: string;
  consent?: string;
};

export function validateEntry(input: {
  name: string;
  phone: string;
  image: unknown;
  consent: boolean;
}): EntryErrors {
  const e: EntryErrors = {};
  if (!isValidName(input.name)) e.name = "이름을 2자 이상 정확히 입력해 주세요.";
  if (!isValidPhone(input.phone))
    e.phone = "휴대폰 번호를 정확히 입력해 주세요. 예) 010-1234-5678";
  if (!isValidImage(input.image))
    e.image = "Google AI Plus 가입 화면 캡처를 첨부해 주세요.";
  if (!input.consent) e.consent = "개인정보 수집·이용에 동의해야 응모할 수 있습니다.";
  return e;
}

export const hasErrors = (e: EntryErrors) => Object.keys(e).length > 0;
