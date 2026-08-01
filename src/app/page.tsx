"use client";

import { useState, useCallback } from "react";
import { Book, BookInput } from "@/types/book";
import { computeStatus } from "@/lib/bookLogic";
import { loadBooks, addBook, updateBook, removeBook } from "@/lib/storage";
import BookTable from "@/components/BookTable";
import AddBookModal from "@/components/AddBookModal";
import AuthorSearch from "@/components/AuthorSearch";

export default function Home() {
  // lazy initializer で初回レンダー時に localStorage から読み込む
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthorSearch, setShowAuthorSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"全て" | "未読" | "読書中" | "読了">("全て");

  const handleAdd = useCallback(
    (input: BookInput) => {
      const updated = addBook(books, {
        ...input,
        status: computeStatus(input.currentPage, input.totalPages),
      });
      setBooks(updated);
      setShowAddModal(false);
    },
    [books]
  );

  const handleImport = useCallback(
    (inputs: BookInput[]) => {
      let current = books;
      for (const input of inputs) {
        current = addBook(current, {
          ...input,
          status: computeStatus(input.currentPage, input.totalPages),
        });
      }
      setBooks(current);
      setShowAuthorSearch(false);
    },
    [books]
  );

  const handleUpdatePage = useCallback(
    (id: string, currentPage: number) => {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const status = computeStatus(currentPage, book.totalPages);
      const updated = updateBook(books, id, { currentPage, status });
      setBooks(updated);
    },
    [books]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setBooks(removeBook(books, id));
    },
    [books]
  );

  const filteredBooks =
    filterStatus === "全て" ? books : books.filter((b) => b.status === filterStatus);

  const counts = {
    全て: books.length,
    未読: books.filter((b) => b.status === "未読").length,
    読書中: books.filter((b) => b.status === "読書中").length,
    読了: books.filter((b) => b.status === "読了").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">bookbook</h1>
            <span className="text-xs text-gray-400 hidden sm:inline">— 読書管理</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAuthorSearch(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              著者から取り込む
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              本を追加
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* フィルター & サマリー */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["全て", "未読", "読書中", "読了"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  filterStatus === status ? "bg-blue-500 text-blue-100" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* 本棚テーブル */}
        <BookTable
          books={filteredBooks}
          onUpdatePage={handleUpdatePage}
          onDelete={handleDelete}
        />
      </main>

      {/* モーダル */}
      {showAddModal && (
        <AddBookModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {showAuthorSearch && (
        <AuthorSearch onImport={handleImport} onClose={() => setShowAuthorSearch(false)} />
      )}
    </div>
  );
}

