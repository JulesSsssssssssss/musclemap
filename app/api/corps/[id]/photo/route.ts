import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Sert la photo d'un relevé corporel — uniquement à son propriétaire. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const entry = await prisma.bodyEntry.findFirst({
    where: { id, userId: user.id, photo: { not: null } },
    select: { photo: true, photoType: true },
  });
  if (!entry?.photo) return new Response("Introuvable", { status: 404 });

  return new Response(new Uint8Array(entry.photo), {
    headers: {
      "Content-Type": entry.photoType ?? "image/jpeg",
      // Une photo ne change jamais : le navigateur peut la garder, mais elle reste privée.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
