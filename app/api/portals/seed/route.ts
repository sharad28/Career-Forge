import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_PORTALS } from "@/lib/portal-defaults";

export async function POST() {
  let seeded = 0;
  let skipped = 0;

  for (const portal of DEFAULT_PORTALS) {
    try {
      await prisma.portal.upsert({
        where: { name: portal.name },
        update: {},
        create: {
          name: portal.name,
          company: portal.company,
          url: portal.url,
          enabled: true,
          h1bFriendly: portal.h1bFriendly,
        },
      });
      seeded++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ seeded, skipped });
}
