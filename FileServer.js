const { createServer } = require("./server");

const app = createServer();

app.static("./public");

app.listen(3000, () => {
  console.log(
    "Server running on http://localhost:3000 \nEnter the url http://localhost:3000/index.html to see my file!!!",
  );
});

// Enter the url http://localhost:3000/index.html to see my file!!!
