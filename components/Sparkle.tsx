/**
 * 제미나이 스파클. AI가 개입하는 자리에만 쓴다 —
 * 눈썹 라벨, 콜아웃, 스크롤 종료 칩. 남용하면 의미를 잃는다.
 */
export function Sparkle({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 1.6l2.34 8.06L22 12l-7.66 2.34L12 22.4l-2.34-8.06L2 12l7.66-2.34z" />
    </svg>
  );
}
