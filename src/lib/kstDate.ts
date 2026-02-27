import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const KST = "Asia/Seoul";

/** Parse "YYYY-MM-DD" as KST midnight and return a JS Date (UTC internally). */
export function kstDateFromYMD(ymd: string): Date {
    return dayjs.tz(ymd, "YYYY-MM-DD", KST).startOf("day").toDate();
}

/** Format a stored Date into "YYYY-MM-DD" in KST. */
export function ymdFromDateKST(d: Date): string {
    return dayjs(d).tz(KST).format("YYYY-MM-DD");
}

/** Get all dates (KST) inclusive between start/end (stored as Date). */
export function listYMDInclusive(start: Date, end: Date): string[] {
    const s = dayjs(start).tz(KST).startOf("day");
    const e = dayjs(end).tz(KST).startOf("day");
    const out: string[] = [];
    let cur = s;
    while (cur.isBefore(e) || cur.isSame(e, "day")) {
        out.push(cur.format("YYYY-MM-DD"));
        cur = cur.add(1, "day");
    }
    return out;
}
