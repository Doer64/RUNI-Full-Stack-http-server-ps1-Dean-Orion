const net = require("net");
const fs = require("fs");
const path = require("path");

function parseRequest(rawData) {
  const text = rawData.toString();
  request = { str: text };
  const [headerSection, bodySection] = text.split("\r\n\r\n");

  const [requestLine, ...headerLines] = headerSection.split("\r\n");
  const [method, fullPath, version] = requestLine.split(" ");

  // Parse headers
  const headers = {};
  for (let i = 1; i < headerLines.length; i++) {
    const colonIndex = headerLines[i].indexOf(":");
    if (colonIndex > 0) {
      const key = headerLines[i].slice(0, colonIndex).toLowerCase().trim();
      const value = headerLines[i].slice(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  const [realPath, queryString] = fullPath.split("?");

  // Parse URL and query string
  const query = {};
  if (queryString) {
    queryString.split("&").forEach((param) => {
      const [key, value] = param.split("=");
      query[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
  }

  request = {
    str: text,
    method: method.toUpperCase(),
    version,
    path: realPath,
    query: query,
    headers: headers,
    body: bodySection,
  };

  return request;
}

// Build HTTP/1.1 response
function buildResponse(statusCode, statusText, headers, body) {
  // Getting the character length of the body in order to add later in the header
  if (body) {
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  // The first line of the response
  let response = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;

  // Adding the headers
  for (const [key, value] of Object.entries(headers)) {
    response += `${key}: ${value}\r\n`;
  }

  // Empty line + body
  response += "\r\n";
  if (body) {
    response += body;
  }

  return response;
}

function createRouter() {
  const router = {
    ALL: [],
    GET: [],
    POST: [],
    PUT: [],
    DELETE: [],
  };

  // function to create a new route, takes only the path and has option to add Methods
  function CreateRoute(path) {
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)";
    });

    const newRoute = {
      PATH: path,
      paramNames: paramNames,
      regex: new RegExp(`^${regexPath}$`),
      _GET: null,
      _POST: null,
      _PUT: null,
      _DELETE: null,
      // Adding a method with a handler to this route
      addMethod(method, handler) {
        this["_" + method.toUpperCase()] = handler;
        router[method.toUpperCase()].push(this);
        return this;
      },
      get(handler) {
        return this.addMethod("GET", handler);
      },
      post(handler) {
        return this.addMethod("POST", handler);
      },
      put(handler) {
        return this.addMethod("PUT", handler);
      },
      delete(handler) {
        return this.addMethod("DELETE", handler);
      },
    };
    router.ALL.push(newRoute);
    return newRoute;
  }

  // Match a request to a route
  function match(method, path) {
    const methodRoutes = router[method.toUpperCase()] || [];

    for (const route of methodRoutes) {
      const match = path.match(route.regex);
      if (match) {
        // Extract params
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { route: route, method, params };
      }
    }
    return null;
  }

  router.CreateRoute = CreateRoute;
  router.match = match;
  return router;
}

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function serveStatic(staticDir) {
  async function get(req) {
    const response = {
      statusCode: 0,
      statusText: null,
      headers: {},
      body: null,
    };

    const filePath = path.join(staticDir, req.path);
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(staticDir);

    if (!resolvedPath.startsWith(resolvedDir)) {
      response.statusCode = 403;
      response.statusText = "Forbidden";
      response.body = "Access denied";
      return response;
    }

    try {
      const stats = await fs.promises.stat(filePath);
      if (!stats.isFile()) {
        response.statusCode = 404;
        response.statusText = "Not Found";
        response.body = "File not found";
        return response;
      }
      const mimeType = getMimeType(filePath);
      response.statusCode = 200;
      response.statusText = "OK";
      response.headers["Content-Type"] = mimeType;
      response.body = await fs.promises.readFile(filePath);
      response.headers["Content-Length"] = response.body.length;
      return response;
    } catch (err) {
      response.statusCode = 404;
      response.statusText = "Not Found";
      response.body = "File not found";
      return response;
    }
  }

  return {
    dir: staticDir,
    get,
  };
}
