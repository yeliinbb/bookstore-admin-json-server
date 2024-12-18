const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("data.json");
const middlewares = jsonServer.defaults();

// Custom Middleware for pagination and metadata
server.use(middlewares);

// body-parser 추가
server.use(jsonServer.bodyParser);

// 커스텀 미들웨어 - 페이지네이션 및 응답 수정
server.use((req, res, next) => {
  if (req.method === "GET" && req.url.startsWith("/books")) {
    // id로 개별 조회하는 경우
    const idMatch = req.url.match(/^\/books\/(\d+)$/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      const books = router.db.get("books").value();
      const book = books.find((b) => b.id === id);

      if (book) {
        return res.json(book);
      } else {
        return res.status(404).json({ message: "Book not found" });
      }
    }

    // 페이지네이션 처리
    const { page = 1, item = 10 } = req.query;
    const books = router.db.get("books").value();

    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(item, 10);
    const totalItems = books.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBooks = books.slice(startIndex, startIndex + itemsPerPage);

    return res.json({
      total_pages: totalPages,
      total_items: totalItems,
      current_page: currentPage,
      booklist: paginatedBooks,
    });
  }
  next();
});

// PUT 요청 처리 (수정)
server.put("/books/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const books = router.db.get("books").value();
  const bookIndex = books.findIndex((b) => b.id === id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: "Book not found" });
  }

  const updatedBook = { ...books[bookIndex], ...req.body };
  console.log("Updated book:", updatedBook);

  router.db.get("books").splice(bookIndex, 1, updatedBook).write();

  res.json(updatedBook);
});

// DELETE 요청 처리 (삭제)
server.delete("/books/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const books = router.db.get("books");
  const book = books.find((b) => b.id === id).value();

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  books.remove({ id: id }).write();
  res.json({ message: "Book deleted successfully" });
});

// POST 요청 처리 (추가)
server.post("/books", (req, res) => {
  const books = router.db.get("books").value();

  // 새 ID 생성 (마지막 ID + 1)
  const newId = books.length > 0 ? books[books.length - 1].id + 1 : 1;

  const newBook = {
    id: newId,
    ...req.body,
  };

  // 유효성 검사
  if (!newBook.title || !newBook.author) {
    return res.status(400).json({ message: "Title and Author are required" });
  }

  router.db.get("books").push(newBook).write();
  res.status(201).json(newBook);
});

server.use(router);
server.listen(3000, () => {
  console.log("JSON Server is running");
});
