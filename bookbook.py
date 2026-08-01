"""bookbook - A simple command-line book tracker."""

import json
import os
import sys
from datetime import date

DB_FILE = os.path.join(os.path.dirname(__file__), "books.json")

STATUS_OPTIONS = ("reading", "read", "want-to-read")


def _load() -> list:
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save(books: list) -> None:
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(books, f, ensure_ascii=False, indent=2)


def add_book(title: str, author: str = "", status: str = "want-to-read") -> dict:
    """Add a new book and return it."""
    if status not in STATUS_OPTIONS:
        raise ValueError(f"status must be one of {STATUS_OPTIONS}")
    books = _load()
    new_id = max((b["id"] for b in books), default=0) + 1
    book = {
        "id": new_id,
        "title": title,
        "author": author,
        "status": status,
        "added": str(date.today()),
    }
    books.append(book)
    _save(books)
    return book


def list_books(status: str = "") -> list:
    """Return all books, optionally filtered by status."""
    books = _load()
    if status:
        books = [b for b in books if b["status"] == status]
    return books


def update_status(book_id: int, status: str) -> dict:
    """Update the status of a book and return the updated book."""
    if status not in STATUS_OPTIONS:
        raise ValueError(f"status must be one of {STATUS_OPTIONS}")
    books = _load()
    for book in books:
        if book["id"] == book_id:
            book["status"] = status
            _save(books)
            return book
    raise KeyError(f"No book with id {book_id}")


def delete_book(book_id: int) -> dict:
    """Delete a book and return the deleted book."""
    books = _load()
    for i, book in enumerate(books):
        if book["id"] == book_id:
            deleted = books.pop(i)
            _save(books)
            return deleted
    raise KeyError(f"No book with id {book_id}")


def _print_book(book: dict) -> None:
    print(
        f"[{book['id']}] {book['title']}"
        + (f" / {book['author']}" if book.get("author") else "")
        + f"  ({book['status']})  added:{book['added']}"
    )


def _cmd_add(args: list) -> None:
    if not args:
        print("Usage: bookbook add <title> [author] [status]", file=sys.stderr)
        sys.exit(1)
    title = args[0]
    author = args[1] if len(args) > 1 else ""
    status = args[2] if len(args) > 2 else "want-to-read"
    book = add_book(title, author, status)
    print(f"Added: ", end="")
    _print_book(book)


def _cmd_list(args: list) -> None:
    status_filter = args[0] if args else ""
    books = list_books(status_filter)
    if not books:
        print("No books found.")
        return
    for book in books:
        _print_book(book)


def _cmd_update(args: list) -> None:
    if len(args) < 2:
        print("Usage: bookbook update <id> <status>", file=sys.stderr)
        sys.exit(1)
    try:
        book_id = int(args[0])
    except ValueError:
        print("id must be an integer", file=sys.stderr)
        sys.exit(1)
    book = update_status(book_id, args[1])
    print("Updated: ", end="")
    _print_book(book)


def _cmd_delete(args: list) -> None:
    if not args:
        print("Usage: bookbook delete <id>", file=sys.stderr)
        sys.exit(1)
    try:
        book_id = int(args[0])
    except ValueError:
        print("id must be an integer", file=sys.stderr)
        sys.exit(1)
    book = delete_book(book_id)
    print("Deleted: ", end="")
    _print_book(book)


def main(argv: list = None) -> None:
    if argv is None:
        argv = sys.argv[1:]

    commands = {
        "add": _cmd_add,
        "list": _cmd_list,
        "update": _cmd_update,
        "delete": _cmd_delete,
    }

    if not argv or argv[0] in ("-h", "--help"):
        print("bookbook - a simple book tracker")
        print()
        print("Commands:")
        print("  add <title> [author] [status]  Add a book")
        print("  list [status]                  List books")
        print("  update <id> <status>           Update book status")
        print("  delete <id>                    Delete a book")
        print()
        print(f"Status values: {', '.join(STATUS_OPTIONS)}")
        return

    cmd = argv[0]
    if cmd not in commands:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        sys.exit(1)

    commands[cmd](argv[1:])


if __name__ == "__main__":
    main()
