"use client";

import { useState } from "react";
import { BookCandidate, BookInput } from "@/types/book";
import { searchBooksByAuthor } from "@/lib/api";
import { deduplicateCandidates, sortByYear } from "@/lib/bookLogic";

interface AuthorSearchProps {
  onImport: (books: BookInput[]) => void;
  onClose: () => void;
}

export default function AuthorSearch({ onImport, onClose }: AuthorSearchProps) {
  const [authorName, setAuthorName] = useState("");
  const [candidates, setCandidates] = useState<BookCandidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!authorName.trim()) return;
    setLoading(true);
    setError(null);
    setCandidates([]);
    setSelected(new Set());
    setSearched(false);

    try {
      const raw = await searchBooksByAuthor(authorName.trim());
      const deduped = deduplicateCandidates(raw);
      const sorted = sortByYear(deduped);
      setCandidates(sorted);
      setSearched(true);
      // デフォルトで全件選択
      setSelected(new Set(sorted.map((_, i) => i)));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "予期しないエラーが発生しました。しばらく経ってから再試行してください。"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = () => {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((_, i) => i)));
    }
  };

  const toggleOne = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleImport = () => {
    const books: BookInput[] = candidates
      .filter((_, i) => selected.has(i))
      .map((c) => ({
        title: c.title,
        author: c.author,
        totalPages: c.totalPages,
        currentPage: 0,
        publicationYear: c.publicationYear,
        source: "import" as const,
      }));
    if (books.length > 0) {
      onImport(books);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">著者から作品を取り込む</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 検索フォーム */}
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
              placeholder="著者名を入力（例: 東野圭吾）"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !authorName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "検索中…" : "検索"}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Google Books API を使用。日本語書籍を対象に、初版年順で候補を表示します。
          </p>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ローディング */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600" />
              <span className="ml-3 text-sm text-gray-500">検索中…</span>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              <p className="font-medium">エラーが発生しました</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* 結果ゼロ */}
          {!loading && searched && candidates.length === 0 && !error && (
            <div className="py-12 text-center text-gray-400">
              <p>該当する作品が見つかりませんでした。</p>
              <p className="mt-1 text-xs">別の著者名（ひらがな・カタカナ・漢字）でもお試しください。</p>
            </div>
          )}

          {/* 候補一覧 */}
          {candidates.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selected.size === candidates.length}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  全て選択 ({selected.size} / {candidates.length} 件)
                </label>
              </div>

              <div className="space-y-1.5">
                {candidates.map((c, i) => (
                  <label
                    key={`${c.title}-${i}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                      selected.has(i)
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggleOne(i)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500">
                        {c.author}
                        {c.publicationYear && ` · ${c.publicationYear}年`}
                        {c.publisher && ` · ${c.publisher}`}
                        {c.totalPages > 0 && ` · ${c.totalPages}ページ`}
                      </p>
                    </div>
                    {c.isBunko && (
                      <span className="mt-0.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                        文庫
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        {candidates.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selected.size} 件を取り込む
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
