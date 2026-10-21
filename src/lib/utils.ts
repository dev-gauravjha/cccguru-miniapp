// Utility helpers for CCCGuru Telegram Mini App

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatPrice(price: number, currency = "INR"): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

export function getDifficultyColor(
  difficulty: "Easy" | "Medium" | "Hard" | string
): string {
  switch (difficulty) {
    case "Easy":
      return "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800";
    case "Medium":
      return "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800";
    case "Hard":
      return "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800";
    default:
      return "text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-900 border-slate-200 dark:border-slate-800";
  }
}

export function truncate(text: string, length: number): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "…";
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Canonical Chapter Test Mapping from website database
export const CHAPTER_TEST_ITEMS_MAP: Record<
  number,
  { id: string; slug: string; title: string; questionCount: number; duration: number }
> = {
  1: {
    id: "4184483f-2189-454d-ac8b-5189bc0fe64f",
    slug: "introduction-to-computer-hardware",
    title: "Introduction to Computer & Hardware",
    questionCount: 100,
    duration: 90,
  },
  2: {
    id: "e8996ee7-6e63-40df-95c0-7fa66451e295",
    slug: "introduction-to-gui-based-operating-system",
    title: "Introduction to GUI Based Operating System",
    questionCount: 100,
    duration: 90,
  },
  3: {
    id: "249be4da-e627-4ddc-92cd-a90edbad5630",
    slug: "word-processing-libreoffice-writer",
    title: "Word Processing (LibreOffice Writer)",
    questionCount: 100,
    duration: 90,
  },
  4: {
    id: "70c61e7e-c4f8-4eef-af1d-824018d67a7b",
    slug: "libreoffice-calc-spreadsheet",
    title: "LibreOffice Calc (Spreadsheet)",
    questionCount: 100,
    duration: 90,
  },
  5: {
    id: "78c6e1be-3f37-4cdd-8759-4e146635b270",
    slug: "libreoffice-impress-presentation",
    title: "LibreOffice Impress (Presentation)",
    questionCount: 100,
    duration: 90,
  },
  6: {
    id: "aa40a9ce-5f74-463c-bfe7-0958a8a98943",
    slug: "internet-web-browsing",
    title: "Internet & Web Browsing",
    questionCount: 100,
    duration: 90,
  },
  7: {
    id: "7ec44db4-0e5d-4034-9e95-5654d8cf754b",
    slug: "e-mail-social-media-e-governance",
    title: "E-mail, Social Media & E-Governance",
    questionCount: 100,
    duration: 90,
  },
  8: {
    id: "b520ccc4-a988-43f7-8a77-eb98fbebc323",
    slug: "digital-financial-tools-banking",
    title: "Digital Financial Tools & Banking",
    questionCount: 100,
    duration: 90,
  },
  9: {
    id: "dbda7559-24c1-49f7-9c8a-f4cd93a68da1",
    slug: "cyber-security-future-skills",
    title: "Cyber Security & Future Skills",
    questionCount: 100,
    duration: 90,
  },
  10: {
    id: "aa8fb338-e9b0-4433-8d03-3c2de5bba552",
    slug: "future-skills-artificial-intelligence",
    title: "Future Skills & Artificial Intelligence",
    questionCount: 100,
    duration: 90,
  },
};

