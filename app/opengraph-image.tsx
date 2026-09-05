import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "15분 만에 제미나이 정복하기 — 강원대 AI 마스터 챌린지";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#16181d",
          color: "#fff",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 30,
            fontWeight: 700,
            color: "#7cb0f5",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#1a73e8",
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            15
          </div>
          강원대 AI 마스터 챌린지
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -2,
          }}
        >
          <div style={{ display: "flex" }}>15분 만에</div>
          <div style={{ display: "flex" }}>제미나이 정복하기</div>
        </div>

        <div style={{ display: "flex", marginTop: 32, fontSize: 34, color: "#a8aeb8" }}>
          레포트 · 시험공부 · 발표에 바로 쓰는 실습
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          {["재학생 12개월 무료", "실습형", "수료 시 경품 응모"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 999,
                background: "#23262e",
                color: "#d5d9e0",
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
