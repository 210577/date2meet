"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [startYMD, setStartYMD] = useState("");
    const [endYMD, setEndYMD] = useState("");
    const [err, setErr] = useState<string | null>(null);

    async function create() {
        setErr(null);
        const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, startYMD, endYMD }),
        });
        const data = await res.json();
        if (!res.ok) return setErr(data.error ?? "Failed");
        router.push(`/e/${data.slug}`);
    }

    return (
        <main className="max-w-xl mx-auto p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Date2Meet (KST)</h1>

            <div className="space-y-2">
                <label className="block">
                    <div className="text-sm">Title</div>
                    <input className="border rounded w-full p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>

                <label className="block">
                    <div className="text-sm">Start date (KST)</div>
                    <input className="border rounded w-full p-2" type="date" value={startYMD} onChange={(e) => setStartYMD(e.target.value)} />
                </label>

                <label className="block">
                    <div className="text-sm">End date (KST)</div>
                    <input className="border rounded w-full p-2" type="date" value={endYMD} onChange={(e) => setEndYMD(e.target.value)} />
                </label>

                <button className="bg-black text-white rounded px-4 py-2" onClick={create}>
                    Create event
                </button>

                {err && <div className="text-red-600">{err}</div>}
            </div>
        </main>
    );
}
