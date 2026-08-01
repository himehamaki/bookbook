import { Book } from "@/types/book";
import { reassignListNumbers } from "@/lib/bookLogic";

const STORAGE_KEY = "bookbook_shelf";

/**
 * localStorage から本棚データを読み込む。
 * データが存在しない・破損している場合は空配列を返す（安全な初期化）。
 */
export function loadBooks(): Book[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("[bookbook] localStorage data is not an array. Resetting.");
      return [];
    }
    // 基本的な型チェック：title と id があるものだけ採用
    const valid = parsed.filter(
      (item): item is Book =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).id === "string" &&
        typeof (item as Record<string, unknown>).title === "string"
    );
    if (valid.length !== parsed.length) {
      console.warn("[bookbook] Some entries were invalid and skipped.");
    }
    return valid;
  } catch (e) {
    console.error("[bookbook] Failed to parse localStorage data. Resetting.", e);
    return [];
  }
}

/**
 * 本棚データを localStorage に保存する。
 */
export function saveBooks(books: Book[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (e) {
    console.error("[bookbook] Failed to save to localStorage.", e);
  }
}

/**
 * 新しい本を追加して保存する。
 * listNumber は既存最大値 + 1 を割り当てる。
 */
export function addBook(books: Book[], newBook: Omit<Book, "id" | "listNumber" | "createdAt" | "updatedAt">): Book[] {
  const now = new Date().toISOString();
  const maxListNumber = books.reduce((max, b) => Math.max(max, b.listNumber), 0);
  const book: Book = {
    ...newBook,
    id: crypto.randomUUID(),
    listNumber: maxListNumber + 1,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [...books, book];
  saveBooks(updated);
  return updated;
}

/**
 * 本のフィールドを更新して保存する。
 */
export function updateBook(books: Book[], id: string, changes: Partial<Omit<Book, "id" | "createdAt">>): Book[] {
  const updated = books.map((b) =>
    b.id === id ? { ...b, ...changes, updatedAt: new Date().toISOString() } : b
  );
  saveBooks(updated);
  return updated;
}

/**
 * 本を削除して保存する。
 * 削除後は連番を振り直す。
 */
export function removeBook(books: Book[], id: string): Book[] {
  const filtered = books.filter((b) => b.id !== id);
  const renumbered = reassignListNumbers(filtered);
  saveBooks(renumbered);
  return renumbered;
}
