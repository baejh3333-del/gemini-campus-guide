import { ImageResponse } from "next/og";

export async function GET(
  _req: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size: rawSize } = await context.params;
  const size = rawSize === "512" ? 512 : 192;
  const radius = Math.round(size * 0.22);
  const iconSize = Math.round(size * 0.68);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c1322",
          borderRadius: `${radius}px`,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 32 32"
          fill="none"
        >
          <path
            d="M7 15v7c4.8 3.5 13.2 3.5 18 0v-7"
            fill="#1a73e8"
            fillOpacity="0.24"
            stroke="#8ab4f8"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="m3 12 13-6 13 6-13 6-13-6Z"
            fill="#a8c7fa"
            stroke="#c2e7ff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M29 12v10m-1.5 3 1.5-3 1.5 3"
            stroke="#8ab4f8"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
