/** 本のステータス */
export type BookStatus = "未読" | "読書中" | "読了";

/** 本棚に登録された本 */
export interface Book {
  /** 内部ID (UUID) */
  id: string;
  /** 表示用連番 */
  listNumber: number;
  /** タイトル */
  title: string;
  /** 著者名 */
  author: string;
  /** 総ページ数 */
  totalPages: number;
  /** 現在ページ */
  currentPage: number;
  /**
   * ステータス（自動判定）
   * - currentPage = 0         → 未読
   * - 0 < currentPage < totalPages → 読書中
   * - currentPage >= totalPages   → 読了
   */
  status: BookStatus;
  /** 初版発行年（任意） */
  publicationYear?: number;
  /** 追加方法: 手動入力 or API取り込み */
  source: "manual" | "import";
  /** 作成日時 (ISO 8601) */
  createdAt: string;
  /** 更新日時 (ISO 8601) */
  updatedAt: string;
}

/** 本を新規追加するときの入力値 */
export type BookInput = Pick<
  Book,
  "title" | "author" | "totalPages" | "currentPage" | "publicationYear" | "source"
>;

/** 著者作品APIの取り込み候補 */
export interface BookCandidate {
  title: string;
  author: string;
  totalPages: number;
  publicationYear?: number;
  publisher?: string;
  /** 文庫本かどうかのヒューリスティック判定結果 */
  isBunko: boolean;
}
