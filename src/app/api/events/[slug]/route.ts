import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listYMDInclusive, ymdFromDateKST } from "@/lib/kstDate";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
    const { slug } = params;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            responses: {
                include: { selections: true },
            },
        },
    });

    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allDates = listYMDInclusive(event.startDate, event.endDate);

    // Aggregate counts + who selected each date
    const map: Record<string, { count: number; users: string[] }> = {};
    for (const ymd of allDates) map[ymd] = { count: 0, users: [] };

    for (const r of event.responses) {
        const picked = new Set(r.selections.map((s) => ymdFromDateKST(s.date)));
        for (const ymd of picked) {
            if (!map[ymd]) continue; // ignore out-of-range
            map[ymd].count += 1;
            map[ymd].users.push(r.userId);
        }
    }

    return NextResponse.json({
        event: {
            slug: event.slug,
            title: event.title,
            startYMD: ymdFromDateKST(event.startDate),
            endYMD: ymdFromDateKST(event.endDate),
            dates: allDates,
        },
        results: map,
    });
}
