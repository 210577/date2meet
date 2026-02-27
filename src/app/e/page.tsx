"use client";

import { useEffect, useMemo, useState } from "react";

type EventDTO = {
    slug: string;
    title: string;
    startYMD: string;
    endYMD: string;
    dates: string[];
};

export default function EventPage({ params }: { params: { slug: string } }) {
    const slug = params.slug;

    const [event, setEvent] = useState<EventDTO | null>(null);
    const [results, setResults] = useState<Record<string, { count: number; users: string[] }>>({});
    const [loading, setLoading] = useState(true);

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [msg, setMsg] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        const res = await fetch(`/api/events/${slug}`);
        const data = await res.json();
        if (res.ok) {
            setEvent(data.event);
            setResults(data.results);
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
        // optional: polling to feel “live”
        const t = setInterval(load, 8000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const dates = useMemo(() => event?.dates ?? [], [event]);

    function toggleDate(ymd: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(ymd)) next.delete(ymd);
            else next.add(ymd);
            return next;
        });
    }

    async function submit() {
        setMsg(null);
        const res = await fetch(`/api/events/${slug}/respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, password, selectedYMDs: Array.from(selected) }),
        });
        const data = await res.json();
        if (!res.ok) return setMsg(data.error ?? "Failed");
        setMsg(data.created ? "Saved!" : "Updated!");
        await load();
    }

    async function loadMySelection() {
        setMsg(null);
        const res = await fetch(`/api/events/${slug}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, password }),
        });
        const data = await res.json();
        if (!res.ok) return setMsg(data.error ?? "Failed");
        setSelected(new Set(data.selectedYMDs));
        setMsg("Loaded your previous selection.");
    }

    if (loading && !event) return <main className="p-6">Loading…</main>;
    if (!event) return <main className="p-6">Event not found.</main>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">{event.title}</h1>
                <div className="text-sm text-gray-600">
                    Range: {event.startYMD} → {event.endYMD} (KST)
                </div>
                <div className="text-sm">
                    Share: <span className="font-mono">{typeof window !== "undefined" ? window.location.href : ""}</span>
                </div>
            </header>

            <section className="border rounded p-4 space-y-3">
                <h2 className="font-semibold">Your availability</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className="border rounded p-2" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
                    <input className="border rounded p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <div className="flex gap-2">
                    <button className="bg-black text-white rounded px-3 py-2" onClick={submit}>Save / Update</button>
                    <button className="border rounded px-3 py-2" onClick={loadMySelection}>Load my previous selection</button>
                </div>

                {msg && <div className="text-sm">{msg}</div>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                    {dates.map((ymd) => (
                        <label key={ymd} className="border rounded p-2 flex items-center gap-2">
                            <input type="checkbox" checked={selected.has(ymd)} onChange={() => toggleDate(ymd)} />
                            <span className="font-mono text-sm">{ymd}</span>
                        </label>
                    ))}
                </div>
            </section>

            <section className="border rounded p-4 space-y-3">
                <h2 className="font-semibold">Results</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dates.map((ymd) => {
                        const r = results[ymd] ?? { count: 0, users: [] };
                        return (
                            <details key={ymd} className="border rounded p-2">
                                <summary className="cursor-pointer">
                                    <span className="font-mono text-sm">{ymd}</span>{" "}
                                    <span className="text-sm text-gray-600">({r.count})</span>
                                </summary>
                                <div className="text-sm mt-2 space-y-1">
                                    {r.users.length ? r.users.map((u) => <div key={u}>{u}</div>) : <div className="text-gray-500">No one</div>}
                                </div>
                            </details>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
