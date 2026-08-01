# bookbook

A lightweight command-line book tracker written in Python. Keep a list of books you want to read, are currently reading, or have finished — no external dependencies required.

## Requirements

- Python 3.7+

## Quick start

```bash
# Clone the repository
git clone https://github.com/himehamaki/bookbook.git
cd bookbook

# Run directly
python bookbook.py --help
```

## Usage

```
bookbook <command> [arguments]
```

### Commands

| Command | Description |
|---|---|
| `add <title> [author] [status]` | Add a new book |
| `list [status]` | List all books (optionally filter by status) |
| `update <id> <status>` | Update the reading status of a book |
| `delete <id>` | Remove a book |

### Status values

| Value | Meaning |
|---|---|
| `want-to-read` | On your reading list (default) |
| `reading` | Currently reading |
| `read` | Finished |

### Examples

```bash
# Add a book (title only)
python bookbook.py add "Clean Code"

# Add a book with author and status
python bookbook.py add "The Pragmatic Programmer" "Hunt & Thomas" reading

# List all books
python bookbook.py list

# List only books you have already read
python bookbook.py list read

# Mark book #3 as finished
python bookbook.py update 3 read

# Delete book #2
python bookbook.py delete 2
```

Book data is stored as plain JSON in `books.json` in the same directory.

## Running tests

```bash
python -m unittest test_bookbook -v
```