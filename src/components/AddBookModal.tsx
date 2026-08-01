"use client";

import { useState } from "react";
import { BookInput } from "@/types/book";

interface AddBookModalProps {
  onAdd: (input: BookInput) => void;
  onClose: () => void;
}

const INITIAL_FORM = {
  title: "",
  author: "",
  totalPages: "",
  currentPage: "0",
  publicationYear: "",
};

export default function AddBookModal({ onAdd, onClose }: AddBookModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<typeof INITIAL_FORM>>({});

  const validate = () => {
    const errs: Partial<typeof INITIAL_FORM> = {};
    if (!form.title.trim()) errs.title = "タイトルを入力してください";
    if (!form.author.trim()) errs.author = "著者名を入力してください";
    const total = parseInt(form.totalPages, 10);
    if (form.totalPages !== "" && (isNaN(total) || total < 0)) {
      errs.totalPages = "0以上の整数を入力してください";
    }
    const current = parseInt(form.currentPage, 10);
    if (isNaN(current) || current < 0) {
      errs.currentPage = "0以上の整数を入力してください";
    }
    if (
      form.publicationYear !== "" &&
      (isNaN(parseInt(form.publicationYear, 10)) || parseInt(form.publicationYear, 10) < 1000)
    ) {
      errs.publicationYear = "正しい年を入力してください（例: 2021）";
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const totalPages = form.totalPages ? parseInt(form.totalPages, 10) : 0;
    const currentPage = parseInt(form.currentPage, 10);
    const publicationYear = form.publicationYear
      ? parseInt(form.publicationYear, 10)
      : undefined;

    onAdd({
      title: form.title.trim(),
      author: form.author.trim(),
      totalPages,
      currentPage,
      publicationYear,
      source: "manual",
    });
  };

  const field = (
    name: keyof typeof INITIAL_FORM,
    label: string,
    type: string = "text",
    placeholder: string = ""
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [name]: e.target.value }));
          setErrors((er) => ({ ...er, [name]: undefined }));
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          errors[name] ? "border-red-400" : "border-gray-300"
        }`}
      />
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">本を手動で追加</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field("title", "タイトル *", "text", "例: 羅生門")}
          {field("author", "著者 *", "text", "例: 芥川龍之介")}
          {field("totalPages", "総ページ数", "number", "例: 320")}
          {field("currentPage", "現在のページ", "number", "例: 0")}
          {field("publicationYear", "発行年", "number", "例: 1915")}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              追加する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
