"use client";

import { useState } from "react";
import { Book } from "@/types/book";

interface BookTableProps {
  books: Book[];
  onUpdatePage: (id: string, currentPage: number) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  未読: "bg-gray-100 text-gray-600",
  読書中: "bg-blue-100 text-blue-700",
  読了: "bg-green-100 text-green-700",
};

export default function BookTable({ books, onUpdatePage, onDelete }: BookTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<string>("");

  const startEdit = (book: Book) => {
    setEditingId(book.id);
    setEditPage(String(book.currentPage));
  };

  const commitEdit = (book: Book) => {
    const page = parseInt(editPage, 10);
    if (!isNaN(page) && page >= 0) {
      onUpdatePage(book.id, page);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPage("");
  };

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-4 h-16 w-16 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
        <p className="text-lg font-medium">本棚はまだ空です</p>
        <p className="mt-1 text-sm">「本を追加」または「著者から取り込む」で本を登録してください。</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-12">#</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">タイトル</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">著者</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">ページ</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">進捗</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">ステータス</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 w-20">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {books.map((book) => {
            const isEditing = editingId === book.id;
            const progress =
              book.totalPages > 0
                ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
                : 0;
            const statusColor = STATUS_COLOR[book.status] ?? "bg-gray-100 text-gray-600";

            return (
              <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 text-gray-400 font-mono">{book.listNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                  <span title={book.title} className="line-clamp-2">
                    {book.title}
                  </span>
                  {book.publicationYear && (
                    <span className="ml-2 text-xs text-gray-400">{book.publicationYear}年</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{book.author}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={book.totalPages || undefined}
                        value={editPage}
                        onChange={(e) => setEditPage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(book);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="w-20 rounded border border-blue-400 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        autoFocus
                      />
                      <span className="text-gray-400">/ {book.totalPages || "?"}</span>
                      <button
                        onClick={() => commitEdit(book)}
                        className="rounded bg-blue-500 px-1.5 py-0.5 text-xs text-white hover:bg-blue-600"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(book)}
                      className="group flex items-center gap-1 rounded px-1 hover:bg-blue-50"
                      title="クリックで進捗を編集"
                    >
                      <span>
                        {book.currentPage}
                        <span className="text-gray-400"> / {book.totalPages || "?"}</span>
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                  >
                    {book.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      if (window.confirm(`「${book.title}」を削除しますか？`)) {
                        onDelete(book.id);
                      }
                    }}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="削除"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
