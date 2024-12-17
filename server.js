const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("data.json");
const middlewares = jsonServer.defaults();

// Custom Middleware for pagination and metadata
server.use(middlewares);

// 커스텀 미들웨어 - 페이지네이션 및 응답 수정
server.use((req, res, next) => {
  if (req.method === "GET" && req.url.startsWith("/books")) {
    const { page = 1, item = 10 } = req.query;

    // 데이터 가져오기
    const books = router.db.get("books").value();

    // 페이지네이션 계산
    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(item, 10);
    const totalItems = books.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBooks = books.slice(startIndex, startIndex + itemsPerPage);

    // 수정된 응답 객체
    const response = {
      total_pages: totalPages,
      total_items: totalItems,
      current_page: currentPage, // 여기서 올바른 page 값 반영
      booklist: paginatedBooks,
    };

    return res.json(response);
  }

  next();
});

server.use(router);
server.listen(3000, () => {
  console.log("JSON Server is running");
});
