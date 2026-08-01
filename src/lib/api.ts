import { BookCandidate } from "@/types/book";
import { isBunko } from "@/lib/bookLogic";

/** Google Books API のレスポンス型（必要なフィールドのみ） */
interface GoogleBooksItem {
  volumeInfo: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
    language?: string;
    categories?: string[];
  };
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksItem[];
}

/** publishedDate 文字列から年を取得する（"2021", "2021-03", "2021-03-15" 等に対応） */
function parseYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : undefined;
}

/** クライアントサイドキャッシュ（TTL: 5分） */
interface CacheEntry {
  data: BookCandidate[];
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/** 指定ミリ秒待機する */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch を 429 / 5xx 時に指数バックオフでリトライする。
 * 初回失敗後、約 1s → 2s → 4s の遅延で最大 3 回リトライ。
 */
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  const RETRY_DELAYS_MS = [1000, 2000, 4000];

  let lastRes: Response | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);

    if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      lastRes = res;
      if (attempt < maxRetries) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 4000);
        continue;
      }
    }

    return res;
  }

  return lastRes!;
}

/**
 * Google Books API を使って著者名で書籍を検索する。
 * - `langRestrict=ja` で日本語書籍を優先
 * - 最大 40 件 × 最大 2 ページ = 最大 80 件取得（API 上限考慮）
 * - 取得結果を BookCandidate[] に変換して返す
 * - 同一クエリは 5 分間メモリキャッシュから返す
 * - 429 時は指数バックオフで最大 3 回リトライ
 *
 * 制約:
 * - Google Books は日本語書籍の網羅性が完全ではない
 * - 初版年は `publishedDate` の年に正規化して代用する
 * - 単行本/文庫の判定は isBunko() でヒューリスティックに実施
 */
export async function searchBooksByAuthor(authorName: string): Promise<BookCandidate[]> {
  const MAX_RESULTS = 40;
  const PAGES = 2;

  const normalizedName = authorName.trim();
  const cacheKey = `author:${normalizedName}:ja:${MAX_RESULTS}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const candidates: BookCandidate[] = [];

  for (let page = 0; page < PAGES; page++) {
    const startIndex = page * MAX_RESULTS;
    const query = encodeURIComponent(`inauthor:"${normalizedName}"`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&langRestrict=ja&maxResults=${MAX_RESULTS}&startIndex=${startIndex}&printType=books`;

    const res = await fetchWithRetry(url);
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error(
          "現在APIが混み合っています。少し待ってから再試行してください。"
        );
      }
      throw new Error(`Google Books API エラー: ${res.status} ${res.statusText}`);
    }

    const data: GoogleBooksResponse = await res.json();
    if (!data.items || data.items.length === 0) break;

    for (const item of data.items) {
      const vi = item.volumeInfo;
      if (!vi.title) continue;

      // 著者名フィルタ: 検索クエリに著者名が含まれていても無関係な書籍が混入することがあるため、
      // authors フィールドに著者名が含まれるものを優先（フィルタは緩め）
      const authorMatch =
        !vi.authors ||
        vi.authors.some((a) => a.includes(normalizedName) || normalizedName.includes(a));

      // 日本語書籍のみを対象とする（language フィールドが "ja" のもの、または未設定）
      const isJapanese = !vi.language || vi.language === "ja";

      if (!authorMatch || !isJapanese) continue;

      candidates.push({
        title: vi.title,
        author: vi.authors?.[0] ?? normalizedName,
        totalPages: vi.pageCount ?? 0,
        publicationYear: parseYear(vi.publishedDate),
        publisher: vi.publisher,
        isBunko: isBunko(vi.title, vi.publisher),
      });
    }

    // 取得件数が上限より少なければ追加ページは不要
    if (data.items.length < MAX_RESULTS) break;
  }

  cache.set(cacheKey, { data: candidates, expiresAt: Date.now() + CACHE_TTL_MS });
  return candidates;
}
