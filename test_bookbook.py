"""Tests for bookbook."""

import json
import os
import sys
import unittest

# Allow running tests from the repo root
sys.path.insert(0, os.path.dirname(__file__))

import bookbook


class BookbookTests(unittest.TestCase):
    def setUp(self):
        # Use a temporary DB file so tests don't touch the real one
        self._orig_db = bookbook.DB_FILE
        bookbook.DB_FILE = "/tmp/bookbook_test.json"
        # Start each test with a clean slate
        if os.path.exists(bookbook.DB_FILE):
            os.remove(bookbook.DB_FILE)

    def tearDown(self):
        if os.path.exists(bookbook.DB_FILE):
            os.remove(bookbook.DB_FILE)
        bookbook.DB_FILE = self._orig_db

    # --- add_book ---

    def test_add_book_basic(self):
        book = bookbook.add_book("Clean Code", "Robert C. Martin")
        self.assertEqual(book["id"], 1)
        self.assertEqual(book["title"], "Clean Code")
        self.assertEqual(book["author"], "Robert C. Martin")
        self.assertEqual(book["status"], "want-to-read")

    def test_add_book_custom_status(self):
        book = bookbook.add_book("The Pragmatic Programmer", status="reading")
        self.assertEqual(book["status"], "reading")

    def test_add_book_invalid_status(self):
        with self.assertRaises(ValueError):
            bookbook.add_book("Some Book", status="finished")

    def test_add_book_auto_increment_id(self):
        b1 = bookbook.add_book("Book One")
        b2 = bookbook.add_book("Book Two")
        self.assertEqual(b2["id"], b1["id"] + 1)

    def test_add_book_persists(self):
        bookbook.add_book("Persistent Book")
        with open(bookbook.DB_FILE, encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Persistent Book")

    # --- list_books ---

    def test_list_books_empty(self):
        self.assertEqual(bookbook.list_books(), [])

    def test_list_books_all(self):
        bookbook.add_book("Book A")
        bookbook.add_book("Book B")
        books = bookbook.list_books()
        self.assertEqual(len(books), 2)

    def test_list_books_filter_by_status(self):
        bookbook.add_book("Book A", status="reading")
        bookbook.add_book("Book B", status="read")
        reading = bookbook.list_books("reading")
        self.assertEqual(len(reading), 1)
        self.assertEqual(reading[0]["title"], "Book A")

    # --- update_status ---

    def test_update_status(self):
        book = bookbook.add_book("Some Book")
        updated = bookbook.update_status(book["id"], "read")
        self.assertEqual(updated["status"], "read")

    def test_update_status_persists(self):
        book = bookbook.add_book("Some Book")
        bookbook.update_status(book["id"], "reading")
        books = bookbook.list_books()
        self.assertEqual(books[0]["status"], "reading")

    def test_update_status_invalid_status(self):
        book = bookbook.add_book("Some Book")
        with self.assertRaises(ValueError):
            bookbook.update_status(book["id"], "abandoned")

    def test_update_status_missing_id(self):
        with self.assertRaises(KeyError):
            bookbook.update_status(999, "read")

    # --- delete_book ---

    def test_delete_book(self):
        book = bookbook.add_book("To Delete")
        deleted = bookbook.delete_book(book["id"])
        self.assertEqual(deleted["title"], "To Delete")
        self.assertEqual(bookbook.list_books(), [])

    def test_delete_book_missing_id(self):
        with self.assertRaises(KeyError):
            bookbook.delete_book(999)

    # --- main (CLI) ---

    def test_cli_add_and_list(self):
        bookbook.main(["add", "Design Patterns", "GoF", "want-to-read"])
        books = bookbook.list_books()
        self.assertEqual(len(books), 1)
        self.assertEqual(books[0]["title"], "Design Patterns")

    def test_cli_update(self):
        bookbook.main(["add", "SICP"])
        books = bookbook.list_books()
        bookbook.main(["update", str(books[0]["id"]), "reading"])
        self.assertEqual(bookbook.list_books()[0]["status"], "reading")

    def test_cli_delete(self):
        bookbook.main(["add", "Temp Book"])
        books = bookbook.list_books()
        bookbook.main(["delete", str(books[0]["id"])])
        self.assertEqual(bookbook.list_books(), [])

    def test_cli_unknown_command_exits(self):
        with self.assertRaises(SystemExit):
            bookbook.main(["unknown"])

    def test_cli_help_no_exit(self):
        # Should not raise
        bookbook.main([])
        bookbook.main(["--help"])


if __name__ == "__main__":
    unittest.main()
