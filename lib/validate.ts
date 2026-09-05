// 응모 폼 검증. 클라이언트와 서버가 같은 규칙을 쓴다.
// (클라이언트 검증은 UX용일 뿐, 서버는 절대 신뢰하지 않고 다시 검사한다)

export const normalizePhone = (raw: string) => raw.replace(/[^0-9]/g, "");

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

export type EntryErrors = { name?: string; phone?: string; consent?: string };

export function validateEntry(input: {
  name: string;
  phone: string;
  consent: boolean;
}): EntryErrors {
  const e: EntryErrors = {};
  if (!isValidName(input.name)) e.name = "이름을 2자 이상 정확히 입력해 주세요.";
  if (!isValidPhone(input.phone))
    e.phone = "휴대폰 번호를 정확히 입력해 주세요. 예) 010-1234-5678";
  if (!input.consent) e.consent = "개인정보 수집·이용에 동의해야 응모할 수 있습니다.";
  return e;
}

export const hasErrors = (e: EntryErrors) => Object.keys(e).length > 0;
