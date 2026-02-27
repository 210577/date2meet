import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ymdFromDateKST } from "@/lib/kstDate";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
    const { slug } = params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { userId, password } = body as { userId: string; password: string };
    if (!userId || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const resp = await prisma.response.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
        include: { selections: true },
    });

    if (!resp) return NextResponse.json({ error: "No such userId" }, { status: 404 });

    const ok = await bcrypt.compare(password, resp.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    return NextResponse.json({
        ok: true,
        selectedYMDs: resp.selections.map((s) => ymdFromDateKST(s.date)),
    });
}
