import { Book, BookStatus } from "@/types/book";

/**
 * currentPage と totalPages からステータスを自動判定する。
 * - currentPage = 0         → 未読
 * - 0 < currentPage < totalPages → 読書中
 * - currentPage >= totalPages   → 読了
 */
export function computeStatus(currentPage: number, totalPages: number): BookStatus {
  if (currentPage <= 0) return "未読";
  if (totalPages > 0 && currentPage >= totalPages) return "読了";
  return "読書中";
}

/**
 * タイトルを正規化する（比較用）。
 * 全角スペース・記号を除去し、スペースを詰めて小文字化する。
 */
export function normalizeTitle(title: string): string {
  return title
    .replace(/[\s\u3000]+/g, "")  // 全角・半角スペース除去
    .replace(/[（）()【】［］\[\]「」『』〈〉《》・・…‥]/g, "")
    .toLowerCase();
}

/**
 * タイトルまたは出版社名が「文庫」に該当するかをヒューリスティックに判定する。
 *
 * 判定根拠:
 * 1. タイトルに「文庫」が含まれる（例: 「○○文庫版」）
 * 2. 出版社名が既知の文庫レーベル名パターンにマッチする
 *    - 角川文庫, 新潮文庫, 講談社文庫, 集英社文庫, 文春文庫,
 *      ハヤカワ文庫, 創元文庫, 光文社文庫, 双葉文庫, 徳間文庫,
 *      幻冬舎文庫, PHP文庫, 中公文庫 等
 * 3. 出版社名に「文庫」が含まれる（上記以外の文庫レーベル）
 */
export function isBunko(title: string, publisher?: string): boolean {
  // 1. タイトルに「文庫」が含まれる
  if (title.includes("文庫")) return true;

  if (!publisher) return false;

  // 2. 出版社に「文庫」が含まれる（文庫専用レーベル表記）
  if (publisher.includes("文庫")) return true;

  // 3. 既知の文庫専用出版社・レーベル名（文庫 の文字を使わない例は少ないが念のため）
  const BUNKO_PUBLISHERS = [
    "角川", "新潮", "講談社", "集英社", "文春", "ハヤカワ", "創元",
    "光文社", "双葉", "徳間", "幻冬舎", "PHP", "中公",
  ];
  // 上記の出版社でも単行本を出すため、出版社名単体ではなく
  // 「○○文庫」または publisher が短い（レーベル名のみ）場合のみ判定する。
  // Google Books の publisher フィールドは文庫レーベル名をそのまま入れることが多い。
  const stripped = publisher.replace(/\s/g, "");
  for (const name of BUNKO_PUBLISHERS) {
    // 例: "角川文庫", "新潮文庫", "角川文庫（角川書店）" にマッチ
    if (stripped.includes(`${name}文庫`)) return true;
  }

  return false;
}

/**
 * 重複タイトル除外ルールを適用する。
 * 同一正規化タイトルに複数の版がある場合:
 * - 単行本（非文庫）が存在すれば文庫を除外
 * - 文庫しかない場合はそのまま採用
 * 同一グループ内では最も古い出版年のものを代表とする。
 */
export function deduplicateCandidates<T extends { title: string; isBunko: boolean; publicationYear?: number }>(
  candidates: T[]
): T[] {
  // タイトルごとにグループ化
  const groups = new Map<string, T[]>();
  for (const c of candidates) {
    const key = normalizeTitle(c.title);
    const group = groups.get(key) ?? [];
    group.push(c);
    groups.set(key, group);
  }

  const result: T[] = [];
  for (const group of groups.values()) {
    const tankobon = group.filter((c) => !c.isBunko);
    if (tankobon.length > 0) {
      // 単行本の中で最も古いものを採用
      result.push(earliest(tankobon));
    } else {
      // 文庫しかない場合は最も古いものを採用
      result.push(earliest(group));
    }
  }

  return result;
}

/** 出版年が最も古いアイテムを返す */
function earliest<T extends { publicationYear?: number }>(items: T[]): T {
  return items.reduce((best, cur) => {
    const bestYear = best.publicationYear ?? 9999;
    const curYear = cur.publicationYear ?? 9999;
    return curYear < bestYear ? cur : best;
  });
}

/**
 * 候補を出版年の昇順でソートする。
 * 出版年不明のものは末尾に置く。
 */
export function sortByYear<T extends { publicationYear?: number; title: string }>(
  candidates: T[]
): T[] {
  return [...candidates].sort((a, b) => {
    const ay = a.publicationYear ?? 9999;
    const by = b.publicationYear ?? 9999;
    if (ay !== by) return ay - by;
    return a.title.localeCompare(b.title, "ja");
  });
}

/**
 * 連番を振り直す。
 * 追加順（createdAt）でソートして listNumber を 1 から付け直す。
 */
export function reassignListNumbers(books: Book[]): Book[] {
  const sorted = [...books].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return sorted.map((book, index) => ({ ...book, listNumber: index + 1 }));
}
