# HTTP Server Framework — PS1

**Full Stack and Web Development | Reichman University**

A custom HTTP server framework built from scratch using only Node.js built-ins (`net`, `fs`, `path`). No `http` module, no third-party libraries.

---

## Design Philosophy

The core idea behind this framework is that **everything is an object with a clear responsibility**.

Most frameworks scatter route definitions across many separate calls:

```js
app.get("/users", handler);
app.post("/users", handler);
app.delete("/users/:id", handler);
```

This framework groups everything by **resource** — one object per path, all its methods attached to it:

```js
const users = app.resource("/users").get(handler).post(handler);

const user = app.resource("/users/:id").delete(handler);
```

This reflects a simple principle: if something belongs together, it should live together. A `/users` endpoint and its GET and POST handlers are all part of the same concept — so they're defined as one object.

The same principle applies to responses. Instead of calling separate functions to set status, headers, and body, the response is built up as an object and sent all at once:

```js
res.status(201).header("X-Custom", "value").body({ created: true }).send();
```

Every method returns `this`, so the response object builds up its state through chaining. Nothing is written to the socket until `.send()` is explicitly called — the response object just accumulates until you're ready.

This makes the flow of a request handler read naturally top to bottom: build up what you want to say, then say it.

---

## Project structure

```
PS1/
  Server.js         — the framework
  RouteServer.js    — Example: routing
  FileServer.js     — Example: static file serving
  public/
    index.html
    secret.html
  package.json
  README.md
```

---

## How to run

**Static file serving demo:**

```bash
node FileServer.js
```

Open `http://localhost:3000/index.html` in your browser.

**Routing demo (trivia game):**

```bash
node RouteServer.js
```

Use curl, Postman, or Thunder Client to interact with the routes.

---

## API

### Setup

```js
const { createServer } = require("./Server");
const app = createServer();
```

### Resources

```js
const users = app.resource('/users')
  .get((req, res) => { ... })
  .post((req, res) => { ... })

const user = app.resource('/users/:id')
  .get((req, res) => {
    res.status(200).body({ id: req.params.id }).send();
  })
```

### Static files

```js
app.static("./public");
// GET /index.html → serves public/index.html
```

### Starting the server

```js
app.listen(3000, () => console.log("Running on http://localhost:3000"));
```

---

## The `req` object

| Property      | Description                                             |
| ------------- | ------------------------------------------------------- |
| `req.method`  | HTTP method (`GET`, `POST`, etc.)                       |
| `req.path`    | URL path                                                |
| `req.params`  | URL parameters extracted from the path (`{ id: '42' }`) |
| `req.query`   | Query string parameters                                 |
| `req.headers` | Request headers                                         |
| `req.body`    | Raw request body                                        |

## The `res` object

| Method                   | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `res.status(code)`       | Set status code                                                |
| `res.status(code, text)` | Set status code with custom status text                        |
| `res.header(key, value)` | Add a response header                                          |
| `res.body(data)`         | Set body — object → JSON, string → plain text, Buffer → binary |
| `res.send()`             | Send the response                                              |
