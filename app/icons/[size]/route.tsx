import { ImageResponse } from "next/og";

const SIZES = [180, 192, 512];

/**
 * Icône de l'app générée à la volée (manifest et écran d'accueil iOS).
 * `?maskable=1` : le motif reste dans la zone sûre, Android peut rogner les bords.
 */
export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response("Introuvable", { status: 404 });

  const maskable = new URL(request.url).searchParams.has("maskable");
  const glyph = size * (maskable ? 0.42 : 0.56);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0A0B0A",
        }}
      >
        <div
          style={{
            width: size * (maskable ? 0.62 : 0.8), height: size * (maskable ? 0.62 : 0.8),
            borderRadius: size * (maskable ? 0.16 : 0.2), background: "#FF5B1E",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0A0B0A", fontSize: glyph, fontWeight: 800, letterSpacing: -glyph * 0.04,
          }}
        >
          M
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
