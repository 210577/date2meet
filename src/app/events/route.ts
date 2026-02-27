import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kstDateFromYMD } from "@/lib/kstDate";

function makeSlug(len = 8) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { title, startYMD, endYMD } = body as {
        title: string;
        startYMD: string; // "YYYY-MM-DD"
        endYMD: string;
    };

    if (!title || !startYMD || !endYMD) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const startDate = kstDateFromYMD(startYMD);
    const endDate = kstDateFromYMD(endYMD);

    if (endDate < startDate) {
        return NextResponse.json({ error: "End date must be >= start date" }, { status: 400 });
    }

    // Generate unique slug (retry a few times)
    for (let i = 0; i < 5; i++) {
        const slug = makeSlug();
        try {
            const event = await prisma.event.create({
                data: { slug, title, startDate, endDate },
                select: { slug: true },
            });
            return NextResponse.json(event, { status: 201 });
        } catch (e) {
            // slug collision: retry
        }
    }

    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
}
