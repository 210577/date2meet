import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { kstDateFromYMD } from "@/lib/kstDate";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
    const { slug } = params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { userId, password, selectedYMDs } = body as {
        userId: string;
        password: string;
        selectedYMDs: string[];
    };

    if (!userId || !password || !Array.isArray(selectedYMDs)) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Find existing response for (eventId, userId)
    const existing = await prisma.response.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
        include: { selections: true },
    });

    if (!existing) {
        // Create new response
        const hash = await bcrypt.hash(password, 10);
        const created = await prisma.response.create({
            data: {
                eventId: event.id,
                userId,
                passwordHash: hash,
                selections: {
                    create: selectedYMDs.map((ymd) => ({ date: kstDateFromYMD(ymd) })),
                },
            },
            select: { id: true },
        });
        return NextResponse.json({ ok: true, created: true, responseId: created.id });
    }

    // Verify password for edits
    const ok = await bcrypt.compare(password, existing.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    // Overwrite: delete old selections, insert new
    await prisma.$transaction([
        prisma.responseSelection.deleteMany({ where: { responseId: existing.id } }),
        prisma.responseSelection.createMany({
            data: selectedYMDs.map((ymd) => ({
                responseId: existing.id,
                date: kstDateFromYMD(ymd),
            })),
            skipDuplicates: true,
        }),
    ]);

    return NextResponse.json({ ok: true, created: false });
}
