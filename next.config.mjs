/** @type {import('next').NextConfig} */
export default {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "gemini-campus-guide.vercel.app",
          },
        ],
        destination: "https://geminiprompt.site/:path*",
        permanent: true,
      },
    ];
  },
};
