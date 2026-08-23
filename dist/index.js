// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
};

// node_modules/hono/dist/utils/body.js
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder2) => {
  try {
    return decoder2(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder2(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = /* @__PURE__ */ Object.create(null);
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      Object.keys(middleware).forEach((m) => {
        if ((method === METHOD_NAME_ALL || method === m) && !middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      });
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          if (!routes[m][path2]) {
            this.#insertPath(m, path2);
            routes[m][path2] = [
              ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
            ];
          }
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = this.#tries = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = /* @__PURE__ */ Object.create(null);
    const handlerData = [];
    [middleware, routes].forEach((r) => {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
          continue;
        }
        const paramAssoc = pathData[1];
        handlerData[pathData[0]] = handlers.map(([h, paramCount]) => {
          const paramIndexMap = /* @__PURE__ */ Object.create(null);
          paramCount -= 1;
          for (; paramCount >= 0; paramCount--) {
            const [key, value] = paramAssoc[paramCount];
            paramIndexMap[key] = value;
          }
          return [h, paramIndexMap];
        });
      }
    });
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (let i = 0, len = handlerData.length; i < len; i++) {
      for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
        const map = handlerData[i][j]?.[1];
        if (!map) {
          continue;
        }
        const keys = Object.keys(map);
        for (let k = 0, len3 = keys.length; k < len3; k++) {
          map[keys[k]] = paramReplacementMap[map[keys[k]]];
        }
      }
    }
    const handlerMap = [];
    for (const i in indexReplacementMap) {
      handlerMap[i] = handlerData[indexReplacementMap[i]];
    }
    return [regexp, handlerMap, staticMap];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var order = 0;
var Node2 = class _Node2 {
  #methods = [];
  #children = /* @__PURE__ */ Object.create(null);
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "QUERY"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    } else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else {
      return () => "";
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (exposeHeadersStr) {
      set("Access-Control-Expose-Headers", exposeHeadersStr);
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        c.res.headers.append("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods) {
        set("Access-Control-Allow-Methods", allowMethods);
      }
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
        }
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process !== void 0 ? (
    // eslint-disable-next-line no-unsafe-optional-chaining
    "NO_COLOR" in process?.env
  ) : false;
  return !isNoColor;
}
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}

// node_modules/hono/dist/middleware/logger/index.js
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
};
var colorStatus = async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  };
};

// src/util/bytes.ts
function toU8(b) {
  return b instanceof Uint8Array ? b : new Uint8Array(b);
}
function isIPv4(host) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}
function randomUUID() {
  if (typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = b[6] & 15 | 64;
  b[8] = b[8] & 63 | 128;
  const h = Array.from(b).map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10).join("")}`;
}
function nowSec() {
  return Math.floor(Date.now() / 1e3);
}
function cgnatSubnet(ip) {
  if (!ip || ip === "unknown")
    return ip;
  if (ip.includes(":")) {
    const parts2 = ip.split(":");
    if (parts2.length >= 4)
      return parts2.slice(0, 4).join(":") + "::/64";
    return ip;
  }
  const parts = ip.split(".");
  if (parts.length === 4)
    return parts.slice(0, 3).join(".") + ".0/24";
  return ip;
}

// src/core/protocol/parsers.ts
function readAddress(buf, offset) {
  const atyp = buf[offset];
  offset += 1;
  let host = "";
  let type;
  if (atyp === 1) {
    type = "ipv4";
    host = `${buf[offset]}.${buf[offset + 1]}.${buf[offset + 2]}.${buf[offset + 3]}`;
    offset += 4;
  } else if (atyp === 3) {
    type = "domain";
    const len = buf[offset];
    offset += 1;
    host = new TextDecoder().decode(buf.subarray(offset, offset + len));
    offset += len;
  } else if (atyp === 4) {
    type = "ipv6";
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push((buf[offset + i] << 8 | buf[offset + i + 1]).toString(16));
    }
    host = parts.join(":");
    offset += 16;
  } else {
    throw new Error(`unsupported ATYP 0x${atyp.toString(16)}`);
  }
  const port = buf[offset] << 8 | buf[offset + 1];
  offset += 2;
  return { addr: { host, port, type }, next: offset };
}
function parseVless(buf) {
  if (buf.byteLength < 20 || buf[0] !== 0) {
    throw new Error("invalid vless header");
  }
  const uuidBytes = buf.subarray(1, 17);
  const hex = Array.from(uuidBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  let offset = 17;
  const addonLen = buf[offset];
  offset += 1 + addonLen;
  const { addr, next } = readAddress(buf, offset);
  const payload = buf.subarray(next);
  return { protocol: "vless", uuid, target: addr, payload: payload.slice(), raw: buf.slice() };
}
function parseTrojan(buf) {
  if (buf.byteLength < 60)
    throw new Error("trojan header too short");
  let hash;
  try {
    hash = new TextDecoder("ascii").decode(buf.subarray(0, 56)).toLowerCase();
    if (!/^[0-9a-f]{56}$/.test(hash))
      throw new Error("bad hex");
  } catch {
    throw new Error("invalid trojan password header");
  }
  let offset = 56;
  if (buf[offset] === 13 && buf[offset + 1] === 10)
    offset += 2;
  const cmd = buf[offset];
  offset += 1;
  if (cmd !== 1)
    throw new Error(`trojan cmd ${cmd} not supported`);
  const { addr, next } = readAddress(buf, offset);
  offset = next;
  if (buf[offset] === 13 && buf[offset + 1] === 10)
    offset += 2;
  const payload = buf.subarray(offset);
  return { protocol: "trojan", passwordHash: hash, target: addr, payload: payload.slice(), raw: buf.slice() };
}
function parseVmess(buf) {
  if (buf.byteLength < 40)
    throw new Error("vmess header too short");
  let off = 1 + 16 + 16;
  off += 1;
  off += 1;
  off += 1;
  const port = buf[off] << 8 | buf[off + 1];
  off += 2;
  const atyp = buf[off];
  off += 1;
  let host = "";
  let type;
  if (atyp === 1) {
    type = "ipv4";
    host = `${buf[off]}.${buf[off + 1]}.${buf[off + 2]}.${buf[off + 3]}`;
    off += 4;
  } else if (atyp === 3) {
    type = "domain";
    const len = buf[off];
    off += 1;
    host = new TextDecoder().decode(buf.subarray(off, off + len));
    off += len;
  } else if (atyp === 4) {
    type = "ipv6";
    const parts = [];
    for (let i = 0; i < 16; i += 2)
      parts.push((buf[off + i] << 8 | buf[off + i + 1]).toString(16));
    host = parts.join(":");
    off += 16;
  } else {
    throw new Error(`vmess: unsupported ATYP 0x${atyp.toString(16)}`);
  }
  const idBytes = buf.subarray(off, off + 16);
  const hex = Array.from(idBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  off += 16;
  const payload = buf.subarray(off);
  return { protocol: "vmess", uuid, target: { host, port, type }, payload: payload.slice(), raw: buf.slice() };
}
function parseFirstFrame(buf, allowed) {
  const data = toU8(buf);
  if (allowed.has("trojan") && data.byteLength >= 58) {
    const head = new TextDecoder("ascii").decode(data.subarray(0, 56));
    if (/^[0-9a-fA-F]{56}$/.test(head) && data[56] === 13 && data[57] === 10) {
      return parseTrojan(data);
    }
  }
  if (allowed.has("vless") && data.byteLength >= 20 && data[0] === 0) {
    return parseVless(data);
  }
  if (allowed.has("vmess")) {
    return parseVmess(data);
  }
  throw new Error("no protocol matched first frame");
}
function buildVlessResponse() {
  return new Uint8Array([0, 0]);
}

// src/core/upstream/connect.ts
import { connect } from "cloudflare:sockets";
var CONNECT_TIMEOUT = 8e3;
var READ_TIMEOUT = 8e3;
async function connectDirect(host, port, initialData) {
  const sock = connect({ hostname: host, port });
  await Promise.race([
    sock.opened,
    new Promise((_, rej) => setTimeout(() => rej(new Error("connect timeout")), CONNECT_TIMEOUT))
  ]);
  if (initialData && initialData.byteLength > 0) {
    const w = sock.writable.getWriter();
    await w.write(initialData);
    w.releaseLock();
  }
  return socketToUpstream(sock);
}
async function connectProxy(proxy, host, port, initialData) {
  const norm = normalizeProxy(proxy);
  if (norm.startsWith("http://") || norm.startsWith("https://")) {
    return connectHttp(norm, host, port, initialData);
  }
  if (norm.startsWith("socks4://"))
    return connectSocks4(norm, host, port, initialData);
  return connectSocks5(norm, host, port, initialData);
}
async function connectSocks5(uri, host, port, initialData) {
  const { user, pass, host: ph, port: pp } = parseAuth(uri);
  const sock = connect({ hostname: ph, port: pp });
  await Promise.race([sock.opened, timeout("socks5 connect")]);
  const writer = sock.writable.getWriter();
  const reader = sock.readable.getReader();
  try {
    const methods = user ? new Uint8Array([5, 2, 0, 2]) : new Uint8Array([5, 1, 0]);
    await writer.write(methods);
    const g = await readWithTimeout(reader, 2);
    if (g[0] !== 5)
      throw new Error("bad socks5 greeting");
    if (g[1] === 2) {
      if (!user)
        throw new Error("socks5 requires auth");
      const u8 = new TextEncoder().encode(user);
      const p8 = new TextEncoder().encode(pass);
      const req2 = new Uint8Array(3 + u8.byteLength + p8.byteLength);
      req2[0] = 1;
      req2[1] = u8.byteLength;
      req2.set(u8, 2);
      req2[2 + u8.byteLength] = p8.byteLength;
      req2.set(p8, 3 + u8.byteLength);
      await writer.write(req2);
      const a = await readWithTimeout(reader, 2);
      if (a[1] !== 0)
        throw new Error("socks5 auth failed");
    }
    const addr = buildSocksAddress(host, port);
    const req = new Uint8Array(3 + addr.byteLength);
    req[0] = 5;
    req[1] = 1;
    req[2] = 0;
    req.set(addr, 3);
    await writer.write(req);
    const rep = await readSocksReply(reader);
    if (rep !== 0)
      throw new Error(`socks5 reply 0x${rep.toString(16)}`);
    if (initialData && initialData.byteLength > 0)
      await writer.write(initialData);
  } finally {
    writer.releaseLock();
    reader.releaseLock();
  }
  return socketToUpstream(sock);
}
async function connectSocks4(uri, host, port, initialData) {
  const { user, host: ph, port: pp } = parseAuth(uri);
  const sock = connect({ hostname: ph, port: pp });
  await Promise.race([sock.opened, timeout("socks4 connect")]);
  const w = sock.writable.getWriter();
  const r = sock.readable.getReader();
  try {
    const useA = !isIPv4(host);
    let req;
    if (!useA) {
      const ip = host.split(".").map(Number);
      req = new Uint8Array(9);
      req[0] = 4;
      req[1] = 1;
      req[2] = port >> 8 & 255;
      req[3] = port & 255;
      req[4] = ip[0];
      req[5] = ip[1];
      req[6] = ip[2];
      req[7] = ip[3];
      req[8] = 0;
    } else {
      const hostB = new TextEncoder().encode(host);
      req = new Uint8Array(9 + hostB.byteLength + 1);
      req[0] = 4;
      req[1] = 1;
      req[2] = port >> 8 & 255;
      req[3] = port & 255;
      req[4] = 0;
      req[5] = 0;
      req[6] = 0;
      req[7] = 1;
      req[8] = 0;
      req.set(hostB, 9);
      req[9 + hostB.byteLength] = 0;
    }
    if (user) {
      const ub = new TextEncoder().encode(user);
      const out = new Uint8Array(req.byteLength + ub.byteLength);
      out.set(ub, 0);
      out.set(req, ub.byteLength);
      req = out;
    }
    await w.write(req);
    const res = await readWithTimeout(r, 8);
    if (res[0] !== 0 || res[1] !== 90)
      throw new Error("socks4 rejected");
    if (initialData && initialData.byteLength > 0)
      await w.write(initialData);
  } finally {
    w.releaseLock();
    r.releaseLock();
  }
  return socketToUpstream(sock);
}
async function connectHttp(uri, host, port, initialData) {
  const { user, pass, host: ph, port: pp } = parseAuth(uri);
  const sock = connect({ hostname: ph, port: pp });
  await Promise.race([sock.opened, timeout("http proxy connect")]);
  const w = sock.writable.getWriter();
  const r = sock.readable.getReader();
  try {
    const head = [`CONNECT ${host}:${port} HTTP/1.1`, `Host: ${host}:${port}`, "Proxy-Connection: keep-alive"];
    if (user) {
      const tok = btoa(`${user}:${pass ?? ""}`);
      head.push(`Proxy-Authorization: Basic ${tok}`);
    }
    head.push("", "");
    const headerBytes = new TextEncoder().encode(head.join("\r\n"));
    const headerCopy = new Uint8Array(headerBytes.byteLength);
    headerCopy.set(headerBytes);
    await w.write(headerCopy);
    let buf = new Uint8Array(new ArrayBuffer(0));
    while (true) {
      const { value, done } = await Promise.race([r.read(), timeout("http proxy read")]);
      if (done)
        throw new Error("http proxy closed");
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      buf = concatBuf(buf, copy);
      const idx = indexOfSeq(buf, new Uint8Array([13, 10, 13, 10]));
      if (idx >= 0) {
        const line = new TextDecoder().decode(buf.subarray(0, idx));
        const m = line.match(/HTTP\/\d\.\d (\d{3})/);
        if (!m || parseInt(m[1], 10) !== 200)
          throw new Error(`http proxy: ${line}`);
        const leftover = buf.subarray(idx + 4);
        if (initialData && initialData.byteLength > 0) {
          const cp = new Uint8Array(initialData.byteLength);
          cp.set(initialData);
          await w.write(cp);
        }
        if (leftover.byteLength > 0) {
          return socketToUpstream(sock, leftover);
        }
        break;
      }
    }
  } finally {
    w.releaseLock();
    r.releaseLock();
  }
  return socketToUpstream(sock);
}
function socketToUpstream(sock, prefix) {
  let consumed = !prefix || prefix.byteLength === 0;
  const passthrough = sock.readable;
  const readable = consumed ? passthrough : new ReadableStream({
    start(controller) {
      controller.enqueue(prefix);
      passthrough.pipeTo(new WritableStream({
        write(chunk) {
          controller.enqueue(chunk);
        },
        close() {
          controller.close();
        },
        abort(err) {
          controller.error(err);
        }
      })).catch(() => controller.close());
    }
  });
  return {
    writable: sock.writable,
    readable,
    closed: sock.closed,
    close: () => {
      try {
        sock.close?.();
      } catch {
      }
    }
  };
}
function buildSocksAddress(host, port) {
  if (isIPv4(host)) {
    const o = host.split(".").map(Number);
    const b2 = new Uint8Array(1 + 4 + 2);
    b2[0] = 1;
    b2[1] = o[0];
    b2[2] = o[1];
    b2[3] = o[2];
    b2[4] = o[3];
    b2[5] = port >> 8 & 255;
    b2[6] = port & 255;
    return b2;
  }
  if (host.includes(":")) {
    const groups = host.split(":");
    const b2 = new Uint8Array(1 + 16 + 2);
    b2[0] = 4;
    for (let i = 0; i < 8; i++) {
      const v = parseInt(groups[i] || "0", 16);
      b2[1 + i * 2] = v >> 8 & 255;
      b2[2 + i * 2] = v & 255;
    }
    b2[17] = port >> 8 & 255;
    b2[18] = port & 255;
    return b2;
  }
  const h = new TextEncoder().encode(host);
  const b = new Uint8Array(1 + 1 + h.byteLength + 2);
  b[0] = 3;
  b[1] = h.byteLength;
  b.set(h, 2);
  b[2 + h.byteLength] = port >> 8 & 255;
  b[3 + h.byteLength] = port & 255;
  return b;
}
async function readSocksReply(reader) {
  const head = await readWithTimeout(reader, 4);
  if (head[0] !== 5)
    throw new Error("bad socks5 reply");
  let remaining = 0;
  if (head[3] === 1)
    remaining = 4;
  else if (head[3] === 3) {
    const l = await readWithTimeout(reader, 1);
    remaining = l[0];
  } else if (head[3] === 4)
    remaining = 16;
  remaining += 2;
  while (remaining > 0) {
    const chunk = await readWithTimeout(reader, Math.min(remaining, 1024));
    remaining -= chunk.byteLength;
  }
  return head[1];
}
async function readWithTimeout(r, n) {
  const out = [];
  let total = 0;
  while (total < n) {
    const { value, done } = await Promise.race([
      r.read(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("proxy read timeout")), READ_TIMEOUT))
    ]);
    if (done)
      throw new Error("proxy closed early");
    out.push(value);
    total += value.byteLength;
  }
  const merged = concatBuf(...out);
  return merged.subarray(0, n);
}
function normalizeProxy(p) {
  if (p.includes("t.me/socks") || p.includes("tg://socks")) {
    const server = p.match(/server=([^&]+)/)?.[1];
    const port = p.match(/port=([^&]+)/)?.[1];
    const user = p.match(/user=([^&]+)/)?.[1];
    const pass = p.match(/pass=([^&]+)/)?.[1];
    if (server && port)
      return user && pass ? `socks5://${user}:${pass}@${server}:${port}` : `socks5://${server}:${port}`;
  }
  return p;
}
function parseAuth(p) {
  const norm = normalizeProxy(p);
  const m = norm.match(/^(?:socks[45]|https?):\/\/(?:([^@/?#]+)@)?([^:/?#]+)(?::(\d+))?/i);
  if (!m)
    throw new Error("bad proxy uri");
  let user, pass;
  if (m[1]) {
    const [u, pw] = m[1].split(":");
    user = u ? decodeURIComponent(u) : void 0;
    pass = pw ? decodeURIComponent(pw) : void 0;
  }
  return { user, pass, host: m[2], port: parseInt(m[3] || "1080", 10) };
}
function concatBuf(...parts) {
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}
function indexOfSeq(hay, needle) {
  outer:
    for (let i = 0; i + needle.byteLength <= hay.byteLength; i++) {
      for (let j = 0; j < needle.byteLength; j++)
        if (hay[i + j] !== needle[j])
          continue outer;
      return i;
    }
  return -1;
}
function timeout(msg) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), CONNECT_TIMEOUT));
}

// src/core/pump.ts
function pump(client, upstream, opts = {}) {
  const GRAIN = opts.grainBytes ?? 128 * 1024;
  const SILENT = opts.grainSilentMs ?? 2;
  const MAX_Q = opts.maxQueueBytes ?? 32 * 1024 * 1024;
  let closed = false;
  let clientClosed = false;
  let upClosed = false;
  let queueBytes = 0;
  let pending = [];
  let pendingBytes = 0;
  let flushTimer = null;
  let writerLock = null;
  const finishers = [];
  const closedPromise = new Promise((res) => finishers.push(res));
  const reportUp = (n) => {
    try {
      opts.onUp?.(n);
    } catch {
    }
  };
  const reportDown = (n) => {
    try {
      opts.onDown?.(n);
    } catch {
    }
  };
  const shutdown = (err) => {
    if (closed)
      return;
    closed = true;
    if (flushTimer)
      clearTimeout(flushTimer);
    try {
      upstream.close?.();
    } catch {
    }
    try {
      if (client.readyState === 1)
        client.close();
    } catch {
    }
    if (err)
      try {
        opts.onError?.(err);
      } catch {
      }
    try {
      opts.onClose?.();
    } catch {
    }
    finishers.forEach((f) => f());
  };
  const flushNow = async () => {
    if (pendingBytes === 0)
      return;
    if (writerLock) {
      await writerLock;
      return;
    }
    const chunk = pending.length === 1 ? pending[0] : concatChunks(pending);
    pending = [];
    pendingBytes = 0;
    queueBytes -= chunk.byteLength;
    const w = upstream.writable.getWriter();
    writerLock = (async () => {
      try {
        await w.write(chunk);
        reportUp(chunk.byteLength);
      } catch (e) {
        shutdown(e);
      } finally {
        try {
          w.releaseLock();
        } catch {
        }
        writerLock = null;
        if (pendingBytes > 0)
          scheduleFlush();
      }
    })();
    await writerLock;
  };
  const scheduleFlush = () => {
    if (flushTimer)
      return;
    flushTimer = setTimeout(async () => {
      flushTimer = null;
      try {
        await flushNow();
      } catch (e) {
        shutdown(e);
      }
    }, SILENT);
  };
  const onMessage = async (ev) => {
    if (closed)
      return;
    if (typeof ev.data === "string")
      return;
    const data = ev.data instanceof Uint8Array ? ev.data : new Uint8Array(ev.data);
    queueBytes += data.byteLength;
    if (queueBytes > MAX_Q)
      return shutdown(new Error("upstream queue overflow"));
    pending.push(data);
    pendingBytes += data.byteLength;
    if (pendingBytes >= GRAIN) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      flushNow().catch(shutdown);
    } else {
      scheduleFlush();
    }
  };
  client.addEventListener("message", onMessage);
  client.addEventListener("close", () => {
    clientClosed = true;
    if (upClosed)
      shutdown();
    else
      shutdown();
  });
  client.addEventListener("error", (e) => shutdown(e));
  (async () => {
    const reader = upstream.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done)
          break;
        if (value.byteLength === 0)
          continue;
        if (client.readyState !== 1)
          break;
        client.send(value);
        reportDown(value.byteLength);
      }
    } catch (e) {
      shutdown(e);
    } finally {
      upClosed = true;
      try {
        reader.releaseLock();
      } catch {
      }
      if (clientClosed)
        shutdown();
      else
        shutdown();
    }
  })();
  upstream.closed.catch(shutdown).finally(() => {
    upClosed = true;
    if (clientClosed)
      shutdown();
  });
  return { closed: closedPromise };
}
function concatChunks(parts) {
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

// src/util/crypto.ts
var encoder = new TextEncoder();
var decoder = new TextDecoder();
async function sha256Hex(data) {
  const buf = typeof data === "string" ? encoder.encode(data) : data;
  const h = await crypto.subtle.digest("SHA-256", buf);
  return toHex(new Uint8Array(h));
}
async function sha224Hex(data) {
  const msg = typeof data === "string" ? encoder.encode(data) : data;
  return toHex(sha224Sync(msg));
}
function sha224Sync(message) {
  const H = new Uint32Array([
    3238371032,
    914150663,
    812702999,
    4144912697,
    4290775857,
    1750603025,
    1694076839,
    3204075428
  ]);
  const K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  const rotr = (x, n) => x >>> n | x << 32 - n;
  const bitLen = message.length * 8;
  const withOne = new Uint8Array(message.length + 1);
  withOne.set(message);
  withOne[message.length] = 128;
  const padLen = (56 - withOne.length % 64 + 64) % 64;
  const padded = new Uint8Array(withOne.length + padLen + 8);
  padded.set(withOne);
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 4294967296));
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  for (let off = 0; off < padded.length; off += 64) {
    const W = new Uint32Array(64);
    for (let i = 0; i < 16; i++)
      W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ W[i - 15] >>> 3;
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ W[i - 2] >>> 10;
      W[i] = W[i - 16] + s0 + W[i - 7] + s1 | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = e & f ^ ~e & g;
      const t1 = h + S1 + ch + K[i] + W[i] | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const t2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H[0] = H[0] + a | 0;
    H[1] = H[1] + b | 0;
    H[2] = H[2] + c | 0;
    H[3] = H[3] + d | 0;
    H[4] = H[4] + e | 0;
    H[5] = H[5] + f | 0;
    H[6] = H[6] + g | 0;
    H[7] = H[7] + h | 0;
  }
  const out = new Uint8Array(28);
  for (let i = 0; i < 7; i++) {
    out[i * 4] = H[i] >>> 24 & 255;
    out[i * 4 + 1] = H[i] >>> 16 & 255;
    out[i * 4 + 2] = H[i] >>> 8 & 255;
    out[i * 4 + 3] = H[i] & 255;
  }
  return out;
}
function toHex(bytes) {
  let out = "";
  for (let i = 0; i < bytes.byteLength; i++)
    out += bytes[i].toString(16).padStart(2, "0");
  return out;
}
function fromHex(hex) {
  if (hex.length % 2 !== 0)
    throw new Error("bad hex length");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
var PBKDF2_ITERS = 1e5;
var PBKDF2_KEYLEN = 32;
var PBKDF2_SALTLEN = 16;
async function hashPassword(password) {
  const salt = new Uint8Array(PBKDF2_SALTLEN);
  crypto.getRandomValues(salt);
  const key = await pbkdf2(password, salt, PBKDF2_ITERS);
  return `pbkdf2$${PBKDF2_ITERS}$${toHex(salt)}$${toHex(new Uint8Array(key))}`;
}
async function verifyPassword(password, stored) {
  if (!stored)
    return false;
  if (stored.startsWith("pbkdf2$")) {
    const [, itersStr, saltHex, hashHex] = stored.split("$");
    const iters = parseInt(itersStr, 10);
    const salt = fromHex(saltHex);
    const expected = fromHex(hashHex);
    const key = new Uint8Array(await pbkdf2(password, salt, iters));
    return timingSafeEqual(key, expected);
  }
  if (/^[0-9a-f]{64}$/i.test(stored)) {
    return await sha256Hex(password) === stored.toLowerCase();
  }
  return false;
}
async function pbkdf2(password, salt, iters) {
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2", hash: "SHA-256" },
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iters },
    base,
    PBKDF2_KEYLEN * 8
  );
}
function timingSafeEqual(a, b) {
  if (a.byteLength !== b.byteLength)
    return false;
  let r = 0;
  for (let i = 0; i < a.byteLength; i++)
    r |= a[i] ^ b[i];
  return r === 0;
}
function randomToken(bytes = 32) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b);
}
function b64encode(s) {
  const u8 = typeof s === "string" ? encoder.encode(s) : s;
  let bin = "";
  for (let i = 0; i < u8.byteLength; i++)
    bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function generateTotpSecret() {
  return b64encode(randomToken(20)).slice(0, 32);
}
async function verifyTotp(secret, code, window = 1) {
  const key = b32decode(secret.replace(/\s+/g, "").toUpperCase());
  const epoch = Math.floor(Date.now() / 3e4);
  for (let i = -window; i <= window; i++) {
    const candidate = await totpAt(key, epoch + i);
    if (candidate === code.padStart(6, "0"))
      return true;
  }
  return false;
}
function totpUri(secret, issuer, account) {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}
async function totpAt(key, counter) {
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint32(0, Math.floor(counter / 4294967296));
  dv.setUint32(4, counter >>> 0);
  const ck = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", ck, new Uint8Array(buf)));
  const off = sig[sig.length - 1] & 15;
  const bin = (sig[off] & 127) << 24 | (sig[off + 1] & 255) << 16 | (sig[off + 2] & 255) << 8 | sig[off + 3] & 255;
  return (bin % 1e6).toString().padStart(6, "0");
}
function b32decode(s) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const out = [];
  for (const ch of s) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0)
      continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push(value >>> bits & 255);
    }
  }
  return new Uint8Array(out);
}

// src/core/dns/doh.ts
var enc = new TextEncoder();
var dec = new TextDecoder();
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 5 * 60 * 1e3;
var CACHE_MAX = 2048;
async function dohQuery(domain, recordType = "A", dohBase = "https://cloudflare-dns.com/dns-query") {
  const key = `${domain}:${recordType}:${dohBase}`;
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expires)
    return hit.answers;
  try {
    const typeMap = { A: 1, AAAA: 28, CNAME: 5 };
    const qtype = typeMap[recordType] ?? 1;
    const qname = encodeName(domain.endsWith(".") ? domain.slice(0, -1) : domain);
    const query = new Uint8Array(12 + qname.byteLength + 4);
    const dv = new DataView(query.buffer);
    dv.setUint16(0, crypto.getRandomValues(new Uint16Array(1))[0]);
    dv.setUint16(2, 256);
    dv.setUint16(4, 1);
    query.set(qname, 12);
    dv.setUint16(12 + qname.byteLength, qtype);
    dv.setUint16(12 + qname.byteLength + 2, 1);
    const res = await fetch(dohBase, {
      method: "POST",
      headers: { "content-type": "application/dns-message", accept: "application/dns-message" },
      body: query
    });
    if (!res.ok)
      return [];
    const buf = new Uint8Array(await res.arrayBuffer());
    const answers = parseAnswer(buf);
    if (cache.size >= CACHE_MAX)
      cache.clear();
    cache.set(key, { expires: Date.now() + CACHE_TTL_MS, answers });
    return answers;
  } catch {
    return [];
  }
}
function encodeName(name) {
  const parts = name.split(".");
  const out = [];
  for (const p of parts) {
    const b = enc.encode(p);
    out.push(new Uint8Array([b.byteLength]), b);
  }
  out.push(new Uint8Array([0]));
  const total = out.reduce((s, p) => s + p.byteLength, 0);
  const r = new Uint8Array(total);
  let off = 0;
  for (const p of out) {
    r.set(p, off);
    off += p.byteLength;
  }
  return r;
}
function parseName(buf, pos) {
  const labels = [];
  let p = pos, jumped = false, end = -1, guard = 128;
  while (p < buf.byteLength && guard-- > 0) {
    const len = buf[p];
    if (len === 0) {
      if (!jumped)
        end = p + 1;
      break;
    }
    if ((len & 192) === 192) {
      if (!jumped)
        end = p + 2;
      p = (len & 63) << 8 | buf[p + 1];
      jumped = true;
      continue;
    }
    labels.push(dec.decode(buf.subarray(p + 1, p + 1 + len)));
    p += len + 1;
  }
  if (end === -1)
    end = p + 1;
  return { name: labels.join("."), end };
}
function parseAnswer(buf) {
  const dv = new DataView(buf.buffer);
  const qdcount = dv.getUint16(4);
  const ancount = dv.getUint16(6);
  let off = 12;
  for (let i = 0; i < qdcount; i++) {
    const { end } = parseName(buf, off);
    off = end + 4;
  }
  const out = [];
  for (let i = 0; i < ancount && off < buf.byteLength; i++) {
    const { end } = parseName(buf, off);
    off = end;
    const type = dv.getUint16(off);
    off += 2;
    off += 2;
    const ttl = dv.getUint32(off);
    off += 4;
    const rdlength = dv.getUint16(off);
    off += 2;
    const dataStart = off;
    let data = "";
    if (type === 1 && rdlength === 4) {
      data = `${buf[off]}.${buf[off + 1]}.${buf[off + 2]}.${buf[off + 3]}`;
      out.push({ type: "A", data, ttl });
    } else if (type === 28 && rdlength === 16) {
      const parts = [];
      for (let j = 0; j < 16; j += 2)
        parts.push((buf[off + j] << 8 | buf[off + j + 1]).toString(16));
      data = parts.join(":");
      out.push({ type: "AAAA", data, ttl });
    } else if (type === 5) {
      const { name } = parseName(buf, off);
      data = name;
      out.push({ type: "CNAME", data, ttl });
    }
    off = dataStart + rdlength;
  }
  return out;
}
var BLOCK_IPS = /* @__PURE__ */ new Set(["0.0.0.0", "::", "176.103.130.130", "176.103.130.131"]);
async function isDomainBlocked(domain, cfg) {
  if (!domain)
    return false;
  const base = cfg.doh || "https://family.cloudflare-dns.com/dns-query";
  let url = base;
  if (cfg.ads && !cfg.porn)
    url = "https://dns.adguard-dns.com/dns-query";
  if (cfg.malware)
    url = "https://security.cloudflare-dns.com/dns-query";
  const a = await dohQuery(domain, "A", url);
  if (a.some((r) => BLOCK_IPS.has(r.data)))
    return true;
  if (cfg.porn || cfg.ads || cfg.malware) {
    const aaaa = await dohQuery(domain, "AAAA", url);
    if (aaaa.some((r) => BLOCK_IPS.has(r.data)))
      return true;
  }
  return false;
}

// src/core/tunnel.ts
async function handleTunnel(request, env, ctx) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  let allowed = /* @__PURE__ */ new Set(["vless", "trojan"]);
  let identifierFromPath;
  if (parts.length >= 1 && ["vless", "trojan", "vmess"].includes(parts[0])) {
    const proto = parts[0];
    allowed = /* @__PURE__ */ new Set([proto]);
    identifierFromPath = parts.slice(1).join("/");
  }
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("expected websocket", { status: 426 });
  }
  const pair = new WebSocketPair();
  const [client, server] = [pair[0], pair[1]];
  server.accept();
  server.binaryType = "arraybuffer";
  ctx.waitUntil(
    (async () => {
      try {
        await runSession(server, request, env, allowed, identifierFromPath);
      } catch (e) {
        try {
          server.close(1011, "session error");
        } catch {
        }
        console.error("tunnel session error", e);
      }
    })()
  );
  return new Response(null, { status: 101, webSocket: client });
}
async function runSession(server, request, env, allowed, identifierFromPath) {
  const firstFrame = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("first-frame timeout")), 15e3);
    server.addEventListener("message", (ev) => {
      clearTimeout(t);
      if (typeof ev.data === "string")
        return reject(new Error("text frame not expected"));
      resolve(ev.data instanceof Uint8Array ? ev.data : new Uint8Array(ev.data));
    }, { once: true });
    server.addEventListener("close", () => {
      clearTimeout(t);
      reject(new Error("closed"));
    }, { once: true });
    server.addEventListener("error", (e) => {
      clearTimeout(t);
      reject(e);
    }, { once: true });
  });
  const parsed = parseFirstFrame(firstFrame, allowed);
  const id = identifierFromPath || parsed.uuid || parsed.passwordHash || "";
  let user;
  if (parsed.protocol === "trojan") {
    user = await env.DB.prepare(
      "SELECT * FROM users WHERE uuid = ? OR trojan_hash = ? LIMIT 1"
    ).bind(id, parsed.passwordHash ?? id).first().then((r) => r ?? void 0);
  } else {
    user = await env.DB.prepare("SELECT * FROM users WHERE uuid = ? OR username = ? COLLATE NOCASE LIMIT 1").bind(id, id).first().then((r) => r ?? void 0);
  }
  if (!user) {
    server.close(1008, "unauthorized");
    return;
  }
  const connType = (user.connection_type || "vless").toLowerCase();
  const allowVless = connType.includes("vless");
  const allowTrojan = connType.includes("trojan");
  const allowVmess = connType.includes("vmess");
  if (parsed.protocol === "vless" && !allowVless) {
    server.close(1008, "protocol disabled");
    return;
  }
  if (parsed.protocol === "trojan" && !allowTrojan) {
    server.close(1008, "protocol disabled");
    return;
  }
  if (parsed.protocol === "vmess" && !allowVmess) {
    server.close(1008, "protocol disabled");
    return;
  }
  if (parsed.protocol === "trojan") {
    const expected = user.trojan_hash || await sha224Hex(user.uuid);
    if (parsed.passwordHash !== expected) {
      server.close(1008, "bad password");
      return;
    }
  } else if (parsed.uuid && parsed.uuid.toLowerCase() !== user.uuid.toLowerCase()) {
    server.close(1008, "bad uuid");
    return;
  }
  if (user.is_active !== 1) {
    server.close(1008, "disabled");
    return;
  }
  if (user.limit_gb != null && (user.used_gb ?? 0) >= user.limit_gb) {
    server.close(1008, "quota");
    return;
  }
  if (user.limit_req != null && (user.used_req ?? 0) >= user.limit_req) {
    server.close(1008, "req quota");
    return;
  }
  if (user.expiry_days != null) {
    const created = typeof user.created_at === "number" ? user.created_at : Date.parse(user.created_at) / 1e3;
    if (Date.now() / 1e3 > created + user.expiry_days * 86400) {
      server.close(1008, "expired");
      return;
    }
  }
  const rawIp = request.headers.get("CF-Connecting-IP") || "unknown";
  const subnet = cgnatSubnet(rawIp);
  const ua = request.headers.get("User-Agent") || "";
  const doId = env.USER_STATE.idFromName(user.username);
  const doStub = env.USER_STATE.get(doId);
  const connRes = await doStub.fetch(
    new URL("http://do/connect?ipLimit=" + (user.ip_limit ?? 0), "http://do").toString(),
    { method: "POST", body: JSON.stringify({ ip: rawIp, subnet, ua }) }
  );
  if (!connRes.ok) {
    const j = await connRes.json();
    server.close(1008, j.code || "limit");
    return;
  }
  if (parsed.protocol === "vless") {
    server.send(buildVlessResponse());
  }
  if (parsed.target.type === "domain" && (user.block_porn || user.block_ads || user.block_malware)) {
    try {
      const blocked = await isDomainBlocked(parsed.target.host, {
        porn: user.block_porn === 1,
        ads: user.block_ads === 1,
        malware: user.block_malware === 1,
        doh: user.doh_url || void 0
      });
      if (blocked) {
        server.close(1008, "blocked");
        return;
      }
    } catch {
    }
  }
  let upstream;
  try {
    const proxy = await selectUpstream(user, env);
    if (proxy) {
      upstream = await connectProxy(proxy, parsed.target.host, parsed.target.port, parsed.payload);
    } else {
      upstream = await connectDirect(parsed.target.host, parsed.target.port, parsed.payload);
    }
  } catch (e) {
    try {
      const host = pickFallbackHost(env);
      if (host) {
        upstream = await connectDirect(host, parsed.target.port, parsed.payload);
      } else
        throw e;
    } catch {
      await doStub.fetch("http://do/disconnect", { method: "POST", body: JSON.stringify({ subnet }) });
      server.close(1011, "upstream failed");
      return;
    }
  }
  await env.DB.prepare("UPDATE users SET used_req = used_req + 1, last_active = ? WHERE username = ?").bind(Math.floor(Date.now() / 1e3), user.username).run().catch(() => {
  });
  const stats = { up: 0, down: 0 };
  let startedAt = Date.now();
  pump(server, upstream, {
    grainBytes: 128 * 1024,
    onUp: (n) => {
      stats.up += n;
      doStub.fetch("http://do/addBytes", { method: "POST", body: JSON.stringify({ bytes: n }) }).catch(() => {
      });
    },
    onDown: (n) => {
      stats.down += n;
      doStub.fetch("http://do/addBytes", { method: "POST", body: JSON.stringify({ bytes: n }) }).catch(() => {
      });
    },
    onClose: () => {
      doStub.fetch("http://do/disconnect", { method: "POST", body: JSON.stringify({ subnet }) }).catch(() => {
      });
      const hourBucket = Math.floor(startedAt / 36e5) * 3600;
      const totalBytes = stats.up + stats.down;
      env.DB.prepare(
        `INSERT INTO traffic_hourly (hour_bucket, username, bytes_up, bytes_down, requests)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(hour_bucket, username) DO UPDATE SET
           bytes_up = bytes_up + excluded.bytes_up,
           bytes_down = bytes_down + excluded.bytes_down,
           requests = requests + 1`
      ).bind(hourBucket, user.username, stats.up, stats.down).run().catch(() => {
      });
      try {
        env.METRICS?.writeDataPoint?.({
          blobs: [user.username, "session"],
          doubles: [totalBytes, Date.now() - startedAt]
        });
      } catch {
      }
    }
  });
}
async function selectUpstream(user, env) {
  if (user.user_socks5) {
    try {
      if (user.user_socks5.trim().startsWith("[")) {
        const arr = JSON.parse(user.user_socks5);
        if (Array.isArray(arr) && arr.length)
          return arr[Math.floor(Math.random() * arr.length)];
      }
      return user.user_socks5;
    } catch {
      return user.user_socks5;
    }
  }
  if (user.user_proxy_iata) {
    try {
      const id = env.POOL_STATE.idFromName("global");
      const stub = env.POOL_STATE.get(id);
      const cc = user.user_proxy_iata.toUpperCase();
      const res = await stub.fetch(`http://do/pick?cc=${encodeURIComponent(cc)}`);
      if (res.ok) {
        const data = await res.json();
        return data.uri;
      }
    } catch {
    }
  }
  return null;
}
function pickFallbackHost(env) {
  const list = (env.PROXY_FALLBACK_HOSTS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!list.length)
    return null;
  const iata = list[Math.floor(Math.random() * list.length)];
  return `${iata}.proxyip.cmliussss.net`;
}

// src/middleware/auth.ts
var SESSION_COOKIE = "aether_session";
var SESSION_TTL_SEC = 60 * 60 * 24 * 7;
async function requireAuth(c, next) {
  const env = c.env;
  const auth = c.req.header("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    const raw2 = auth.slice(7).trim();
    const hash = await sha256Hex(raw2);
    const token = await env.DB.prepare(
      "SELECT * FROM api_tokens WHERE token_hash = ? AND (expires_at IS NULL OR expires_at > ?)"
    ).bind(hash, Math.floor(Date.now() / 1e3)).first();
    if (token) {
      c.set("actor", `token:${token.name}`);
      c.set("scopes", safeParse(token.scopes) || []);
      c.set("authKind", "token");
      await env.DB.prepare("UPDATE api_tokens SET last_used = ? WHERE id = ?").bind(Math.floor(Date.now() / 1e3), token.id).run().catch(() => {
      });
      return next();
    }
  }
  const cookie = c.req.header("cookie") || "";
  const m = cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith(SESSION_COOKIE + "="));
  if (m) {
    const raw2 = m.split("=").slice(1).join("=");
    const hash = await sha256Hex(raw2);
    const row = await env.DB.prepare(
      `SELECT s.*, a.username, a.role
         FROM sessions s JOIN admins a ON a.id = s.admin_id
        WHERE s.token_hash = ? AND s.expires_at > ?`
    ).bind(hash, Math.floor(Date.now() / 1e3)).first();
    if (row) {
      c.set("actor", row.username);
      c.set("adminId", row.admin_id);
      c.set("role", row.role);
      c.set("authKind", "session");
      return next();
    }
  }
  return c.json({ error: "unauthorized" }, 401);
}
function requireRole(...roles) {
  return async (c, next) => {
    const role = c.get("role");
    const kind = c.get("authKind");
    if (kind === "token") {
      const scopes = c.get("scopes") || [];
      if (!scopes.includes("admin"))
        return c.json({ error: "forbidden" }, 403);
      return next();
    }
    if (!role || !roles.includes(role))
      return c.json({ error: "forbidden" }, 403);
    return next();
  };
}
async function issueSession(c, adminId, env) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const hash = await sha256Hex(token);
  const ua = c.req.header("user-agent") || "";
  const ip = c.req.header("CF-Connecting-IP") || "";
  const now = Math.floor(Date.now() / 1e3);
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, admin_id, user_agent, ip, expires_at, created_at) VALUES (?,?,?,?,?,?)"
  ).bind(hash, adminId, ua, ip, now + SESSION_TTL_SEC, now).run();
  setSessionCookie(c, token, now + SESSION_TTL_SEC);
}
async function destroySession(c, env) {
  const cookie = c.req.header("cookie") || "";
  const m = cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith(SESSION_COOKIE + "="));
  if (m) {
    const raw2 = m.split("=").slice(1).join("=");
    const hash = await sha256Hex(raw2);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run().catch(() => {
    });
  }
  setSessionCookie(c, "", 0);
}
function setSessionCookie(c, value, expireSec) {
  const secure = true;
  const sameSite = "Lax";
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    `Max-Age=${expireSec}`,
    "HttpOnly",
    sameSite ? `SameSite=${sameSite}` : "",
    secure ? "Secure" : ""
  ].filter(Boolean);
  c.header("Set-Cookie", parts.join("; "));
}
function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// src/routes/auth.ts
var authRoutes = new Hono2();
authRoutes.post("/setup", async (c) => {
  const env = c.env;
  const existing = await env.DB.prepare("SELECT COUNT(*) AS n FROM admins").first();
  if (existing && existing.n > 0)
    return c.json({ error: "already initialized" }, 400);
  const body = await c.req.json();
  if (!body.username || !body.password || body.password.length < 8) {
    return c.json({ error: "username and password (>=8 chars) required" }, 400);
  }
  const hash = await hashPassword(body.password);
  await env.DB.prepare("INSERT INTO admins (username, password_hash, role, is_active) VALUES (?,?, 'owner', 1)").bind(body.username, hash).run();
  return c.json({ ok: true });
});
authRoutes.post("/auto-bootstrap", async (c) => {
  const env = c.env;
  if (!env.ADMIN_BOOTSTRAP_PASSWORD)
    return c.json({ error: "no bootstrap secret" }, 400);
  for (let i = 0; i < 6; i++) {
    try {
      const existing = await env.DB.prepare("SELECT COUNT(*) AS n FROM admins").first();
      if (existing && existing.n > 0)
        return c.json({ ok: true, already: true });
      const hash = await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD);
      await env.DB.prepare("INSERT INTO admins (username, password_hash, role, is_active) VALUES (?, ?, 'owner', 1)").bind("admin", hash).run();
      return c.json({ ok: true });
    } catch (e) {
      if (i === 5)
        throw e;
      await new Promise((r) => setTimeout(r, 1e3));
    }
  }
  return c.json({ ok: true });
});
authRoutes.post("/login", async (c) => {
  const env = c.env;
  const body = await c.req.json();
  const row = await env.DB.prepare("SELECT * FROM admins WHERE username = ? AND is_active = 1").bind(body.username).first();
  if (!row || !await verifyPassword(body.password, row.password_hash)) {
    return c.json({ error: "invalid credentials" }, 401);
  }
  if (row.totp_secret) {
    if (!body.totp || !await verifyTotp(row.totp_secret, body.totp)) {
      return c.json({ error: "totp required" }, 401);
    }
  }
  if (!row.password_hash.startsWith("pbkdf2$")) {
    const newHash = await hashPassword(body.password);
    await env.DB.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").bind(newHash, row.id).run();
  }
  await env.DB.prepare("UPDATE admins SET last_login = ? WHERE id = ?").bind(nowSec(), row.id).run();
  await issueSession(c, row.id, env);
  return c.json({ ok: true });
});
authRoutes.post("/logout", async (c) => {
  await destroySession(c, c.env);
  return c.json({ ok: true });
});
authRoutes.get("/me", requireAuth, async (c) => {
  return c.json({
    actor: c.get("actor"),
    role: c.get("role"),
    kind: c.get("authKind")
  });
});
authRoutes.post("/change-password", requireAuth, async (c) => {
  const env = c.env;
  const adminId = c.get("adminId");
  if (!adminId)
    return c.json({ error: "session required" }, 403);
  const body = await c.req.json();
  if (!body.next || body.next.length < 8)
    return c.json({ error: "password too short" }, 400);
  const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE id = ?").bind(adminId).first();
  if (!row || !await verifyPassword(body.current, row.password_hash))
    return c.json({ error: "bad current password" }, 400);
  await env.DB.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").bind(await hashPassword(body.next), adminId).run();
  return c.json({ ok: true });
});
authRoutes.post("/2fa/enroll", requireAuth, async (c) => {
  const adminId = c.get("adminId");
  if (!adminId)
    return c.json({ error: "session required" }, 403);
  const secret = generateTotpSecret();
  await c.env.DB.prepare("UPDATE admins SET totp_secret = ? WHERE id = ?").bind(secret, adminId).run();
  const row = await c.env.DB.prepare("SELECT username FROM admins WHERE id = ?").bind(adminId).first();
  return c.json({ secret, uri: totpUri(secret, "Aether Panel", row.username) });
});
authRoutes.post("/2fa/disable", requireAuth, async (c) => {
  const adminId = c.get("adminId");
  if (!adminId)
    return c.json({ error: "session required" }, 403);
  await c.env.DB.prepare("UPDATE admins SET totp_secret = NULL WHERE id = ?").bind(adminId).run();
  return c.json({ ok: true });
});
authRoutes.post("/token", requireAuth, async (c) => {
  const body = await c.req.json();
  const raw2 = randomToken(32);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw2));
  const hex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expires = body.ttlDays ? nowSec() + body.ttlDays * 86400 : null;
  await c.env.DB.prepare("INSERT INTO api_tokens (name, token_hash, scopes, expires_at) VALUES (?,?,?,?)").bind(body.name, hex, JSON.stringify(body.scopes || ["read"]), expires).run();
  return c.json({ token: raw2, expiresAt: expires });
});

// src/routes/users.ts
var userRoutes = new Hono2();
userRoutes.use("*", requireAuth);
userRoutes.get("/", async (c) => {
  const q = c.req.query("q") || "";
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const pageSize = Math.min(200, parseInt(c.req.query("pageSize") || "50", 10));
  const off = (page - 1) * pageSize;
  const like = `%${q}%`;
  const rows = await c.env.DB.prepare(
    `SELECT * FROM users WHERE username LIKE ? OR uuid LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`
  ).bind(like, like, pageSize, off).all();
  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM users WHERE username LIKE ? OR uuid LIKE ?`
  ).bind(like, like).first();
  return c.json({ users: rows.results, total: total?.n ?? 0, page, pageSize });
});
userRoutes.get("/:username", async (c) => {
  const username = c.req.param("username");
  const row = await c.env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").bind(username).first();
  if (!row)
    return c.json({ error: "not found" }, 404);
  return c.json(row);
});
userRoutes.post("/", requireRole("owner", "admin"), async (c) => {
  const body = await c.req.json();
  if (!body.username)
    return c.json({ error: "username required" }, 400);
  const uuid = body.uuid || randomUUID();
  const trojanHash = await sha224Hex(uuid);
  const now = nowSec();
  try {
    await c.env.DB.prepare(
      `INSERT INTO users (
        username, uuid, trojan_hash, limit_gb, expiry_days, limit_req,
        connection_type, tls, port, path, sni_host, fingerprint, fragment,
        alpn, ip_limit, block_porn, block_ads, block_malware, doh_url,
        user_socks5, user_proxy_iata, route_direct, route_block, auto_rotate_proxy,
        auto_reset_vol_days, auto_reset_req_days,
        last_reset_vol_time, last_reset_req_time,
        is_active, note, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      body.username,
      uuid,
      trojanHash,
      num(body.limitGb),
      num(body.expiryDays),
      num(body.limitReq),
      body.connectionType || "vless+trojan",
      body.tls || "on",
      num(body.port) ?? 443,
      body.path || "/",
      body.sniHost || null,
      body.fingerprint || "chrome",
      body.fragment || null,
      body.alpn || "h2,http/1.1",
      num(body.ipLimit),
      bool(body.blockPorn),
      bool(body.blockAds),
      bool(body.blockMalware),
      body.dohUrl || null,
      body.userSocks5 || null,
      body.userProxyIata || null,
      body.routeDirect || null,
      body.routeBlock || null,
      bool(body.autoRotateProxy),
      num(body.autoResetVolDays) ?? 0,
      num(body.autoResetReqDays) ?? 0,
      now,
      now,
      body.isActive === false ? 0 : 1,
      body.note || null,
      now,
      now
    ).run();
  } catch (e) {
    return c.json({ error: e.message }, 400);
  }
  return c.json({ ok: true, uuid, trojanHash });
});
userRoutes.patch("/:username", requireRole("owner", "admin"), async (c) => {
  const username = c.req.param("username");
  const body = await c.req.json();
  const fields = [];
  const vals = [];
  const map = {
    username: { col: "username", val: body.username },
    limitGb: { col: "limit_gb", val: num(body.limitGb) },
    expiryDays: { col: "expiry_days", val: num(body.expiryDays) },
    limitReq: { col: "limit_req", val: num(body.limitReq) },
    connectionType: { col: "connection_type", val: body.connectionType },
    tls: { col: "tls", val: body.tls },
    port: { col: "port", val: num(body.port) },
    path: { col: "path", val: body.path },
    sniHost: { col: "sni_host", val: body.sniHost },
    fingerprint: { col: "fingerprint", val: body.fingerprint },
    fragment: { col: "fragment", val: body.fragment },
    alpn: { col: "alpn", val: body.alpn },
    ipLimit: { col: "ip_limit", val: num(body.ipLimit) },
    blockPorn: { col: "block_porn", val: bool(body.blockPorn) },
    blockAds: { col: "block_ads", val: bool(body.blockAds) },
    blockMalware: { col: "block_malware", val: bool(body.blockMalware) },
    dohUrl: { col: "doh_url", val: body.dohUrl },
    userSocks5: { col: "user_socks5", val: body.userSocks5 },
    userProxyIata: { col: "user_proxy_iata", val: body.userProxyIata },
    routeDirect: { col: "route_direct", val: body.routeDirect },
    routeBlock: { col: "route_block", val: body.routeBlock },
    autoRotateProxy: { col: "auto_rotate_proxy", val: bool(body.autoRotateProxy) },
    isActive: { col: "is_active", val: body.isActive === void 0 ? void 0 : body.isActive ? 1 : 0 },
    note: { col: "note", val: body.note },
    autoResetVolDays: { col: "auto_reset_vol_days", val: num(body.autoResetVolDays) },
    autoResetReqDays: { col: "auto_reset_req_days", val: num(body.autoResetReqDays) }
  };
  for (const k of Object.keys(body)) {
    const m = map[k];
    if (m && m.val !== void 0) {
      fields.push(`${m.col} = ?`);
      vals.push(m.val);
    }
  }
  if (!fields.length)
    return c.json({ ok: true });
  fields.push("updated_at = ?");
  vals.push(nowSec());
  vals.push(username);
  await c.env.DB.prepare(`UPDATE users SET ${fields.join(", ")} WHERE username = ? COLLATE NOCASE`).bind(...vals).run();
  return c.json({ ok: true });
});
userRoutes.delete("/:username", requireRole("owner", "admin"), async (c) => {
  await c.env.DB.prepare("DELETE FROM users WHERE username = ? COLLATE NOCASE").bind(c.req.param("username")).run();
  return c.json({ ok: true });
});
userRoutes.post("/bulk", requireRole("owner", "admin"), async (c) => {
  const body = await c.req.json();
  if (!body.usernames?.length)
    return c.json({ error: "no users" }, 400);
  const placeholders = body.usernames.map(() => "?").join(",");
  if (body.action === "delete") {
    await c.env.DB.prepare(`DELETE FROM users WHERE username IN (${placeholders})`).bind(...body.usernames).run();
  } else if (body.action === "disable" || body.action === "enable") {
    const v = body.action === "enable" ? 1 : 0;
    await c.env.DB.prepare(`UPDATE users SET is_active = ? WHERE username IN (${placeholders})`).bind(v, ...body.usernames).run();
  } else if (body.action === "resetVol") {
    await c.env.DB.prepare(`UPDATE users SET used_gb = 0 WHERE username IN (${placeholders})`).bind(...body.usernames).run();
  } else if (body.action === "resetReq") {
    await c.env.DB.prepare(`UPDATE users SET used_req = 0 WHERE username IN (${placeholders})`).bind(...body.usernames).run();
  }
  return c.json({ ok: true });
});
userRoutes.post("/:username/reset-uuid", requireRole("owner", "admin"), async (c) => {
  const uuid = randomUUID();
  const hash = await sha224Hex(uuid);
  await c.env.DB.prepare("UPDATE users SET uuid = ?, trojan_hash = ? WHERE username = ?").bind(uuid, hash, c.req.param("username")).run();
  return c.json({ ok: true, uuid, trojanHash: hash });
});
function num(v) {
  if (v === void 0 || v === null || v === "")
    return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function bool(v) {
  return v ? 1 : 0;
}

// src/routes/proxies.ts
var proxyRoutes = new Hono2();
proxyRoutes.use("*", requireAuth);
proxyRoutes.get("/", async (c) => {
  const country = (c.req.query("country") || "").toUpperCase();
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const pageSize = Math.min(200, parseInt(c.req.query("pageSize") || "50", 10));
  const off = (page - 1) * pageSize;
  const where = country ? "WHERE country = ?" : "";
  const args = country ? [country, pageSize, off] : [pageSize, off];
  const rows = await c.env.DB.prepare(
    `SELECT * FROM proxies ${where} ORDER BY latency_ms IS NULL, latency_ms ASC LIMIT ? OFFSET ?`
  ).bind(...args).all();
  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM proxies ${where}`
  ).bind(...country ? [country] : []).first();
  return c.json({ proxies: rows.results, total: total?.n ?? 0 });
});
proxyRoutes.get("/countries", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT UPPER(country) AS country, COUNT(*) AS count, SUM(CASE WHEN is_active=1 THEN 1 ELSE 0 END) AS active FROM proxies WHERE country IS NOT NULL GROUP BY UPPER(country) ORDER BY count DESC"
  ).all();
  return c.json({ countries: rows.results });
});
proxyRoutes.post("/import", requireRole("owner", "admin"), async (c) => {
  const body = await c.req.json();
  let entries = [];
  if (body.url) {
    const res = await fetch(body.url).catch(() => null);
    if (!res || !res.ok)
      return c.json({ error: "fetch failed" }, 400);
    const text = await res.text();
    entries = parseProxyList(text, body.country);
  } else if (body.rawText) {
    entries = parseProxyList(body.rawText, body.country);
  } else if (Array.isArray(body.list)) {
    entries = body.list.map((u) => normalizeUri(u)).filter(Boolean).map((uri) => ({ uri, country: (body.country || "XX").toUpperCase() }));
  }
  if (!entries.length)
    return c.json({ error: "no proxies parsed" }, 400);
  const stmts = entries.map(
    (e) => c.env.DB.prepare(
      `INSERT OR IGNORE INTO proxies (uri, country, source, is_active, last_checked, created_at)
       VALUES (?, ?, ?, 1, 0, ?)`
    ).bind(e.uri, e.country, body.source || "manual", nowSec())
  );
  await c.env.DB.batch(stmts);
  await syncPool(c.env);
  return c.json({ ok: true, imported: entries.length });
});
proxyRoutes.post("/pool/reload", requireRole("owner", "admin"), async (c) => {
  const n = await syncPool(c.env);
  return c.json({ ok: true, active: n });
});
proxyRoutes.post("/health", requireRole("owner", "admin"), async (c) => {
  const id = c.env.POOL_STATE.idFromName("global");
  c.executionCtx.waitUntil(c.env.POOL_STATE.get(id).fetch("http://do/health-check"));
  return c.json({ ok: true, scheduled: true });
});
proxyRoutes.delete("/:id", requireRole("owner", "admin"), async (c) => {
  await c.env.DB.prepare("DELETE FROM proxies WHERE id = ?").bind(c.req.param("id")).run();
  await syncPool(c.env);
  return c.json({ ok: true });
});
proxyRoutes.post("/:id/toggle", requireRole("owner", "admin"), async (c) => {
  const row = await c.env.DB.prepare("SELECT is_active FROM proxies WHERE id = ?").bind(c.req.param("id")).first();
  if (!row)
    return c.json({ error: "not found" }, 404);
  await c.env.DB.prepare("UPDATE proxies SET is_active = ? WHERE id = ?").bind(row.is_active ? 0 : 1, c.req.param("id")).run();
  await syncPool(c.env);
  return c.json({ ok: true });
});
function normalizeUri(u) {
  const t = u.trim();
  if (!t || t.startsWith("#"))
    return null;
  if (/^(socks4|socks5|socks|http|https):\/\//i.test(t))
    return t;
  if (/^[\w.-]+:\d{2,5}$/.test(t))
    return `socks5://${t}`;
  return null;
}
function parseProxyList(text, countryOverride) {
  const out = [];
  let currentCountry = (countryOverride || "XX").toUpperCase();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t)
      continue;
    if (t.startsWith("#") || t.startsWith("//")) {
      const m = t.match(/[#/]\s*([A-Za-z]{2})\b/);
      if (m)
        currentCountry = m[1].toUpperCase();
      continue;
    }
    if (t.startsWith("["))
      continue;
    const uri = normalizeUri(t);
    if (uri)
      out.push({ uri, country: currentCountry });
  }
  return out;
}
async function syncPool(env) {
  const rows = await env.DB.prepare(
    "SELECT uri, country FROM proxies WHERE is_active = 1"
  ).all();
  const byCountry = {};
  for (const r of rows.results || []) {
    const cc = (r.country || "XX").toUpperCase();
    (byCountry[cc] ||= []).push(r.uri);
  }
  const id = env.POOL_STATE.idFromName("global");
  const stub = env.POOL_STATE.get(id);
  let total = 0;
  for (const [cc, list] of Object.entries(byCountry)) {
    await stub.fetch("http://do/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ country: cc, list })
    });
    total += list.length;
  }
  return total;
}

// src/routes/system.ts
var systemRoutes = new Hono2();
systemRoutes.use("*", requireAuth);
systemRoutes.get("/backup", requireRole("owner", "admin"), async (c) => {
  const env = c.env;
  const [users, settings, proxies, admins] = await Promise.all([
    env.DB.prepare("SELECT * FROM users").all(),
    env.DB.prepare("SELECT * FROM settings").all(),
    env.DB.prepare("SELECT * FROM proxies").all(),
    env.DB.prepare("SELECT id, username, role, is_active, created_at FROM admins").all()
  ]);
  const dump = {
    version: 1,
    exportedAt: nowSec(),
    users: users.results,
    settings: settings.results,
    proxies: proxies.results,
    admins: admins.results
  };
  try {
    await env.BUCKET?.put?.(`backup-${nowSec()}.json`, JSON.stringify(dump), {
      httpMetadata: { contentType: "application/json" }
    });
  } catch {
  }
  return c.body(JSON.stringify(dump, null, 2), 200, {
    "content-type": "application/json",
    "content-disposition": `attachment; filename="aether-backup-${nowSec()}.json"`
  });
});
systemRoutes.post("/restore", requireRole("owner"), async (c) => {
  const env = c.env;
  const body = await c.req.json();
  let userCount = 0, proxyCount = 0;
  if (Array.isArray(body.users)) {
    const stmts = body.users.map(
      (u) => env.DB.prepare(
        `INSERT OR REPLACE INTO users
         (username, uuid, trojan_hash, limit_gb, used_gb, lifetime_gb, expiry_days,
          limit_req, used_req, ip_limit, active_ips, connection_type, tls, port,
          path, sni_host, fingerprint, fragment, cipher_suites, alpn, allow_insecure,
          block_porn, block_ads, block_malware, doh_url, route_direct, route_block,
          user_proxy_iata, user_socks5, user_proxy_ip, auto_rotate_proxy,
          auto_rotate_ip, rotate_minutes, ip_operator, ip_count, ips, last_rotate_time,
          auto_reset_vol_days, auto_reset_req_days, last_reset_vol_time, last_reset_req_time,
          is_active, start_on_first_connect, first_connection_time, last_active, note, group_id,
          created_at, updated_at)
         VALUES (@username,@uuid,@trojan_hash,@limit_gb,@used_gb,@lifetime_gb,@expiry_days,
          @limit_req,@used_req,@ip_limit,@active_ips,@connection_type,@tls,@port,
          @path,@sni_host,@fingerprint,@fragment,@cipher_suites,@alpn,@allow_insecure,
          @block_porn,@block_ads,@block_malware,@doh_url,@route_direct,@route_block,
          @user_proxy_iata,@user_socks5,@user_proxy_ip,@auto_rotate_proxy,
          @auto_rotate_ip,@rotate_minutes,@ip_operator,@ip_count,@ips,@last_rotate_time,
          @auto_reset_vol_days,@auto_reset_req_days,@last_reset_vol_time,@last_reset_req_time,
          @is_active,@start_on_first_connect,@first_connection_time,@last_active,@note,@group_id,
          @created_at,@updated_at)`
      ).bind(u)
    );
    await env.DB.batch(stmts);
    userCount = stmts.length;
  }
  if (Array.isArray(body.proxies)) {
    const stmts = body.proxies.map(
      (p) => env.DB.prepare(
        "INSERT OR IGNORE INTO proxies (uri, country, source, is_active, last_checked, created_at) VALUES (?, ?, ?, 1, 0, ?)"
      ).bind(p.uri, p.country || null, p.source || "restore", nowSec())
    );
    await env.DB.batch(stmts);
    proxyCount = stmts.length;
  }
  if (Array.isArray(body.settings)) {
    const stmts = body.settings.map(
      (s) => env.DB.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)").bind(s.key, s.value, nowSec())
    );
    await env.DB.batch(stmts);
  }
  return c.json({ ok: true, users: userCount, proxies: proxyCount });
});
systemRoutes.get("/settings", async (c) => {
  const rows = await c.env.DB.prepare("SELECT key, value FROM settings").all();
  const obj = {};
  for (const r of rows.results)
    obj[r.key] = r.value;
  return c.json(obj);
});
systemRoutes.put("/settings", requireRole("owner", "admin"), async (c) => {
  const body = await c.req.json();
  const stmts = Object.entries(body).map(
    ([k, v]) => c.env.DB.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)").bind(k, v, nowSec())
  );
  if (stmts.length)
    await c.env.DB.batch(stmts);
  return c.json({ ok: true });
});

// src/provisioner.ts
var BUNDLE_REF = "af577d0225d671cc98a6fc1c91292e1ca93cd32e";
var BUNDLE_BASE = "https://raw.githubusercontent.com/nikzadcr-cmyk/aether-panel/" + BUNDLE_REF + "/";
var WORKER_SOURCE_URL = BUNDLE_BASE + "dist/index.js";
var SCHEMA_URL = BUNDLE_BASE + "migrations/0001_init.sql";
async function provisionAccount(input) {
  const token = input.token.trim();
  if (!token)
    throw new Error("\u062A\u0648\u06A9\u0646 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A");
  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };
  const api2 = "https://api.cloudflare.com/client/v4";
  const verify = await fetch(api2 + "/user/tokens/verify", { headers });
  const vj = await verify.json();
  if (!vj.success) {
    throw new Error("\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: " + (vj.errors?.[0]?.message || "unknown"));
  }
  const accRes = await fetch(api2 + "/accounts", { headers });
  const accJson = await accRes.json();
  if (!accJson.success || !accJson.result?.length) {
    throw new Error("\u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F: " + (accJson.errors?.[0]?.message || ""));
  }
  const accountId = accJson.result[0].id;
  const workerName = (input.workerName || "aether-panel-" + randomSuffix(6)).toLowerCase();
  const suffix = workerName.replace(/[^a-z0-9]/g, "").slice(0, 24) || randomSuffix(6);
  const d1Name = "aether-" + suffix;
  const kvName = "aether-kv-" + suffix;
  const queueName = "aether-q-" + suffix.slice(0, 20);
  const d1 = await ensureD1(api2, headers, accountId, d1Name);
  const kv = await ensureKv(api2, headers, accountId, kvName);
  await ensureQueue(api2, headers, accountId, queueName);
  const srcRes = await fetch(WORKER_SOURCE_URL + "?v=" + Date.now());
  if (!srcRes.ok)
    throw new Error("\u062F\u0631\u06CC\u0627\u0641\u062A \u0633\u0648\u0631\u0633 \u0648\u0631\u06A9\u0631 \u0627\u0632 \u06AF\u06CC\u062A\u200C\u0647\u0627\u0628 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F");
  const workerJs = await srcRes.text();
  const panelSecret = randomHex(32);
  const adminPassword = randomReadablePassword();
  const adminUser = "admin";
  const metadata = {
    main_module: "index.js",
    compatibility_date: "2025-01-15",
    compatibility_flags: ["nodejs_compat"],
    migrations: { tag: "v1", new_sqlite_classes: ["UserState", "PoolState", "RateLimiter"] },
    bindings: [
      { type: "d1", name: "DB", id: d1 },
      { type: "kv_namespace", name: "KV", namespace_id: kv },
      { type: "queue", name: "WRITE_QUEUE", queue_name: queueName },
      {
        type: "durable_object_namespace",
        name: "USER_STATE",
        class_name: "UserState"
      },
      {
        type: "durable_object_namespace",
        name: "POOL_STATE",
        class_name: "PoolState"
      },
      {
        type: "durable_object_namespace",
        name: "RATE_LIMIT",
        class_name: "RateLimiter"
      },
      { type: "plain_text", name: "APP_NAME", text: "Aether Panel" },
      { type: "plain_text", name: "APP_VERSION", text: "0.1.0" },
      {
        type: "plain_text",
        name: "PRIMARY_FETCH",
        text: "https://raw.githubusercontent.com/panel-zeus/Z-E-U-S/main/ips.txt"
      },
      {
        type: "plain_text",
        name: "DEFAULT_DOH",
        text: "https://cloudflare-dns.com/dns-query"
      },
      { type: "plain_text", name: "PROXY_FALLBACK_HOSTS", text: "fra,ams,lhr,cdg,fra2" },
      { type: "secret_text", name: "PANEL_SECRET", text: panelSecret },
      { type: "secret_text", name: "ADMIN_BOOTSTRAP_PASSWORD", text: adminPassword }
    ],
    observability: { enabled: true }
  };
  const form = new FormData();
  form.set("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "metadata.json");
  form.set("index.js", new Blob([workerJs], { type: "application/javascript+module" }), "index.js");
  const upload = await fetch(
    api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName,
    { method: "PUT", headers: { Authorization: "Bearer " + token }, body: form }
  );
  const upJson = await upload.json();
  if (!upJson.success) {
    throw new Error("\u0622\u067E\u0644\u0648\u062F \u0648\u0631\u06A9\u0631 \u0646\u0627\u0645\u0648\u0641\u0642: " + (upJson.errors?.[0]?.message || "unknown"));
  }
  await fetch(api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/subdomain", {
    method: "POST",
    headers,
    body: JSON.stringify({ enabled: true })
  }).catch(() => {
  });
  let subdomain = accountId.slice(0, 12);
  try {
    const sd = await fetch(api2 + "/accounts/" + accountId + "/workers/subdomain", { headers });
    const sdj = await sd.json();
    if (sdj.success && sdj.result?.subdomain)
      subdomain = sdj.result.subdomain;
  } catch {
  }
  await applyD1Schema(api2, headers, accountId, d1);
  const panelBase = "https://" + workerName + "." + subdomain + ".workers.dev";
  const adminLogin = JSON.stringify({ username: adminUser, password: adminPassword });
  let loginOk = false;
  for (let i = 0; i < 10; i++) {
    try {
      const ab = await fetch(panelBase + "/api/auth/auto-bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const abText = await ab.text().catch(() => "");
      if (ab.ok) {
        const lr = await fetch(panelBase + "/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: adminLogin
        });
        if (lr.ok) {
          loginOk = true;
          console.log("bootstrap ok after", i, "iters");
          break;
        }
        const lrText = await lr.text().catch(() => "");
        if (i % 4 === 0)
          console.warn("bootstrap poll", i, "ab=", ab.status, abText.slice(0, 80), "lr=", lr.status, lrText.slice(0, 80));
      } else if (i % 4 === 0) {
        console.warn("bootstrap poll", i, "ab=", ab.status, abText.slice(0, 100));
      }
    } catch (e) {
      if (i % 4 === 0)
        console.warn("bootstrap poll", i, "err:", e.message);
    }
    await new Promise((res) => setTimeout(res, 2e3));
  }
  if (!loginOk) {
    console.warn("bootstrap did not complete within poll window for", workerName);
  }
  await fetch(api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({
      queue_name: queueName,
      dead_letter_queue: void 0,
      settings: { batch_size: 100, max_retries: 3, max_concurrency: 5 }
    })
  }).catch(() => {
  });
  await fetch(api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/schedules", {
    method: "PUT",
    headers,
    body: JSON.stringify({
      schedules: [
        { cron: "* * * * *" },
        { cron: "*/5 * * * *" },
        { cron: "0 * * * *" }
      ]
    })
  }).catch(() => {
  });
  const url = "https://" + workerName + "." + subdomain + ".workers.dev";
  return {
    ok: true,
    workerName,
    url,
    d1Id: d1,
    kvId: kv,
    adminUser,
    adminPassword,
    panelSecret
  };
}
async function updateWorkerDeployment(input) {
  const token = input.token.trim();
  if (!token)
    throw new Error("\u062A\u0648\u06A9\u0646 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A");
  const api2 = "https://api.cloudflare.com/client/v4";
  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };
  let accountId = input.accountId;
  if (!accountId) {
    const accRes = await fetch(api2 + "/accounts", { headers });
    const aj = await accRes.json();
    if (!aj.success || !aj.result?.length)
      throw new Error("\u062D\u0633\u0627\u0628 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F: " + (aj.errors?.[0]?.message || ""));
    accountId = aj.result[0].id;
  }
  const workerName = input.workerName;
  const cur = await fetch(api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/settings", { headers });
  const curJson = await cur.json();
  const binds = curJson.success ? curJson.result?.bindings || [] : [];
  const d1Bind = binds.find((b) => b.type === "d1" && b.name === "DB");
  const kvBind = binds.find((b) => b.type === "kv_namespace" && b.name === "KV");
  const qBind = binds.find((b) => b.type === "queue" && b.name === "WRITE_QUEUE");
  const d1 = d1Bind?.id || await ensureD1(api2, headers, accountId);
  const kv = kvBind?.namespace_id || await ensureKv(api2, headers, accountId);
  const queueName = qBind?.queue_name || "aether-writes";
  await ensureQueue(api2, headers, accountId, queueName);
  let subdomain = accountId.slice(0, 12);
  try {
    const sd = await fetch(api2 + "/accounts/" + accountId + "/workers/subdomain", { headers });
    const sdj = await sd.json();
    if (sdj.success && sdj.result?.subdomain)
      subdomain = sdj.result.subdomain;
  } catch {
  }
  const srcRes = await fetch(WORKER_SOURCE_URL + "?v=" + Date.now());
  if (!srcRes.ok)
    throw new Error("\u062F\u0631\u06CC\u0627\u0641\u062A \u0633\u0648\u0631\u0633 \u062C\u062F\u06CC\u062F \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F");
  const workerJs = await srcRes.text();
  const metadata = {
    main_module: "index.js",
    compatibility_date: "2025-01-15",
    compatibility_flags: ["nodejs_compat"],
    bindings: [
      { type: "d1", name: "DB", id: d1 },
      { type: "kv_namespace", name: "KV", namespace_id: kv },
      { type: "queue", name: "WRITE_QUEUE", queue_name: queueName },
      { type: "durable_object_namespace", name: "USER_STATE", class_name: "UserState", script_name: workerName },
      { type: "durable_object_namespace", name: "POOL_STATE", class_name: "PoolState", script_name: workerName },
      { type: "durable_object_namespace", name: "RATE_LIMIT", class_name: "RateLimiter", script_name: workerName }
    ],
    keep_bindings: [
      { type: "secret_text", name: "PANEL_SECRET" },
      { type: "secret_text", name: "ADMIN_BOOTSTRAP_PASSWORD" },
      { type: "plain_text", name: "APP_NAME" },
      { type: "plain_text", name: "APP_VERSION" },
      { type: "plain_text", name: "PRIMARY_FETCH" },
      { type: "plain_text", name: "DEFAULT_DOH" },
      { type: "plain_text", name: "PROXY_FALLBACK_HOSTS" }
    ],
    migrations: { tag: "v1", new_sqlite_classes: ["UserState", "PoolState", "RateLimiter"] },
    observability: { enabled: true }
  };
  const form = new FormData();
  form.set("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "metadata.json");
  form.set("index.js", new Blob([workerJs], { type: "application/javascript+module" }), "index.js");
  const up = await fetch(api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token },
    body: form
  });
  const uj = await up.json();
  if (!uj.success)
    throw new Error("\u0622\u067E\u0644\u0648\u062F \u0633\u0648\u0631\u0633 \u062C\u062F\u06CC\u062F \u0646\u0627\u0645\u0648\u0641\u0642: " + (uj.errors?.[0]?.message || ""));
  await fetch(api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({ queue_name: queueName, settings: { batch_size: 100, max_retries: 3, max_concurrency: 5 } })
  }).catch(() => {
  });
  await fetch(api2 + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/schedules", {
    method: "PUT",
    headers,
    body: JSON.stringify({ schedules: [{ cron: "* * * * *" }, { cron: "*/5 * * * *" }, { cron: "0 * * * *" }] })
  }).catch(() => {
  });
  const url = "https://" + workerName + "." + subdomain + ".workers.dev";
  return { ok: true, workerName, url };
}
async function ensureD1(api2, headers, accountId, name = "aether") {
  const list = await fetch(api2 + "/accounts/" + accountId + "/d1/database?name=" + encodeURIComponent(name), { headers });
  const lj = await list.json();
  const existing = lj.result?.find((d) => d.name === name);
  if (existing)
    return existing.uuid;
  const create = await fetch(api2 + "/accounts/" + accountId + "/d1/database", {
    method: "POST",
    headers,
    body: JSON.stringify({ name })
  });
  const cj = await create.json();
  if (!cj.success || !cj.result)
    throw new Error("\u0633\u0627\u062E\u062A D1 \u0646\u0627\u0645\u0648\u0641\u0642: " + (cj.errors?.[0]?.message || ""));
  return cj.result.uuid;
}
async function ensureKv(api2, headers, accountId, title = "aether-kv") {
  const list = await fetch(api2 + "/accounts/" + accountId + "/storage/kv/namespaces?per_page=100", { headers });
  const lj = await list.json();
  const existing = (lj.result || []).find((n) => n.title === title);
  if (existing)
    return existing.id;
  const create = await fetch(api2 + "/accounts/" + accountId + "/storage/kv/namespaces", {
    method: "POST",
    headers,
    body: JSON.stringify({ title })
  });
  const cj = await create.json();
  if (!cj.success || !cj.result)
    throw new Error("\u0633\u0627\u062E\u062A KV \u0646\u0627\u0645\u0648\u0641\u0642: " + (cj.errors?.[0]?.message || ""));
  return cj.result.id;
}
async function ensureQueue(api2, headers, accountId, name = "aether-writes") {
  const list = await fetch(api2 + "/accounts/" + accountId + "/queues", { headers });
  const lj = await list.json();
  if ((lj.result || []).some((q) => q.queue_name === name))
    return;
  await fetch(api2 + "/accounts/" + accountId + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({ queue_name: name })
  });
}
async function applyD1Schema(api2, headers, accountId, d1Id) {
  const res = await fetch(SCHEMA_URL + "?v=" + Date.now());
  if (!res.ok)
    return;
  let sql = await res.text();
  sql = sql.split("\n").filter((l) => !l.trimStart().startsWith("--")).join("\n");
  const stmts = sql.split(/;(?:\s|\n|$)/).map((s) => s.trim()).filter((s) => s.length > 0 && !s.startsWith("PRAGMA"));
  if (stmts.length === 0)
    return;
  try {
    const r = await fetch(api2 + "/accounts/" + accountId + "/d1/database/" + d1Id + "/query", {
      method: "POST",
      headers,
      body: JSON.stringify({ sql: stmts.join(";\n") + ";" })
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      if (!/already exists|duplicate/i.test(body)) {
        console.warn("D1 schema batch failed, falling back to per-statement:", body.slice(0, 300));
        for (const stmt of stmts) {
          try {
            await fetch(api2 + "/accounts/" + accountId + "/d1/database/" + d1Id + "/query", {
              method: "POST",
              headers,
              body: JSON.stringify({ sql: stmt })
            });
          } catch (e) {
            console.warn("D1 schema stmt failed:", e.message);
          }
        }
      }
    } else {
      const j = await r.json();
      if (j.errors?.length) {
        const realErr = j.errors.find((e) => !/already exists|duplicate/i.test(e.message));
        if (realErr)
          console.warn("D1 schema error:", realErr.message);
      }
      if (Array.isArray(j.result)) {
        j.result.forEach((rr, i) => {
          if (rr && rr.success === false && rr.error && !/already exists|duplicate/i.test(rr.error)) {
            console.warn("D1 stmt[" + i + "] failed:", rr.error, stmts[i]?.slice(0, 80));
          }
        });
      }
    }
  } catch (e) {
    console.warn("D1 schema fetch error:", e.message);
  }
}
function randomSuffix(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  for (let i = 0; i < n; i++)
    out += chars[arr[i] % chars.length];
  return out;
}
function randomHex(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomReadablePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digit = "23456789";
  const all = upper + lower + digit;
  const out = [];
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  out.push(upper[a[0] % upper.length]);
  out.push(lower[a[1] % lower.length]);
  out.push(digit[a[2] % digit.length]);
  for (let i = 3; i < 12; i++)
    out.push(all[a[i] % all.length]);
  for (let i = out.length - 1; i > 0; i--) {
    const j = a[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

// src/telegram/bot.ts
var HOME_KB = {
  inline_keyboard: [
    [{ text: "\u2795 \u062B\u0628\u062A \u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631", callback_data: "menu:register" }],
    [{ text: "\u{1F680} \u0633\u0627\u062E\u062A \u067E\u0646\u0644 \u062C\u062F\u06CC\u062F", callback_data: "menu:build" }],
    [{ text: "\u{1F504} \u0622\u067E\u062F\u06CC\u062A \u067E\u0646\u0644", callback_data: "menu:update" }],
    [{ text: "\u{1F511} \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632", callback_data: "menu:recover" }],
    [{ text: "\u{1F4CA} \u0644\u06CC\u0633\u062A \u062D\u0633\u0627\u0628\u200C\u0647\u0627", callback_data: "menu:list" }],
    [{ text: "\u2139\uFE0F \u0631\u0627\u0647\u0646\u0645\u0627", callback_data: "menu:help" }]
  ]
};
function BACK_TO_HOME() {
  return { inline_keyboard: [[{ text: "\u2192 \u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC", callback_data: "menu:home" }]] };
}
function accountPickerKb(accounts, action) {
  const rows = accounts.map((a) => {
    const icon = a.panel ? "\u2705" : "\u2B1C";
    const label = icon + " " + truncate(a.name, 22) + (a.panel ? " \xB7 \u0633\u0627\u062E\u062A\u0647\u200C\u0634\u062F\u0647" : "");
    return [{ text: label, callback_data: "acct:" + a.id + ":" + action }];
  });
  rows.push([{ text: "\u2192 \u0628\u0627\u0632\u06AF\u0634\u062A", callback_data: "menu:home" }]);
  return { inline_keyboard: rows };
}
function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "\u2026" : s;
}
async function handleTelegramUpdate(req, env) {
  if (!env.TELEGRAM_TOKEN)
    return new Response("bot disabled", { status: 404 });
  const update = await req.json();
  try {
    if (update.callback_query)
      return handleCb(update.callback_query, env);
    if (update.message)
      return handleMsg(update.message, env);
  } catch (e) {
    console.error("tg error", e);
  }
  return new Response("ok");
}
async function handleCb(cb, env) {
  const chat = cb.message?.chat;
  if (!chat) {
    await answerCb(env, cb.id);
    return new Response("ok");
  }
  const [ns, action, arg] = cb.data.split(":");
  if (ns === "menu") {
    await handleMenuAction(env, chat, cb.message.message_id, action || "home");
    await answerCb(env, cb.id);
    return new Response("ok");
  }
  if (ns === "acct") {
    const state = await getState(env, chat.id) || { accounts: [] };
    const acc = (state.accounts || []).find((a) => a.id === action);
    if (!acc) {
      await answerCb(env, cb.id, "\u062D\u0633\u0627\u0628 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F", true);
      return new Response("ok");
    }
    if (arg === "build") {
      await answerCb(env, cb.id);
      if (acc.panel) {
        const kb = {
          inline_keyboard: [
            [{ text: "\u{1F517} \u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u067E\u0646\u0644", url: acc.panel }],
            [{ text: "\u267B\uFE0F \u0633\u0627\u062E\u062A \u062F\u0648\u0628\u0627\u0631\u0647 (\u0627\u0648\u0631\u0631\u0627\u06CC\u062A)", callback_data: "acct:" + acc.id + ":rebuild" }],
            [{ text: "\u2192 \u0628\u0627\u0632\u06AF\u0634\u062A", callback_data: "menu:build" }]
          ]
        };
        await editText(
          env,
          chat,
          cb.message.message_id,
          "\u0627\u06CC\u0646 \u062D\u0633\u0627\u0628 \u0642\u0628\u0644\u0627\u064B \u067E\u0646\u0644 \u062F\u0627\u0631\u062F:\n\n\u{1F517} " + acc.panel + "\n\u{1F464} " + (acc.adminUser || "admin") + "\n\u{1F511} " + (acc.admin || "\u2014") + "\n\n\u0627\u06AF\u0631 \u0628\u062E\u0648\u0627\u0647\u06CC \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \u062F\u0648\u0628\u0627\u0631\u0647 \u0628\u0633\u0627\u0632\u06CC (\u0648\u0631\u06A9\u0631 \u062C\u062F\u06CC\u062F \u0628\u0627 D1/KV \u062C\u062F\u06CC\u062F).",
          kb
        );
        return new Response("ok");
      }
      await runBuild(env, chat, cb.message.message_id, acc);
      return new Response("ok");
    }
    if (arg === "rebuild") {
      await answerCb(env, cb.id);
      await runBuild(env, chat, cb.message.message_id, acc);
      return new Response("ok");
    }
    if (arg === "update") {
      await answerCb(env, cb.id, "\u062F\u0631 \u062D\u0627\u0644 \u0622\u067E\u062F\u06CC\u062A...");
      if (!acc.worker) {
        await editText(env, chat, cb.message.message_id, "\u0627\u06CC\u0646 \u062D\u0633\u0627\u0628 \u0647\u0646\u0648\u0632 \u067E\u0646\u0644\u06CC \u0646\u0633\u0627\u062E\u062A\u0647.", BACK_TO_HOME());
        return new Response("ok");
      }
      try {
        const r = await updateWorkerDeployment({
          token: acc.token,
          workerName: acc.worker,
          accountId: acc.accountId
        });
        await editText(
          env,
          chat,
          cb.message.message_id,
          "\u2705 \u067E\u0646\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u0622\u062E\u0631\u06CC\u0646 \u0646\u0633\u062E\u0647 \u0622\u067E\u062F\u06CC\u062A \u0634\u062F.\n\n\u{1F517} " + r.url + "/panel",
          HOME_KB
        );
      } catch (e) {
        await editText(
          env,
          chat,
          cb.message.message_id,
          "\u274C \u062E\u0637\u0627 \u062F\u0631 \u0622\u067E\u062F\u06CC\u062A: " + escapeHtml(e.message),
          BACK_TO_HOME()
        );
      }
      return new Response("ok");
    }
    if (arg === "recover") {
      await answerCb(env, cb.id);
      if (acc.panel) {
        await editText(
          env,
          chat,
          cb.message.message_id,
          "\u{1F511} \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0648\u0631\u0648\u062F \u067E\u0646\u0644 <b>" + escapeHtml(acc.name) + "</b>:\n\n\u{1F517} " + acc.panel + "\n\u{1F464} " + (acc.adminUser || "admin") + "\n\u{1F511} <code>" + escapeHtml(acc.admin || "\u2014") + "</code>",
          HOME_KB
        );
      } else {
        await editText(
          env,
          chat,
          cb.message.message_id,
          "\u0627\u06CC\u0646 \u062D\u0633\u0627\u0628 \u0647\u0646\u0648\u0632 \u067E\u0646\u0644\u06CC \u0646\u0633\u0627\u062E\u062A\u0647 \u0627\u0633\u062A.",
          BACK_TO_HOME()
        );
      }
      return new Response("ok");
    }
    if (arg === "list") {
      await answerCb(env, cb.id);
      await showAccountDetail(env, chat, cb.message.message_id, acc);
      return new Response("ok");
    }
  }
  await answerCb(env, cb.id);
  return new Response("ok");
}
async function handleMenuAction(env, chat, messageId, action) {
  if (action === "home") {
    await editText(env, chat, messageId, "\u{1F3E0} <b>\u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC</b>\n\u06CC\u06A9\u06CC \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646:", HOME_KB);
    return;
  }
  if (action === "register") {
    await setState(env, chat.id, { ...await getState(env, chat.id) || {}, step: "awaiting_token" });
    await editText(
      env,
      chat,
      messageId,
      "\u{1F511} <b>\u0633\u0627\u062E\u062A \u062A\u0648\u06A9\u0646 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631</b>\n\n\u06F1) \u0628\u0631\u0648 \u0628\u0647: https://dash.cloudflare.com/profile/api-tokens\n\u06F2) <b>Create Token \u2192 Custom token</b>\n\u06F3) \u0627\u06CC\u0646 permission\u0647\u0627 \u0631\u0627 \u0628\u062F\u0647:\n   \u2022 Account \xB7 Workers Scripts \u2192 <b>Edit</b>\n   \u2022 Account \xB7 D1 \u2192 <b>Edit</b>\n   \u2022 Account \xB7 Workers KV \u2192 <b>Edit</b>\n   \u2022 Account \xB7 Queues \u2192 <b>Edit</b>\n   \u2022 Account Settings \u2192 <b>Read</b>\n\u06F4) Account Resources \u2192 <b>All accounts</b>\n\u06F5) Create Token \u0648 \u0645\u062A\u0646 \u062A\u0648\u06A9\u0646 \u0631\u0627 \u0647\u0645\u06CC\u0646\u200C\u062C\u0627 \u0628\u0641\u0631\u0633\u062A.\n\n\u0628\u0631\u0627\u06CC \u0644\u063A\u0648 /cancel \u0628\u0632\u0646.",
      {
        inline_keyboard: [
          [{ text: "\u{1F517} \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0633\u0627\u062E\u062A \u062A\u0648\u06A9\u0646", url: "https://dash.cloudflare.com/profile/api-tokens" }],
          [{ text: "\u2192 \u0628\u0627\u0632\u06AF\u0634\u062A", callback_data: "menu:home" }]
        ]
      }
    );
    return;
  }
  const state = await getState(env, chat.id) || { accounts: [] };
  const accs = state.accounts || [];
  if (action === "list") {
    if (!accs.length) {
      await editText(env, chat, messageId, "\u0647\u0646\u0648\u0632 \u062D\u0633\u0627\u0628\u06CC \u062B\u0628\u062A \u0646\u06A9\u0631\u062F\u06CC. \u0627\u0648\u0644 \u0627\u0632 \xAB\u062B\u0628\u062A \u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631\xBB \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646.", HOME_KB);
      return;
    }
    const text = "\u{1F4CB} <b>\u062D\u0633\u0627\u0628\u200C\u0647\u0627\u06CC \u062A\u0648</b>\n\u0628\u0631\u0627\u06CC \u062F\u06CC\u062F\u0646 \u062C\u0632\u0626\u06CC\u0627\u062A \u0647\u0631 \u062D\u0633\u0627\u0628 \u0631\u0648\u06CC \u0622\u0646 \u0628\u0632\u0646:\n\n" + accs.map((a, i) => {
      const status = a.panel ? "\u2705 \u0633\u0627\u062E\u062A\u0647\u200C\u0634\u062F\u0647" : "\u2B1C \u0633\u0627\u062E\u062A\u0647\u200C\u0646\u0634\u062F\u0647";
      return i + 1 + ". <b>" + escapeHtml(a.name) + "</b> \u2014 " + status;
    }).join("\n");
    await editText(env, chat, messageId, text, accountPickerKb(accs, "list"));
    return;
  }
  if (action === "build" || action === "update" || action === "recover") {
    if (!accs.length) {
      await editText(
        env,
        chat,
        messageId,
        "\u0627\u0648\u0644 \u0628\u0627\u06CC\u062F \u06CC\u06A9 \u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631 \u062B\u0628\u062A \u06A9\u0646\u06CC.\n\u0627\u0632 \u062F\u06A9\u0645\u0647 \u0632\u06CC\u0631 \u0628\u0631\u0648:",
        { inline_keyboard: [
          [{ text: "\u2795 \u062B\u0628\u062A \u062D\u0633\u0627\u0628 \u06A9\u0644\u0648\u062F\u0641\u0644\u0631", callback_data: "menu:register" }],
          [{ text: "\u2192 \u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC", callback_data: "menu:home" }]
        ] }
      );
      return;
    }
    const titles = {
      build: "\u{1F680} \u0631\u0648\u06CC \u06A9\u062F\u0627\u0645 \u062D\u0633\u0627\u0628 \u067E\u0646\u0644 \u0628\u0633\u0627\u0632\u0645\u061F",
      update: "\u{1F504} \u06A9\u062F\u0627\u0645 \u067E\u0646\u0644 \u0622\u067E\u062F\u06CC\u062A \u0634\u0648\u062F\u061F",
      recover: "\u{1F511} \u0631\u0645\u0632 \u06A9\u062F\u0627\u0645 \u067E\u0646\u0644 \u0631\u0627 \u0645\u06CC\u200C\u062E\u0648\u0627\u0647\u06CC\u061F"
    };
    const hasBuilt = accs.some((a) => !!a.panel);
    if (action !== "build" && !hasBuilt) {
      await editText(env, chat, messageId, "\u0647\u06CC\u0686 \u062D\u0633\u0627\u0628\u06CC \u0647\u0646\u0648\u0632 \u067E\u0646\u0644 \u0646\u0633\u0627\u062E\u062A\u0647. \u0627\u0648\u0644 \u06CC\u06A9 \u067E\u0646\u0644 \u0628\u0633\u0627\u0632.", HOME_KB);
      return;
    }
    const filtered = action === "build" ? accs : accs.filter((a) => !!a.panel);
    await editText(env, chat, messageId, titles[action], accountPickerKb(filtered, action));
    return;
  }
  if (action === "help") {
    await editText(
      env,
      chat,
      messageId,
      "\u26A1\uFE0F <b>Aether Panel Bot</b>\n\n\u0628\u0627 \u0627\u06CC\u0646 \u0631\u0628\u0627\u062A \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \u067E\u0646\u0644 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC VLESS/Trojan/VMess \u0631\u0648\u06CC Cloudflare Worker \u0628\u0633\u0627\u0632\u06CC.\n\n\u2022 <b>\u062B\u0628\u062A \u062D\u0633\u0627\u0628</b>: \u06CC\u06A9 API Token \u0645\u06CC\u200C\u062F\u0647\u06CC\u060C \u0631\u0628\u0627\u062A \u062F\u0631 KV \u0646\u06AF\u0647 \u0645\u06CC\u200C\u062F\u0627\u0631\u062F.\n\u2022 <b>\u0633\u0627\u062E\u062A \u067E\u0646\u0644</b>: \u0631\u0648\u06CC \u0647\u0631 \u062D\u0633\u0627\u0628 \u06CC\u06A9 \u0648\u0631\u06A9\u0631 + D1 + KV \u0645\u06CC\u200C\u0633\u0627\u0632\u062F.\n\u2022 <b>\u0622\u067E\u062F\u06CC\u062A</b>: \u0622\u062E\u0631\u06CC\u0646 \u0633\u0648\u0631\u0633 \u06AF\u06CC\u062A\u0647\u0627\u0628 \u0631\u0648\u06CC \u0647\u0645\u0627\u0646 \u0648\u0631\u06A9\u0631 \u062F\u06CC\u067E\u0644\u0648\u06CC \u0645\u06CC\u200C\u0634\u0648\u062F.\n\u2022 <b>\u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632</b>: \u0631\u0645\u0632 \u0627\u0648\u0644\u06CC\u0647 \u0631\u0627 \u0646\u0645\u0627\u06CC\u0634 \u0645\u06CC\u200C\u062F\u0647\u062F.\n\n\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC: @nikzadcr",
      HOME_KB
    );
    return;
  }
}
async function handleMsg(msg, env) {
  const text = (msg.text || "").trim();
  const chatId = msg.chat.id;
  if (text === "/start" || text === "/menu") {
    await clearState(env, chatId);
    await sendMessage(env, chatId, "\u{1F44B} <b>\u0628\u0647 \u0631\u0628\u0627\u062A Aether Panel \u062E\u0648\u0634 \u0622\u0645\u062F\u06CC!</b>\n\u06CC\u06A9\u06CC \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0646\u0648 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646:", { reply_markup: HOME_KB });
    return new Response("ok");
  }
  if (text === "/cancel" || text === "/stop") {
    await clearState(env, chatId);
    await sendMessage(env, chatId, "\u0644\u063A\u0648 \u0634\u062F.", { reply_markup: HOME_KB });
    return new Response("ok");
  }
  const state = await getState(env, chatId) || {};
  if (state.step === "awaiting_token") {
    if (!/^[A-Za-z0-9_\-]{30,}$/.test(text)) {
      await sendMessage(env, chatId, "\u274C \u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u062F\u0648\u0628\u0627\u0631\u0647 \u0628\u0641\u0631\u0633\u062A \u06CC\u0627 /cancel \u0628\u0632\u0646.", { reply_markup: BACK_TO_HOME() });
      return new Response("ok");
    }
    const waitMsg = await sendMessage(env, chatId, "\u{1F511} \u062A\u0648\u06A9\u0646 \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F\u060C \u062F\u0631 \u062D\u0627\u0644 \u0627\u0639\u062A\u0628\u0627\u0631\u0633\u0646\u062C\u06CC...");
    try {
      const headers = { Authorization: "Bearer " + text, "Content-Type": "application/json" };
      const v = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", { headers });
      const vj = await v.json();
      if (!vj.success)
        throw new Error(vj.errors?.[0]?.message || "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631");
      const ar = await fetch("https://api.cloudflare.com/client/v4/accounts", { headers });
      const aj = await ar.json();
      if (!aj.success || !aj.result?.length)
        throw new Error(aj.errors?.[0]?.message || "\u062D\u0633\u0627\u0628\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F");
      const account = aj.result[0];
      const newAcc = {
        id: Math.random().toString(36).slice(2, 8),
        name: account.name,
        accountId: account.id,
        token: text
      };
      const newState = { accounts: [...state.accounts || [], newAcc] };
      await setState(env, chatId, newState);
      await editText(
        env,
        { id: chatId },
        waitMsg,
        "\u2705 \u062D\u0633\u0627\u0628 <b>" + escapeHtml(account.name) + "</b> \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F.\n\u062D\u0627\u0644\u0627 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \u0627\u0632 \u0645\u0646\u0648 \u067E\u0646\u0644 \u0628\u0633\u0627\u0632\u06CC.",
        HOME_KB
      );
    } catch (e) {
      await editText(
        env,
        { id: chatId },
        waitMsg,
        "\u274C \u062E\u0637\u0627: " + escapeHtml(e.message) + "\n\u062A\u0648\u06A9\u0646 \u0631\u0627 \u0686\u06A9 \u06A9\u0646 \u06CC\u0627 /cancel \u0628\u0632\u0646.",
        BACK_TO_HOME()
      );
    }
    return new Response("ok");
  }
  await sendMessage(env, chatId, "\u06CC\u06A9\u06CC \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0646\u0648 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646:", { reply_markup: HOME_KB });
  return new Response("ok");
}
async function runBuild(env, chat, statusMsgId, acc) {
  await editText(
    env,
    chat,
    statusMsgId,
    "\u{1F680} \u062F\u0631 \u062D\u0627\u0644 \u0633\u0627\u062E\u062A \u067E\u0646\u0644 \u0631\u0648\u06CC \u062D\u0633\u0627\u0628 <b>" + escapeHtml(acc.name) + "</b>...\n\u0627\u06CC\u0646 \u06A9\u0627\u0631 \u06F2\u06F0 \u062A\u0627 \u06F4\u06F0 \u062B\u0627\u0646\u06CC\u0647 \u0637\u0648\u0644 \u0645\u06CC\u200C\u06A9\u0634\u062F.",
    { inline_keyboard: [] }
  );
  try {
    const result = await provisionAccount({ token: acc.token });
    const all = await getState(env, chat.id) || { accounts: [] };
    const idx = (all.accounts || []).findIndex((a) => a.id === acc.id);
    const updated = {
      ...acc,
      worker: result.workerName,
      panel: result.url + "/panel",
      adminUser: result.adminUser,
      admin: result.adminPassword,
      builtAt: Date.now()
    };
    if (idx >= 0) {
      all.accounts[idx] = updated;
      await setState(env, chat.id, all);
    }
    await editText(
      env,
      chat,
      statusMsgId,
      "\u2705 <b>\u067E\u0646\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0633\u0627\u062E\u062A\u0647 \u0634\u062F!</b>\n\n\u{1F517} \u067E\u0646\u0644: " + result.url + "/panel\n\u{1F464} \u06A9\u0627\u0631\u0628\u0631: <code>" + result.adminUser + "</code>\n\u{1F511} \u0631\u0645\u0632: <code>" + result.adminPassword + "</code>\n\n\u{1F4F2} \u0627\u0634\u062A\u0631\u0627\u06A9 \u062A\u0633\u062A: " + result.url + "/sub/test\n\n\u067E\u0633 \u0627\u0632 \u0648\u0631\u0648\u062F \u0631\u0645\u0632 \u0631\u0627 \u0639\u0648\u0636 \u06A9\u0646 \u0648 \u06A9\u0627\u0631\u0628\u0631\u0647\u0627\u06CC\u062A \u0631\u0627 \u0628\u0633\u0627\u0632.",
      {
        inline_keyboard: [
          [{ text: "\u{1F517} \u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u067E\u0646\u0644", url: result.url + "/panel" }],
          [{ text: "\u2192 \u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC", callback_data: "menu:home" }]
        ]
      }
    );
  } catch (e) {
    await editText(
      env,
      chat,
      statusMsgId,
      "\u274C \u062E\u0637\u0627 \u062F\u0631 \u0633\u0627\u062E\u062A \u067E\u0646\u0644:\n" + escapeHtml(e.message),
      BACK_TO_HOME()
    );
  }
}
async function showAccountDetail(env, chat, messageId, acc) {
  const lines = [
    "\u{1FA90} <b>" + escapeHtml(acc.name) + "</b>",
    "",
    "\u0648\u0636\u0639\u06CC\u062A: " + (acc.panel ? "\u2705 \u067E\u0646\u0644 \u0633\u0627\u062E\u062A\u0647 \u0634\u062F\u0647" : "\u2B1C \u0647\u0646\u0648\u0632 \u0633\u0627\u062E\u062A\u0647 \u0646\u0634\u062F\u0647")
  ];
  if (acc.panel) {
    lines.push("\u067E\u0646\u0644: " + acc.panel);
    lines.push("\u06A9\u0627\u0631\u0628\u0631: " + (acc.adminUser || "admin"));
    lines.push("\u0631\u0645\u0632: <code>" + escapeHtml(acc.admin || "\u2014") + "</code>");
  }
  const kb = {
    inline_keyboard: [
      acc.panel ? [{ text: "\u{1F517} \u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u067E\u0646\u0644", url: acc.panel }] : [{ text: "\u{1F680} \u0633\u0627\u062E\u062A \u067E\u0646\u0644", callback_data: "acct:" + acc.id + ":build" }],
      acc.panel ? [{ text: "\u{1F504} \u0622\u067E\u062F\u06CC\u062A", callback_data: "acct:" + acc.id + ":update" }] : [],
      acc.panel ? [{ text: "\u{1F511} \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632", callback_data: "acct:" + acc.id + ":recover" }] : [],
      [{ text: "\u2192 \u0628\u0627\u0632\u06AF\u0634\u062A", callback_data: "menu:list" }]
    ].filter((r) => r.length > 0)
  };
  await editText(env, chat, messageId, lines.join("\n"), kb);
}
async function getState(env, chatId) {
  try {
    const v = await env.KV.get("tgstate:" + chatId);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
async function setState(env, chatId, state) {
  await env.KV.put("tgstate:" + chatId, JSON.stringify(state), { expirationTtl: 60 * 60 * 24 * 30 });
}
async function clearState(env, chatId) {
  await env.KV.delete("tgstate:" + chatId);
}
function api(token, method, body) {
  return fetch("https://api.telegram.org/bot" + token + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}
async function sendMessage(env, chatId, text, extra = {}) {
  const r = await api(env.TELEGRAM_TOKEN, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra
  });
  const j = await r.json();
  return j.ok && j.result ? j.result.message_id : 0;
}
async function editText(env, chat, messageId, text, extra = {}) {
  if (!messageId) {
    await sendMessage(env, chat.id, text, extra);
    return;
  }
  await api(env.TELEGRAM_TOKEN, "editMessageText", {
    chat_id: chat.id,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra
  });
}
async function answerCb(env, id, text, alert) {
  await api(env.TELEGRAM_TOKEN, "answerCallbackQuery", {
    callback_query_id: id,
    text,
    show_alert: !!alert
  });
}
function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

// src/ui/panel.ts
function loginHtml() {
  return `<!doctype html><html lang="fa" dir="rtl"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Aether \u2014 \u0648\u0631\u0648\u062F</title>
<link rel="icon" href="/icon.svg"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"/>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body{font-family:Vazirmatn,system-ui;background:#000;color:#e5e7eb;min-height:100vh}
  .bg-grid{background:radial-gradient(ellipse at top right,rgba(34,211,238,.15),transparent 60%),radial-gradient(ellipse at bottom left,rgba(139,92,246,.12),transparent 60%),#000}
  .glass{background:rgba(10,12,20,.72);backdrop-filter:blur(18px);border:1px solid rgba(148,163,184,.1)}
  .input{background:#0a0c14;border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:12px 14px;color:#e5e7eb;width:1px;min-width:100%;transition:.15s}
  .input:focus{outline:none;border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.15)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:10px 16px;font-weight:600;transition:.15s;cursor:pointer;border:none}
  .btn-primary{background:linear-gradient(135deg,#22d3ee,#0ea5e9);color:#00131c}
  .btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
  .logo-pulse{animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{filter:drop-shadow(0 0 12px rgba(34,211,238,.4))}50%{filter:drop-shadow(0 0 24px rgba(34,211,238,.7))}}
  .float{animation:float 6s ease-in-out infinite}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
</style></head>
<body class="bg-grid grid place-items-center p-4">
<div class="w-full max-w-md">
  <div class="text-center mb-8 float">
    <div class="inline-block logo-pulse">
      <img src="/icon.svg" class="w-20 h-20 mx-auto" alt="Aether"/>
    </div>
    <h1 class="text-3xl font-black mt-4 bg-gradient-to-l from-cyan-300 to-sky-500 bg-clip-text text-transparent">AETHER PANEL</h1>
    <p class="text-slate-400 text-sm mt-1">Cloudflare Worker \xB7 D1 \xB7 Durable Objects</p>
  </div>
  <div class="glass rounded-3xl p-8 shadow-2xl shadow-cyan-500/5">
    <h2 class="text-lg font-bold mb-1">\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644</h2>
    <p class="text-xs text-slate-400 mb-6">\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u062F\u0645\u06CC\u0646 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F</p>
    <form id="f" class="space-y-4">
      <div>
        <label class="text-xs text-slate-400 mb-1.5 block">\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC</label>
        <input id="u" class="input" autocomplete="username" placeholder="admin" required>
      </div>
      <div>
        <label class="text-xs text-slate-400 mb-1.5 block">\u0631\u0645\u0632 \u0639\u0628\u0648\u0631</label>
        <input id="p" type="password" class="input" autocomplete="current-password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required>
      </div>
      <button class="btn btn-primary w-full py-3 text-base">\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644 \u2192</button>
      <p id="err" class="text-rose-400 text-sm text-center min-h-[1.25rem]"></p>
    </form>
  </div>
  <p class="text-center text-slate-600 text-xs mt-6">Aether Panel v0.1 \xB7 MIT licensed</p>
</div>
<script>
f.addEventListener('submit', async function(e){
  e.preventDefault();
  err.textContent = '';
  var btn = f.querySelector('button');
  btn.disabled = true; btn.textContent = '\u062F\u0631 \u062D\u0627\u0644 \u0648\u0631\u0648\u062F...';
  try {
    var r = await fetch('/api/auth/login', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({username:u.value, password:p.value})});
    if (r.ok) location.href = '/panel';
    else { var j = await r.json().catch(function(){return {}}); err.textContent = j.error || '\u0648\u0631\u0648\u062F \u0646\u0627\u0645\u0648\u0641\u0642'; }
  } catch(ex) { err.textContent = '\u062E\u0637\u0627\u06CC \u0634\u0628\u06A9\u0647'; }
  btn.disabled = false; btn.textContent = '\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644 \u2192';
});
</script></body></html>`;
}
function panelHtml(version, bootstrap = false) {
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Aether Panel</title>
<link rel="icon" href="/icon.svg"/>
<link rel="manifest" href="/manifest.json"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
<style>
  :root {
    --bg: #000000;
    --panel: #0a0c14;
    --panel-2: #0f1320;
    --border: rgba(148,163,184,.12);
    --border-strong: rgba(148,163,184,.22);
    --text: #e5e7eb;
    --muted: #64748b;
    --cyan: #22d3ee;
    --sky: #0ea5e9;
    --emerald: #10b981;
    --rose: #f43f5e;
    --amber: #f59e0b;
    --violet: #8b5cf6;
  }
  * { box-sizing: border-box; }
  html,body { margin:0; padding:0; font-family:Vazirmatn,system-ui,sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  body { background:
    radial-gradient(ellipse 80% 50% at 100% -10%, rgba(34,211,238,.10), transparent 60%),
    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(139,92,246,.08), transparent 60%),
    #000;
  }
  .glass { background:rgba(10,12,20,.72); backdrop-filter:blur(20px); border:1px solid var(--border); }
  .app-topbar { position:sticky; top:0; z-index:40; background:rgba(5,7,14,.82); backdrop-filter:blur(18px); border-bottom:1px solid var(--border); }
  .app-topbar .inner { max-width:1100px; margin:0 auto; padding:12px 16px; display:flex; align-items:center; gap:12px; }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit; flex-shrink:0; }
  .brand img { width:34px; height:34px; }
  .brand b { font-size:15px; letter-spacing:.5px; background:linear-gradient(135deg,#67e8f9,#0ea5e9); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .brand small { display:block; font-size:9.5px; color:var(--muted); font-family:ui-monospace,monospace; margin-top:-2px; }
  .topnav { display:flex; gap:4px; margin:0 8px; flex:1; min-width:0; overflow-x:auto; scrollbar-width:none; }
  .topnav::-webkit-scrollbar { display:none; }
  .nav-item { display:inline-flex; align-items:center; gap:7px; padding:8px 12px; border-radius:10px; color:#94a3b8; cursor:pointer; transition:.15s; font-size:13px; font-weight:600; white-space:nowrap; flex-shrink:0; }
  .nav-item svg { width:16px; height:16px; }
  .nav-item:hover { background:rgba(34,211,238,.06); color:#e5e7eb; }
  .nav-item.active { background:linear-gradient(135deg,rgba(34,211,238,.18),rgba(14,165,233,.08)); color:#67e8f9; box-shadow:inset 0 0 0 1px rgba(34,211,238,.25); }
  .top-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .me-chip { display:flex; align-items:center; gap:8px; background:rgba(148,163,184,.06); border:1px solid var(--border); border-radius:999px; padding:4px 10px 4px 4px; }
  .me-chip .avatar { width:28px; height:28px; border-radius:999px; display:grid; place-items:center; font-weight:700; font-size:12px; color:#00131c; }
  .me-chip .name { font-size:12px; font-weight:600; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* mobile bottom nav */
  .bottomnav { display:none; }
  .mobile-toolbar { display:none; }
  @media (max-width:768px) {
    .topnav { display:none; }
    .me-chip .name { display:none; }
    .search-top { display:none !important; }
    .mobile-toolbar { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
    .mobile-toolbar .search-box { flex:1; min-width:0; }
    .mobile-toolbar .search-box input { width:100%; padding:10px 14px 10px 36px; font-size:13px; }
    .app-topbar .inner { padding:10px 12px; gap:8px; }
    .brand b { font-size:14px; }
    .brand small { font-size:8.5px; }
    .brand img { width:30px; height:30px; }
    .bottomnav { position:fixed; left:8px; right:8px; bottom:8px; z-index:45; display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:6px; background:rgba(8,10,18,.92); backdrop-filter:blur(18px); border:1px solid var(--border-strong); border-radius:18px; box-shadow:0 10px 30px -10px rgba(0,0,0,.7); }
    .bottomnav .nav-item { flex-direction:column; gap:2px; padding:7px 4px; font-size:10px; border-radius:12px; justify-content:center; }
    .bottomnav .nav-item svg { width:19px; height:19px; }
    main.app-main { padding:14px 12px 96px !important; }
    .users-table-desktop { display:none !important; }
    .users-grid-mobile { display:grid !important; grid-template-columns:1fr; gap:10px; }
    .user-card { background:linear-gradient(135deg,var(--panel),var(--panel-2)); border:1px solid var(--border); border-radius:14px; padding:14px; }
    .user-card .row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .user-card .name { font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px; min-width:0; }
    .user-card .uuid { font-size:10px; color:var(--muted); font-family:ui-monospace,monospace; }
    .user-card .meta { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; font-size:11px; }
    .user-card .meta > div { background:rgba(148,163,184,.05); border-radius:8px; padding:7px 9px; }
    .user-card .meta .lbl { display:block; color:var(--muted); font-size:9.5px; margin-bottom:2px; }
    .user-card .actions { display:flex; gap:6px; margin-top:10px; }
    .user-card .actions .btn { flex:1; padding:8px 6px; font-size:11px; }
    .user-card .progress { flex:1; min-width:0; }
  }
  .users-grid-mobile { display:none; }
  .stat-card { position:relative; overflow:hidden; border-radius:18px; padding:18px; border:1px solid var(--border); background:linear-gradient(135deg,var(--panel),var(--panel-2)); transition:.2s; }
  .stat-card:hover { transform:translateY(-2px); border-color:var(--border-strong); }
  .stat-card .ic { width:42px; height:42px; border-radius:12px; display:grid; place-items:center; }
  .stat-card .val { font-size:26px; font-weight:800; margin-top:10px; letter-spacing:-.5px; }
  .stat-card .lbl { font-size:12px; color:var(--muted); margin-top:2px; }
  .stat-card::after { content:''; position:absolute; inset:-40% -40% auto auto; width:140px; height:140px; border-radius:50%; opacity:.25; filter:blur(40px); }
  .stat-card.cyan::after { background:#22d3ee; }
  .stat-card.emerald::after { background:#10b981; }
  .stat-card.violet::after { background:#8b5cf6; }
  .stat-card.amber::after { background:#f59e0b; }

  .btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:9px 14px; border-radius:11px; font-weight:600; font-size:13px; cursor:pointer; border:1px solid transparent; transition:.15s; white-space:nowrap; font-family:inherit; }
  .btn:hover { transform:translateY(-1px); }
  .btn:active { transform:translateY(0); }
  .btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  .btn-primary { background:linear-gradient(135deg,#22d3ee,#0ea5e9); color:#00131c; box-shadow:0 4px 20px -6px rgba(34,211,238,.5); }
  .btn-violet { background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:#fff; }
  .btn-emerald { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
  .btn-rose { background:linear-gradient(135deg,#f43f5e,#be123c); color:#fff; }
  .btn-amber { background:linear-gradient(135deg,#f59e0b,#d97706); color:#1a1200; }
  .btn-ghost { background:rgba(148,163,184,.06); color:#cbd5e1; border-color:var(--border); }
  .btn-ghost:hover { background:rgba(148,163,184,.12); }
  .btn-icon { padding:8px; width:34px; height:34px; }

  .input, select, textarea { background:#070911; border:1px solid var(--border); border-radius:11px; padding:10px 12px; color:var(--text); font-family:inherit; font-size:13px; width:100%; transition:.15s; }
  .input:focus, select:focus, textarea:focus { outline:none; border-color:#22d3ee; box-shadow:0 0 0 3px rgba(34,211,238,.12); }
  .input::placeholder { color:#475569; }
  label.field { display:block; margin-bottom:12px; }
  label.field > span { display:block; font-size:11px; color:var(--muted); margin-bottom:5px; font-weight:500; }

  table { width:100%; border-collapse:separate; border-spacing:0; }
  th { text-align:right; padding:12px 14px; font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; background:rgba(148,163,184,.03); border-bottom:1px solid var(--border); }
  td { padding:13px 14px; font-size:13px; border-bottom:1px solid rgba(148,163,184,.06); vertical-align:middle; }
  tr:hover td { background:rgba(34,211,238,.025); }
  .user-cell { display:flex; align-items:center; gap:10px; }
  .avatar { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; font-weight:700; font-size:13px; color:#00131c; flex-shrink:0; }
  .mono { font-family:ui-monospace,'SF Mono',Menlo,monospace; direction:ltr; text-align:left; display:inline-block; }
  .chip { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:999px; font-size:10.5px; font-weight:600; }
  .chip-green { background:rgba(16,185,129,.12); color:#34d399; }
  .chip-red { background:rgba(244,63,94,.12); color:#fb7185; }
  .chip-cyan { background:rgba(34,211,238,.1); color:#67e8f9; }
  .chip-violet { background:rgba(139,92,246,.12); color:#a78bfa; }
  .chip-amber { background:rgba(245,158,11,.12); color:#fbbf24; }
  .chip-slate { background:rgba(148,163,184,.1); color:#94a3b8; }
  .progress { height:6px; background:rgba(148,163,184,.1); border-radius:999px; overflow:hidden; min-width:90px; }
  .progress > i { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#22d3ee,#0ea5e9); transition:width .3s; }
  .progress.warn > i { background:linear-gradient(90deg,#f59e0b,#d97706); }
  .progress.danger > i { background:linear-gradient(90deg,#f43f5e,#be123c); }

  .switch { position:relative; display:inline-block; width:40px; height:22px; }
  .switch input { opacity:0; width:0; height:0; }
  .switch .slider { position:absolute; cursor:pointer; inset:0; background:#1e293b; border-radius:999px; transition:.2s; }
  .switch .slider::before { content:''; position:absolute; width:16px; height:16px; right:3px; top:3px; background:#fff; border-radius:50%; transition:.2s; }
  .switch input:checked + .slider { background:linear-gradient(135deg,#22d3ee,#0ea5e9); }
  .switch input:checked + .slider::before { transform:translateX(-18px); }

  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(6px); display:none; align-items:flex-start; justify-content:center; padding:40px 16px; z-index:50; overflow-y:auto; }
  .modal-backdrop.open { display:flex; }
  .modal { background:linear-gradient(180deg,#0c1020,#070a13); border:1px solid var(--border-strong); border-radius:20px; width:100%; max-width:680px; box-shadow:0 30px 80px -20px rgba(0,0,0,.8); animation:pop .2s ease; }
  @keyframes pop { from { opacity:0; transform:translateY(8px) scale(.98);} to {opacity:1; transform:none;} }
  .modal-head { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .modal-body { padding:22px 24px; max-height:70vh; overflow-y:auto; }
  .modal-foot { padding:16px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:8px; }

  .toast-wrap { position:fixed; left:20px; bottom:20px; z-index:100; display:flex; flex-direction:column; gap:8px; }
  .toast { padding:12px 18px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:0 10px 30px -8px rgba(0,0,0,.6); animation:slidein .25s ease; display:flex; align-items:center; gap:8px; max-width:360px; }
  @keyframes slidein { from { opacity:0; transform:translateY(10px) translateX(-20px);} to {opacity:1; transform:none;} }
  .toast.success { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
  .toast.error { background:linear-gradient(135deg,#f43f5e,#be123c); color:#fff; }
  .toast.info { background:linear-gradient(135deg,#0ea5e9,#0369a1); color:#fff; }

  .section-title { font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; margin:18px 0 10px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width: 768px) {
    main.app-main { padding: 14px 12px 96px !important; }
    .stat-card { padding: 14px; border-radius: 14px; }
    .stat-card .val { font-size: 20px; }
    .stat-card .ic { width: 36px; height: 36px; }
    th, td { padding: 10px 8px; font-size: 12px; }
    td .avatar { width: 28px; height: 28px; font-size: 11px; }
    .modal { margin: 10px; border-radius: 16px; }
    .modal-body { padding: 16px; max-height: 75vh; }
    .modal-head { padding: 14px 16px; }
    .modal-foot { padding: 12px 16px; }
    .grid2 { grid-template-columns: 1fr; }
    .copy-link { font-size: 10px; }
    header { gap: 8px !important; margin-bottom: 16px !important; }
    .search-box { max-width: none !important; }
    #btn-new span { display: none; }
    .btn { padding: 8px 12px; font-size: 12px; }
    h1 { font-size: 18px !important; }
    .toast-wrap { left: 12px; right: 12px; bottom: 12px; }
    .toast { max-width: none; font-size: 12px; }
    .progress { min-width: 60px; }
  }
  @media (min-width: 769px) {
    .mobile-show { display: none !important; }
  }
  .mobile-show { display:none; }
  .search-box { position:relative; }
  .search-box input { padding-right:38px; }
  .search-box svg { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
  .qr-box { background:#fff; padding:14px; border-radius:14px; display:inline-block; }
  .qr-box img, .qr-box canvas { display:block; }
  .copy-link { font-family:ui-monospace,monospace; font-size:11px; direction:ltr; text-align:left; background:#070911; border:1px solid var(--border); padding:10px; border-radius:9px; word-break:break-all; max-height:80px; overflow-y:auto; }
  .tab { padding:8px 14px; border-radius:9px; font-size:12px; font-weight:600; color:var(--muted); cursor:pointer; border:1px solid transparent; }
  .tab.active { background:rgba(34,211,238,.1); color:#67e8f9; border-color:rgba(34,211,238,.25); }
  .pulse-dot { width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 0 0 rgba(16,185,129,.6); animation:pulseD 2s infinite; }
  @keyframes pulseD { 0%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)} }
  .scrollbar::-webkit-scrollbar { width:8px; height:8px; }
  .scrollbar::-webkit-scrollbar-thumb { background:rgba(148,163,184,.2); border-radius:99px; }
  .scrollbar::-webkit-scrollbar-track { background:transparent; }
  .empty { text-align:center; padding:50px 20px; color:var(--muted); }
  .empty svg { margin:0 auto 12px; opacity:.4; }
  .kbd { font-family:ui-monospace,monospace; font-size:10px; background:rgba(148,163,184,.1); padding:2px 6px; border-radius:5px; border:1px solid var(--border); }
</style>
</head>
<body>

<!-- ===== BOOTSTRAP (first admin) ===== -->
<div id="bootstrap" class="min-h-screen grid place-items-center p-4" style="display:none">
  <div class="glass rounded-3xl p-8 w-full max-w-md">
    <div class="text-center mb-6">
      <img src="/icon.svg" class="w-16 h-16 mx-auto mb-3" alt=""/>
      <h1 class="text-2xl font-black bg-gradient-to-l from-cyan-300 to-sky-500 bg-clip-text text-transparent">\u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC Aether</h1>
      <p class="text-sm text-slate-400 mt-1">\u0627\u0648\u0644\u06CC\u0646 \u0627\u062F\u0645\u06CC\u0646 \u0631\u0627 \u0628\u0633\u0627\u0632</p>
    </div>
    <div class="space-y-3">
      <input id="setup-user" class="input" placeholder="\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0645\u062F\u06CC\u0631"/>
      <input id="setup-pass" type="password" class="input" placeholder="\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 (\u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631)"/>
      <button id="setup-btn" class="btn btn-primary w-full py-3">\u0627\u06CC\u062C\u0627\u062F \u0645\u062F\u06CC\u0631 \u0648 \u0648\u0631\u0648\u062F</button>
    </div>
  </div>
</div>

<!-- ===== APP SHELL ===== -->
<div id="app" style="display:none;min-height:100vh">
  <header class="app-topbar">
    <div class="inner">
      <a class="brand" href="/panel">
        <img src="/icon.svg" alt=""/>
        <span><b>AETHER PANEL</b><small>v${version}</small></span>
      </a>
      <nav class="topnav">
        <div class="nav-item active" data-view="dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          \u062F\u0627\u0634\u0628\u0648\u0631\u062F
        </div>
        <div class="nav-item" data-view="users">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          \u06A9\u0627\u0631\u0628\u0631\u0627\u0646
        </div>
        <div class="nav-item" data-view="proxies">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          \u0627\u0633\u062A\u062E\u0631 \u067E\u0631\u0648\u06A9\u0633\u06CC
        </div>
        <div class="nav-item" data-view="settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          \u062A\u0646\u0638\u06CC\u0645\u0627\u062A
        </div>
      </nav>
      <div class="top-actions">
        <div class="search-box search-top" style="width:200px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="search" class="input" placeholder="\u062C\u0633\u062A\u062C\u0648..." style="padding:8px 12px 8px 12px;font-size:12px"/>
        </div>
        <button id="btn-new" class="btn btn-primary" title="\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span class="hidden sm:inline">\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F</span>
        </button>
        <div class="me-chip" title="\u062E\u0631\u0648\u062C">
          <div class="avatar" id="me-avatar" style="background:linear-gradient(135deg,#22d3ee,#0ea5e9)">A</div>
          <span class="name" id="me-name">\u2014</span>
          <button id="btn-logout" class="btn btn-icon btn-ghost" style="width:28px;height:28px" title="\u062E\u0631\u0648\u062C">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <main class="app-main" style="max-width:1100px;margin:0 auto;padding:20px 16px 40px">

    <div class="mobile-toolbar">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="search-mobile" class="input" placeholder="\u062C\u0633\u062A\u062C\u0648\u06CC \u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627 UUID..."/>
      </div>
    </div>

    <!-- DASHBOARD -->
    <section data-page="dashboard">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card cyan">
          <div class="ic" style="background:rgba(34,211,238,.15);color:#67e8f9">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="val" id="stat-users">\u2014</div>
          <div class="lbl">\u06A9\u0644 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646</div>
        </div>
        <div class="stat-card emerald">
          <div class="ic" style="background:rgba(16,185,129,.15);color:#34d399">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="val" id="stat-active">\u2014</div>
          <div class="lbl">\u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0641\u0639\u0627\u0644</div>
        </div>
        <div class="stat-card violet">
          <div class="ic" style="background:rgba(139,92,246,.15);color:#a78bfa">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div class="val" id="stat-gb">\u2014</div>
          <div class="lbl">\u0645\u0635\u0631\u0641 \u06A9\u0644</div>
        </div>
        <div class="stat-card amber">
          <div class="ic" style="background:rgba(245,158,11,.15);color:#fbbf24">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="val" id="stat-req">\u2014</div>
          <div class="lbl">\u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627</div>
        </div>
      </div>

      <div class="glass rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b" style="border-color:var(--border)">
          <div>
            <h2 class="font-bold">\u0622\u062E\u0631\u06CC\u0646 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646</h2>
            <p class="text-xs text-slate-400 mt-0.5">\u0628\u0631\u0627\u06CC \u0645\u062F\u06CC\u0631\u06CC\u062A \u0647\u0645\u0647 \u0628\u0647 \u062A\u0628 \xAB\u06A9\u0627\u0631\u0628\u0631\u0627\u0646\xBB \u0628\u0631\u0648\u06CC\u062F</p>
          </div>
          <button class="btn btn-ghost" onclick="go('users')">\u0647\u0645\u0647 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u2190</button>
        </div>
        <div class="overflow-x-auto" id="recent-users"></div>
      </div>
    </section>

    <!-- USERS -->
    <section data-page="users" style="display:none">
      <div class="glass rounded-2xl overflow-hidden">
        <div class="flex flex-wrap items-center gap-2 p-4 border-b" style="border-color:var(--border)">
          <div class="flex gap-2 flex-wrap" id="bulk-bar" style="display:none">
            <button class="btn btn-emerald" data-bulk="enable">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              \u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC
            </button>
            <button class="btn btn-amber" data-bulk="disable">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</button>
            <button class="btn btn-ghost" data-bulk="resetVol">\u0631\u06CC\u0633\u062A \u062D\u062C\u0645</button>
            <button class="btn btn-rose" data-bulk="delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              \u062D\u0630\u0641
            </button>
            <span class="text-xs text-slate-400 self-center" id="sel-count"></span>
          </div>
          <div class="mr-auto flex items-center gap-2">
            <span class="text-xs text-slate-400" id="users-count">\u06F0 \u06A9\u0627\u0631\u0628\u0631</span>
            <button id="btn-refresh" class="btn btn-ghost btn-icon" title="\u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto scrollbar" id="users-table"></div>
      </div>
    </section>

    <!-- PROXIES -->
    <section data-page="proxies" style="display:none">
      <div class="glass rounded-2xl p-5 mb-4">
        <h2 class="font-bold mb-1">\u0627\u0641\u0632\u0648\u062F\u0646 \u067E\u0631\u0648\u06A9\u0633\u06CC</h2>
        <p class="text-xs text-slate-400 mb-4">\u06CC\u06A9 URL \u0641\u0627\u06CC\u0644 \u0645\u062A\u0646\u06CC \u0644\u06CC\u0633\u062A \u067E\u0631\u0648\u06A9\u0633\u06CC \u0648\u0627\u0631\u062F \u06A9\u0646 (\u0647\u0631 \u062E\u0637 socks5://user:pass@host:port \u06CC\u0627 host:port)</p>
        <div class="flex flex-wrap gap-2">
          <input id="proxy-url" class="input flex-1 min-w-[200px]" placeholder="https://example.com/proxy/US.txt"/>
          <input id="proxy-cc" class="input" style="max-width:120px" placeholder="\u06A9\u062F \u06A9\u0634\u0648\u0631 (US)"/>
          <button id="proxy-import" class="btn btn-primary">\u0627\u06CC\u0645\u067E\u0648\u0631\u062A</button>
          <button id="proxy-health" class="btn btn-ghost">\u0628\u0631\u0631\u0633\u06CC \u0633\u0644\u0627\u0645\u062A</button>
          <button id="proxy-reload" class="btn btn-ghost">\u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC DO</button>
        </div>
        <p class="text-xs text-slate-500 mt-2">\u0628\u0639\u062F \u0627\u0632 \u0627\u06CC\u0645\u067E\u0648\u0631\u062A\u060C \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0627\u0631\u0628\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC \xAB\u06A9\u062F \u06A9\u0634\u0648\u0631 \u0627\u0633\u062A\u062E\u0631\xBB \u0631\u0627 \u0633\u062A \u06A9\u0646\u06CC \u062A\u0627 \u0628\u0647\u200C\u0635\u0648\u0631\u062A \u062A\u0635\u0627\u062F\u0641\u06CC \u0627\u0632 \u067E\u0631\u0648\u06A9\u0633\u06CC\u200C\u0647\u0627\u06CC \u0633\u0627\u0644\u0645 \u0622\u0646 \u06A9\u0634\u0648\u0631 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0634\u0648\u062F.</p>
      </div>
      <div class="glass rounded-2xl overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between" style="border-color:var(--border)">
          <h3 class="font-bold">\u067E\u0631\u0648\u06A9\u0633\u06CC\u200C\u0647\u0627</h3>
          <span id="proxy-count" class="text-xs text-slate-400">\u2014</span>
        </div>
        <div class="overflow-x-auto scrollbar" id="proxies-table"></div>
      </div>
    </section>

    <!-- SETTINGS -->
    <section data-page="settings" style="display:none">
      <div class="grid md:grid-cols-2 gap-4">
        <div class="glass rounded-2xl p-5">
          <h3 class="font-bold mb-1">\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC</h3>
          <p class="text-xs text-slate-400 mb-4">\u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631</p>
          <label class="field"><span>\u0631\u0645\u0632 \u0641\u0639\u0644\u06CC</span><input id="cur-pass" type="password" class="input"/></label>
          <label class="field"><span>\u0631\u0645\u0632 \u062C\u062F\u06CC\u062F (\u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631)</span><input id="new-pass" type="password" class="input"/></label>
          <button id="btn-change-pass" class="btn btn-primary w-full">\u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632</button>
        </div>
        <div class="glass rounded-2xl p-5">
          <h3 class="font-bold mb-1">\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u200C\u06AF\u06CC\u0631\u06CC</h3>
          <p class="text-xs text-slate-400 mb-4">\u062F\u0631\u06CC\u0627\u0641\u062A \u06CC\u0627 \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u06A9\u0627\u0645\u0644 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647</p>
          <div class="flex gap-2 flex-wrap">
            <a href="/api/system/backup" class="btn btn-violet" id="btn-backup">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              \u062F\u0627\u0646\u0644\u0648\u062F \u0628\u06A9\u0627\u067E
            </a>
            <label class="btn btn-ghost cursor-pointer">
              \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0627\u0632 \u0641\u0627\u06CC\u0644
              <input type="file" id="restore-file" accept=".json" style="display:none"/>
            </label>
          </div>
        </div>
        <div class="glass rounded-2xl p-5 md:col-span-2">
          <h3 class="font-bold mb-1">\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0633\u06CC\u0633\u062A\u0645</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u0646\u0633\u062E\u0647</div><div class="font-mono mt-1">${version}</div></div>
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u0645\u062D\u0644 \u0627\u062C\u0631\u0627</div><div class="font-mono mt-1">Cloudflare</div></div>
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647</div><div class="font-mono mt-1">D1 + DO</div></div>
            <div class="p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><div class="text-xs text-slate-400">\u067E\u0631\u0648\u062A\u06A9\u0644\u200C\u0647\u0627</div><div class="font-mono mt-1">VLESS/Trojan/VMess</div></div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <nav class="bottomnav">
    <div class="nav-item active" data-view="dashboard">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
      \u062F\u0627\u0634\u0628\u0648\u0631\u062F
    </div>
    <div class="nav-item" data-view="users">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      \u06A9\u0627\u0631\u0628\u0631\u0627\u0646
    </div>
    <div class="nav-item" data-view="proxies">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      \u067E\u0631\u0648\u06A9\u0633\u06CC
    </div>
    <div class="nav-item" data-view="settings">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      \u062A\u0646\u0638\u06CC\u0645\u0627\u062A
    </div>
  </nav>
</div>

<!-- ===== User Modal ===== -->
<div id="modal-user" class="modal-backdrop">
  <div class="modal">
    <div class="modal-head">
      <div>
        <h3 id="mu-title" class="font-bold text-lg">\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F</h3>
        <p class="text-xs text-slate-400 mt-0.5" id="mu-sub">\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F</p>
      </div>
      <button class="btn btn-ghost btn-icon" data-close-modal>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body scrollbar">
      <div class="section-title" style="margin-top:0">\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u067E\u0627\u06CC\u0647</div>
      <div class="grid2">
        <label class="field"><span>\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC *</span><input id="f-username" class="input" placeholder="my-user"/></label>
        <label class="field"><span>UUID (\u062E\u0627\u0644\u06CC = \u062A\u0635\u0627\u062F\u0641\u06CC)</span><input id="f-uuid" class="input mono" placeholder="auto"/></label>
      </div>
      <div class="section-title">\u0645\u062D\u062F\u0648\u062F\u06CC\u062A\u200C\u0647\u0627</div>
      <div class="grid2">
        <label class="field"><span>\u062D\u062C\u0645 (GB)</span><input id="f-limitGb" type="number" step="0.1" class="input" placeholder="\u0645\u062B\u0644\u0627\u064B 10"/></label>
        <label class="field"><span>\u0627\u0646\u0642\u0636\u0627 (\u0631\u0648\u0632)</span><input id="f-expiryDays" type="number" class="input" placeholder="30"/></label>
        <label class="field"><span>\u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u062F\u0631\u062E\u0648\u0627\u0633\u062A</span><input id="f-limitReq" type="number" class="input" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
        <label class="field"><span>\u062D\u062F\u0627\u06A9\u062B\u0631 \u062F\u0633\u062A\u06AF\u0627\u0647 \u0647\u0645\u0632\u0645\u0627\u0646</span><input id="f-ipLimit" type="number" class="input" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
      </div>
      <div class="section-title">\u0627\u062A\u0635\u0627\u0644</div>
      <div class="grid2">
        <label class="field"><span>\u067E\u0631\u0648\u062A\u06A9\u0644</span>
          <select id="f-connectionType" class="input">
            <option value="vless+trojan">VLESS + Trojan (\u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC)</option>
            <option value="vless">\u0641\u0642\u0637 VLESS</option>
            <option value="trojan">\u0641\u0642\u0637 Trojan</option>
            <option value="vmess">VMess</option>
            <option value="vless+trojan+vmess">\u0647\u0631 \u0633\u0647</option>
          </select>
        </label>
        <label class="field"><span>\u067E\u0648\u0631\u062A</span>
          <select id="f-port" class="input">
            <option value="443">443</option>
            <option value="8443">8443</option>
            <option value="2053">2053</option>
            <option value="2083">2083</option>
            <option value="2087">2087</option>
            <option value="2096">2096</option>
            <option value="80">80 (\u0628\u062F\u0648\u0646 TLS)</option>
            <option value="8080">8080 (\u0628\u062F\u0648\u0646 TLS)</option>
          </select>
        </label>
        <label class="field"><span>\u0645\u0633\u06CC\u0631 (Path)</span><input id="f-path" class="input mono" placeholder="/" value="/"/></label>
        <label class="field"><span>Fingerprint</span>
          <select id="f-fingerprint" class="input">
            <option value="chrome">chrome</option>
            <option value="firefox">firefox</option>
            <option value="safari">safari</option>
            <option value="ios">ios</option>
            <option value="android">android</option>
            <option value="edge">edge</option>
            <option value="random">random</option>
            <option value="unsafe">unsafe</option>
          </select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>SNI / Host (\u062E\u0627\u0644\u06CC = \u0647\u0627\u0633\u062A \u0648\u0631\u06A9\u0631)</span><input id="f-sniHost" class="input" placeholder="example.com"/></label>
        <label class="field" style="grid-column:1/-1"><span>Fragment \u0645\u062B\u0644 200-3000,1-2,tlshello</span><input id="f-fragment" class="input mono" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
      </div>
      <div class="section-title">\u0645\u0633\u06CC\u0631\u06CC\u0627\u0628\u06CC \u0648 \u0641\u06CC\u0644\u062A\u0631 \u0645\u062D\u062A\u0648\u0627</div>
      <div class="grid2">
        <label class="field"><span>\u06A9\u062F \u06A9\u0634\u0648\u0631 \u0627\u0633\u062A\u062E\u0631 \u067E\u0631\u0648\u06A9\u0633\u06CC (\u0645\u062B\u0644 US)</span><input id="f-userProxyIata" class="input mono" placeholder="\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC"/></label>
        <label class="field"><span>\u067E\u0631\u0648\u06A9\u0633\u06CC \u0628\u0627\u0644\u0627\u062F\u0633\u062A \u062F\u0633\u062A\u06CC</span><input id="f-userSocks5" class="input mono" placeholder="socks5://u:p@host:port"/></label>
        <label class="field" style="grid-column:1/-1"><span>\u062F\u0627\u0645\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0633\u062A\u0642\u06CC\u0645 (\u0628\u0627 \u06A9\u0627\u0645\u0627)</span><input id="f-routeDirect" class="input" placeholder="example.ir, domain.com"/></label>
        <label class="field" style="grid-column:1/-1"><span>\u062F\u0627\u0645\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0633\u062F\u0648\u062F (\u0628\u0627 \u06A9\u0627\u0645\u0627)</span><input id="f-routeBlock" class="input" placeholder="ads.example.com"/></label>
        <label class="field" style="grid-column:1/-1"><span>DoH \u0633\u0641\u0627\u0631\u0634\u06CC</span><input id="f-dohUrl" class="input mono" placeholder="https://cloudflare-dns.com/dns-query"/></label>
      </div>
      <div class="flex flex-wrap gap-5 mt-3">
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-blockPorn"><span class="slider"></span></span>\u0645\u0633\u062F\u0648\u062F\u0633\u0627\u0632\u06CC NSFW</label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-blockAds"><span class="slider"></span></span>\u0645\u0633\u062F\u0648\u062F\u0633\u0627\u0632\u06CC \u062A\u0628\u0644\u06CC\u063A</label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-blockMalware"><span class="slider"></span></span>\u0628\u062F\u0627\u0641\u0632\u0627\u0631</label>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><span class="switch"><input type="checkbox" id="f-isActive" checked><span class="slider"></span></span>\u06A9\u0627\u0631\u0628\u0631 \u0641\u0639\u0627\u0644</label>
      </div>
      <label class="field mt-4"><span>\u06CC\u0627\u062F\u062F\u0627\u0634\u062A</span><textarea id="f-note" rows="2" class="input" placeholder="\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u062F\u0627\u062E\u0644\u06CC..."></textarea></label>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close-modal>\u0627\u0646\u0635\u0631\u0627\u0641</button>
      <button class="btn btn-primary" id="mu-save">\u0630\u062E\u06CC\u0631\u0647 \u06A9\u0627\u0631\u0628\u0631</button>
    </div>
  </div>
</div>

<!-- ===== Sub Modal (QR + links) ===== -->
<div id="modal-sub" class="modal-backdrop">
  <div class="modal" style="max-width:520px">
    <div class="modal-head">
      <h3 class="font-bold text-lg">\u0627\u0634\u062A\u0631\u0627\u06A9 \u06A9\u0627\u0631\u0628\u0631</h3>
      <button class="btn btn-ghost btn-icon" data-close-modal>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div id="sub-qr" class="flex justify-center mb-4"></div>
      <div class="text-xs text-slate-400 mb-1.5">\u0644\u06CC\u0646\u06A9 \u0627\u0634\u062A\u0631\u0627\u06A9 (\u06A9\u067E\u06CC \u06A9\u0646 \u0648 \u062F\u0631 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0648\u0627\u0631\u062F \u06A9\u0646):</div>
      <div class="flex gap-2 mb-3">
        <div class="copy-link flex-1" id="sub-url"></div>
        <button class="btn btn-primary" id="sub-copy">\u06A9\u067E\u06CC</button>
      </div>
      <div class="text-xs text-slate-400 mb-1.5">\u0641\u0631\u0645\u062A\u200C\u0647\u0627\u06CC \u062F\u06CC\u06AF\u0631:</div>
      <div class="flex gap-2 flex-wrap mb-3" id="sub-formats"></div>
      <div class="text-xs text-slate-400 mb-1.5">\u0644\u06CC\u0646\u06A9\u200C\u0647\u0627\u06CC \u0645\u0633\u062A\u0642\u06CC\u0645:</div>
      <div class="copy-link" id="sub-raw"></div>
    </div>
  </div>
</div>

<!-- ===== Confirm Modal ===== -->
<div id="modal-confirm" class="modal-backdrop">
  <div class="modal" style="max-width:400px">
    <div class="modal-body text-center py-7">
      <div class="w-14 h-14 mx-auto rounded-full grid place-items-center mb-3" style="background:rgba(244,63,94,.12);color:#fb7185">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h3 class="font-bold text-lg mb-1" id="cf-title">\u0645\u0637\u0645\u0626\u0646\u06CC\u061F</h3>
      <p class="text-sm text-slate-400 mb-5" id="cf-msg"></p>
      <div class="flex gap-2 justify-center">
        <button class="btn btn-ghost" data-close-modal>\u0627\u0646\u0635\u0631\u0627\u0641</button>
        <button class="btn btn-rose" id="cf-ok">\u062A\u0623\u06CC\u06CC\u062F</button>
      </div>
    </div>
  </div>
</div>

<div class="toast-wrap" id="toasts"></div>

<script>
/* ============================================================
   Aether Panel client logic (string concat only \u2014 safe inside
   the outer server template literal).
   ============================================================ */
var API = {
  req: function(method, path, body){
    var opt = { method: method, credentials: 'include', headers: {} };
    if (body !== undefined) { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(path, opt).then(function(r){
      if (r.status === 401) { location.href = '/login'; throw new Error('unauthorized'); }
      var ct = r.headers.get('content-type') || '';
      var p = ct.indexOf('json') >= 0 ? r.json() : r.text();
      if (!r.ok) return p.then(function(e){ throw new Error((e && e.error) || r.statusText); });
      return p;
    });
  },
  get: function(p){ return API.req('GET', p); },
  post: function(p,b){ return API.req('POST', p, b); },
  patch: function(p,b){ return API.req('PATCH', p, b); },
  del: function(p){ return API.req('DELETE', p); }
};

function toast(msg, type){
  var t = document.createElement('div');
  t.className = 'toast ' + (type || 'success');
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(function(){ t.remove(); }, 250); }, 2800);
}

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function fmtGB(n){ if (n == null) return '\u2014'; return (Number(n)||0).toFixed(2) + ' GB'; }
function fmtNum(n){ return (Number(n)||0).toLocaleString('fa-IR'); }
function fmtDate(ts){ if (!ts) return '\u2014'; try { return new Date(ts*1000).toLocaleString('fa-IR', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); } catch(e){ return '\u2014'; } }
function pct(used, limit){ if (!limit) return 0; return Math.min(100, Math.round((Number(used||0)/Number(limit))*100)); }
function progressClass(p){ if (p >= 90) return 'danger'; if (p >= 70) return 'warn'; return ''; }
function avatarColor(name){
  var colors = ['#22d3ee','#8b5cf6','#f59e0b','#10b981','#f43f5e','#0ea5e9','#ec4899'];
  var h = 0; for (var i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}
function protoChips(ct){
  var map = { vless:'cyan', trojan:'violet', vmess:'amber' };
  return (ct || 'vless').split('+').map(function(p){
    var cls = map[p] || 'slate';
    return '<span class="chip chip-' + cls + '">' + esc(p.toUpperCase()) + '</span>';
  }).join(' ');
}

var state = { users: [], selected: new Set(), editing: null, view: 'dashboard' };

/* ---------- navigation ---------- */
function go(view){
  state.view = view;
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.toggle('active', n.dataset.view === view); });
  document.querySelectorAll('[data-page]').forEach(function(s){ s.style.display = s.dataset.page === view ? '' : 'none'; });
  if (view === 'dashboard') loadDashboard();
  if (view === 'users') loadUsers();
  if (view === 'proxies') loadProxies();
}
document.querySelectorAll('.nav-item').forEach(function(n){ n.addEventListener('click', function(){
  go(n.dataset.view);
}); });

/* ---------- bootstrap / auth ---------- */
async function boot(){
  try {
    var me = await API.get('/api/auth/me');
    document.getElementById('app').style.display = '';
    document.getElementById('me-name').textContent = me.actor;
    var roleEl = document.getElementById('me-role');
    if (roleEl) roleEl.textContent = me.role || me.kind;
    document.getElementById('me-avatar').textContent = String(me.actor||'A').charAt(0).toUpperCase();
    var chip = document.querySelector('.me-chip');
    if (chip) chip.title = me.actor + (me.role ? ' \xB7 ' + me.role : '');
    await loadDashboard();
  } catch(e){
    document.getElementById('bootstrap').style.display = '';
  }
}
document.getElementById('setup-btn').addEventListener('click', async function(){
  var u = document.getElementById('setup-user').value.trim();
  var p = document.getElementById('setup-pass').value;
  if (!u || p.length < 8) return toast('\u0631\u0645\u0632 \u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631', 'error');
  try {
    await API.post('/api/auth/setup', { username: u, password: p });
    await API.post('/api/auth/login', { username: u, password: p });
    toast('\u062E\u0648\u0634 \u0622\u0645\u062F\u06CC!');
    location.reload();
  } catch(e){ toast(e.message, 'error'); }
});
document.getElementById('btn-logout').addEventListener('click', async function(){
  await API.post('/api/auth/logout', {}).catch(function(){});
  location.href = '/login';
});
document.getElementById('btn-change-pass').addEventListener('click', async function(){
  var cur = document.getElementById('cur-pass').value;
  var next = document.getElementById('new-pass').value;
  if (next.length < 8) return toast('\u0631\u0645\u0632 \u062C\u062F\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631', 'error');
  try {
    await API.post('/api/auth/change-password', { current: cur, next: next });
    toast('\u0631\u0645\u0632 \u0639\u0648\u0636 \u0634\u062F');
    document.getElementById('cur-pass').value = '';
    document.getElementById('new-pass').value = '';
  } catch(e){ toast(e.message, 'error'); }
});
document.getElementById('restore-file').addEventListener('change', async function(e){
  var f = e.target.files[0]; if (!f) return;
  confirmDial('\u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0628\u06A9\u0627\u067E', '\u0627\u06CC\u0646 \u0639\u0645\u0644 \u0647\u0645\u0647\u200C\u06CC \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0641\u0639\u0644\u06CC \u0631\u0627 \u0628\u0627\u0632\u0646\u0648\u06CC\u0633\u06CC \u0645\u06CC\u200C\u06A9\u0646\u062F. \u0645\u0637\u0645\u0626\u0646\u06CC\u061F', async function(){
    var text = await f.text();
    var data = JSON.parse(text);
    try {
      var r = await API.post('/api/system/restore', data);
      toast(r.users + ' \u06A9\u0627\u0631\u0628\u0631 \u0648 ' + r.proxies + ' \u067E\u0631\u0648\u06A9\u0633\u06CC \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0634\u062F');
      loadDashboard(); loadUsers();
    } catch(ex){ toast(ex.message, 'error'); }
  });
});

/* ---------- data loaders ---------- */
async function loadStats(){
  try {
    var s = await API.get('/api/stats');
    document.getElementById('stat-users').textContent = fmtNum(s.users);
    document.getElementById('stat-active').textContent = fmtNum(s.active);
    document.getElementById('stat-gb').textContent = (Number(s.usedGb)||0).toFixed(2);
    document.getElementById('stat-req').textContent = fmtNum(s.usedReq);
  } catch(e){}
}
async function loadDashboard(){
  await loadStats();
  try {
    var r = await API.get('/api/users?pageSize=8');
    document.getElementById('recent-users').innerHTML = renderUsersTable(r.users, true);
    wireRows();
  } catch(e){}
}
async function loadUsers(){
  var q = document.getElementById('search').value.trim();
  var r = await API.get('/api/users?pageSize=200' + (q ? '&q=' + encodeURIComponent(q) : ''));
  state.users = r.users || [];
  document.getElementById('users-count').textContent = fmtNum(r.total) + ' \u06A9\u0627\u0631\u0628\u0631';
  document.getElementById('users-table').innerHTML = renderUsersTable(state.users, false);
  document.getElementById('chk-all')?.remove();
  wireRows();
  updateBulkBar();
}
function renderUsersTable(users, compact){
  if (!users || !users.length) {
    return '<div class="empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><div>\u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F</div></div>';
  }
  var head = '';
  if (!compact) {
    head = '<thead><tr>' +
      '<th style="width:36px"><input type="checkbox" id="chk-all"/></th>' +
      '<th>\u06A9\u0627\u0631\u0628\u0631</th><th>\u067E\u0631\u0648\u062A\u06A9\u0644</th><th>\u062D\u062C\u0645</th><th>\u0627\u0646\u0642\u0636\u0627</th>' +
      '<th>\u062F\u0631\u062E\u0648\u0627\u0633\u062A</th><th>\u0648\u0636\u0639\u06CC\u062A</th><th>\u0622\u062E\u0631\u06CC\u0646 \u0627\u062A\u0635\u0627\u0644</th><th></th></tr></thead>';
  } else {
    head = '<thead><tr><th>\u06A9\u0627\u0631\u0628\u0631</th><th>\u067E\u0631\u0648\u062A\u06A9\u0644</th><th>\u062D\u062C\u0645</th><th>\u0648\u0636\u0639\u06CC\u062A</th><th></th></tr></thead>';
  }
  var rows = users.map(function(u){
    var p = pct(u.used_gb, u.limit_gb);
    var color = avatarColor(u.username);
    var actions =
      '<button class="btn btn-ghost btn-icon" data-act="sub" data-u="' + esc(u.username) + '" title="\u0627\u0634\u062A\u0631\u0627\u06A9/QR">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
      '</button>' +
      '<button class="btn btn-ghost btn-icon" data-act="edit" data-u="' + esc(u.username) + '" title="\u0648\u06CC\u0631\u0627\u06CC\u0634">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
      '</button>' +
      '<button class="btn btn-ghost btn-icon" style="color:#fb7185" data-act="del" data-u="' + esc(u.username) + '" title="\u062D\u0630\u0641">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
      '</button>';
    var activeChip = u.is_active
      ? '<span class="chip chip-green"><span class="pulse-dot" style="width:6px;height:6px"></span> \u0641\u0639\u0627\u0644</span>'
      : '<span class="chip chip-red">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</span>';
    var userCell =
      '<div class="user-cell">' +
        '<div class="avatar" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44">' + esc(String(u.username).charAt(0).toUpperCase()) + '</div>' +
        '<div style="min-width:0">' +
          '<div class="font-semibold truncate">' + esc(u.username) + '</div>' +
          '<div class="text-[10px] text-slate-500 mono truncate">' + esc((u.uuid||'').slice(0,8)) + '\u2026</div>' +
        '</div>' +
      '</div>';
    if (compact) {
      return '<tr><td>' + userCell + '</td><td>' + protoChips(u.connection_type) + '</td>' +
        '<td><div class="flex items-center gap-2"><div class="progress ' + progressClass(p) + '"><i style="width:' + p + '%"></i></div><span class="text-[11px] text-slate-400 whitespace-nowrap">' + fmtGB(u.used_gb) + '/' + (u.limit_gb == null ? '\u221E' : fmtGB(u.limit_gb)) + '</span></div></td>' +
        '<td>' + activeChip + '</td><td><div class="flex gap-1">' + actions + '</div></td></tr>';
    }
    var cb = '<input type="checkbox" data-sel="' + esc(u.username) + '"' + (state.selected.has(u.username) ? ' checked' : '') + '/>';
    return '<tr>' +
      '<td>' + cb + '</td>' +
      '<td>' + userCell + '</td>' +
      '<td>' + protoChips(u.connection_type) + '</td>' +
      '<td><div class="flex items-center gap-2"><div class="progress ' + progressClass(p) + '"><i style="width:' + p + '%"></i></div><span class="text-[11px] text-slate-400 whitespace-nowrap">' + fmtGB(u.used_gb) + '/' + (u.limit_gb == null ? '\u221E' : fmtGB(u.limit_gb)) + '</span></div></td>' +
      '<td>' + (u.expiry_days != null ? u.expiry_days + ' \u0631\u0648\u0632' : '<span class="text-slate-500">\u221E</span>') + '</td>' +
      '<td>' + fmtNum(u.used_req) + (u.limit_req != null ? ' <span class="text-slate-500">/ ' + fmtNum(u.limit_req) + '</span>' : '') + '</td>' +
      '<td>' + activeChip + '</td>' +
      '<td class="text-slate-400 text-xs whitespace-nowrap">' + fmtDate(u.last_active) + '</td>' +
      '<td><div class="flex gap-1">' + actions + '</div></td>' +
    '</tr>';
  }).join('');
  var table = '<table class="users-table-desktop">' + head + '<tbody>' + rows + '</tbody></table>';
  var cards = '<div class="users-grid-mobile">' + users.map(function(u){
    var p = pct(u.used_gb, u.limit_gb);
    var color = avatarColor(u.username);
    var activeChip = u.is_active
      ? '<span class="chip chip-green"><span class="pulse-dot" style="width:6px;height:6px"></span> \u0641\u0639\u0627\u0644</span>'
      : '<span class="chip chip-red">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</span>';
    var initial = esc(String(u.username).charAt(0).toUpperCase());
    return '<div class="user-card">' +
      '<div class="row">' +
        '<div class="name"><span class="avatar" style="width:32px;height:32px;border-radius:10px;background:'+color+'22;color:'+color+';border:1px solid '+color+'44;display:grid;place-items:center;font-weight:700">'+initial+'</span>' +
          '<div style="min-width:0"><div class="truncate">'+esc(u.username)+'</div><div class="uuid">'+esc((u.uuid||'').slice(0,13))+'\u2026</div></div>' +
        '</div>' +
        activeChip +
      '</div>' +
      '<div class="meta">' +
        '<div><span class="lbl">\u067E\u0631\u0648\u062A\u06A9\u0644</span>'+protoChips(u.connection_type)+'</div>' +
        '<div><span class="lbl">\u062D\u062C\u0645</span><div class="flex items-center gap-2" style="display:flex;align-items:center;gap:6px"><div class="progress '+progressClass(p)+'"><i style="width:'+p+'%"></i></div><span class="text-[10px] text-slate-400 whitespace-nowrap">'+fmtGB(u.used_gb).replace(' GB','')+'/'+(u.limit_gb==null?'\u221E':fmtGB(u.limit_gb).replace(' GB',''))+'</span></div></div>' +
        '<div><span class="lbl">\u0627\u0646\u0642\u0636\u0627</span>'+(u.expiry_days != null ? u.expiry_days+' \u0631\u0648\u0632' : '<span class="text-slate-500">\u221E</span>')+'</div>' +
        '<div><span class="lbl">\u0622\u062E\u0631\u06CC\u0646 \u0627\u062A\u0635\u0627\u0644</span><span class="text-[10px] text-slate-400">'+fmtDate(u.last_active)+'</span></div>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="btn btn-ghost" data-act="sub" data-u="'+esc(u.username)+'">\u{1F4F1} \u0627\u0634\u062A\u0631\u0627\u06A9</button>' +
        '<button class="btn btn-ghost" data-act="edit" data-u="'+esc(u.username)+'">\u270F\uFE0F \u0648\u06CC\u0631\u0627\u06CC\u0634</button>' +
        '<button class="btn btn-ghost" style="color:#fb7185" data-act="del" data-u="'+esc(u.username)+'">\u062D\u0630\u0641</button>' +
      '</div>' +
    '</div>';
  }).join('') + '</div>';
  return table + cards;
}

function wireRows(){
  document.querySelectorAll('[data-act]').forEach(function(b){
    b.addEventListener('click', function(){
      var act = b.dataset.act, u = b.dataset.u;
      if (act === 'edit') openUserModal(u);
      else if (act === 'del') {
        confirmDial('\u062D\u0630\u0641 \u06A9\u0627\u0631\u0628\u0631', '\u06A9\u0627\u0631\u0628\u0631 \xAB' + u + '\xBB \u0628\u0631\u0627\u06CC \u0647\u0645\u06CC\u0634\u0647 \u062D\u0630\u0641 \u0645\u06CC\u200C\u0634\u0648\u062F. \u0645\u0637\u0645\u0626\u0646\u06CC\u061F', function(){
          API.del('/api/users/' + encodeURIComponent(u)).then(function(){ toast('\u062D\u0630\u0641 \u0634\u062F'); loadUsers(); loadStats(); }).catch(function(e){ toast(e.message,'error'); });
        });
      } else if (act === 'sub') openSubModal(u);
    });
  });
  var chkAll = document.getElementById('chk-all');
  if (chkAll) chkAll.onchange = function(){
    state.users.forEach(function(u){ if (chkAll.checked) state.selected.add(u.username); else state.selected.delete(u.username); });
    loadUsers();
  };
  document.querySelectorAll('[data-sel]').forEach(function(c){
    c.onchange = function(){
      if (c.checked) state.selected.add(c.dataset.sel); else state.selected.delete(c.dataset.sel);
      updateBulkBar();
    };
  });
}
function updateBulkBar(){
  var bar = document.getElementById('bulk-bar');
  if (!bar) return;
  bar.style.display = state.selected.size ? '' : 'none';
  document.getElementById('sel-count').textContent = state.selected.size + ' \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F\u0647';
}
document.querySelectorAll('[data-bulk]').forEach(function(b){
  b.addEventListener('click', function(){
    if (!state.selected.size) return;
    var act = b.dataset.bulk;
    var labels = { enable:'\u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC', disable:'\u063A\u06CC\u0631\u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC', resetVol:'\u0631\u06CC\u0633\u062A \u062D\u062C\u0645', delete:'\u062D\u0630\u0641' };
    confirmDial(labels[act] + ' \u06AF\u0631\u0648\u0647\u06CC', state.selected.size + ' \u06A9\u0627\u0631\u0628\u0631 \u0627\u0639\u0645\u0627\u0644 \u0645\u06CC\u200C\u0634\u0648\u062F. \u0627\u062F\u0627\u0645\u0647 \u0645\u06CC\u200C\u062F\u0647\u06CC\u061F', function(){
      API.post('/api/users/bulk', { usernames: Array.from(state.selected), action: act }).then(function(){
        toast('\u0627\u0646\u062C\u0627\u0645 \u0634\u062F'); state.selected.clear(); loadUsers(); loadStats();
      }).catch(function(e){ toast(e.message,'error'); });
    });
  });
});

document.getElementById('btn-new').addEventListener('click', function(){ openUserModal(null); });
document.getElementById('btn-refresh').addEventListener('click', function(){ loadUsers(); loadStats(); toast('\u0628\u0647\u200C\u0631\u0648\u0632 \u0634\u062F'); });
document.getElementById('search').addEventListener('input', debounce(loadUsers, 250));
(function syncSearches(){
  var a = document.getElementById('search');
  var b = document.getElementById('search-mobile');
  if (b) {
    b.addEventListener('input', function(){ a.value = b.value; a.dispatchEvent(new Event('input')); });
    a.addEventListener('input', function(){ if (b.value !== a.value) b.value = a.value; });
  }
})();
function debounce(fn, ms){ var t; return function(){ clearTimeout(t); t = setTimeout(fn, ms); }; }

/* ---------- user modal ---------- */
function openUserModal(username){
  state.editing = username;
  var u = null;
  if (username) {
    u = state.users.find(function(x){ return x.username === username; });
    document.getElementById('mu-title').textContent = '\u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0627\u0631\u0628\u0631';
    document.getElementById('mu-sub').textContent = username;
  } else {
    document.getElementById('mu-title').textContent = '\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F';
    document.getElementById('mu-sub').textContent = '\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F';
  }
  document.getElementById('f-username').value = u ? u.username : '';
  document.getElementById('f-uuid').value = u ? u.uuid : '';
  document.getElementById('f-limitGb').value = u && u.limit_gb != null ? u.limit_gb : '';
  document.getElementById('f-expiryDays').value = u && u.expiry_days != null ? u.expiry_days : '';
  document.getElementById('f-limitReq').value = u && u.limit_req != null ? u.limit_req : '';
  document.getElementById('f-ipLimit').value = u && u.ip_limit != null ? u.ip_limit : '';
  document.getElementById('f-connectionType').value = u ? (u.connection_type || 'vless+trojan') : 'vless+trojan';
  document.getElementById('f-port').value = u ? String(u.port || 443) : '443';
  document.getElementById('f-path').value = u ? (u.path || '/') : '/';
  document.getElementById('f-fingerprint').value = u ? (u.fingerprint || 'chrome') : 'chrome';
  document.getElementById('f-sniHost').value = u ? (u.sni_host || '') : '';
  document.getElementById('f-fragment').value = u ? (u.fragment || '') : '';
  document.getElementById('f-userProxyIata').value = u ? (u.user_proxy_iata || '') : '';
  document.getElementById('f-userSocks5').value = u ? (u.user_socks5 || '') : '';
  document.getElementById('f-routeDirect').value = u ? parseList(u.route_direct) : '';
  document.getElementById('f-routeBlock').value = u ? parseList(u.route_block) : '';
  document.getElementById('f-dohUrl').value = u ? (u.doh_url || '') : '';
  document.getElementById('f-blockPorn').checked = !!(u && u.block_porn);
  document.getElementById('f-blockAds').checked = !!(u && u.block_ads);
  document.getElementById('f-blockMalware').checked = !!(u && u.block_malware);
  document.getElementById('f-isActive').checked = u ? !!u.is_active : true;
  document.getElementById('f-note').value = u ? (u.note || '') : '';
  openModal('modal-user');
}
function parseList(s){ if (!s) return ''; try { return (JSON.parse(s)||[]).join(', '); } catch(e){ return s; } }
function csvList(s){ var v = (s||'').split(',').map(function(x){return x.trim().split(String.fromCharCode(10)).join('').trim();}).filter(Boolean); return v.length ? JSON.stringify(v) : null; }

document.getElementById('mu-save').addEventListener('click', async function(){
  var body = {
    username: document.getElementById('f-username').value.trim(),
    uuid: document.getElementById('f-uuid').value.trim() || undefined,
    limitGb: parseFloat(document.getElementById('f-limitGb').value) || null,
    expiryDays: parseInt(document.getElementById('f-expiryDays').value) || null,
    limitReq: parseInt(document.getElementById('f-limitReq').value) || null,
    ipLimit: parseInt(document.getElementById('f-ipLimit').value) || null,
    connectionType: document.getElementById('f-connectionType').value,
    port: parseInt(document.getElementById('f-port').value) || 443,
    path: document.getElementById('f-path').value || '/',
    fingerprint: document.getElementById('f-fingerprint').value,
    sniHost: document.getElementById('f-sniHost').value.trim() || null,
    fragment: document.getElementById('f-fragment').value.trim() || null,
    userProxyIata: document.getElementById('f-userProxyIata').value.trim().toUpperCase() || null,
    userSocks5: document.getElementById('f-userSocks5').value.trim() || null,
    routeDirect: csvList(document.getElementById('f-routeDirect').value),
    routeBlock: csvList(document.getElementById('f-routeBlock').value),
    dohUrl: document.getElementById('f-dohUrl').value.trim() || null,
    blockPorn: document.getElementById('f-blockPorn').checked,
    blockAds: document.getElementById('f-blockAds').checked,
    blockMalware: document.getElementById('f-blockMalware').checked,
    isActive: document.getElementById('f-isActive').checked,
    note: document.getElementById('f-note').value || null
  };
  if (!body.username) return toast('\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0644\u0627\u0632\u0645 \u0627\u0633\u062A', 'error');
  var btn = this; btn.disabled = true; btn.textContent = '\u062F\u0631 \u062D\u0627\u0644 \u0630\u062E\u06CC\u0631\u0647...';
  try {
    if (state.editing) {
      await API.patch('/api/users/' + encodeURIComponent(state.editing), body);
      toast('\u06A9\u0627\u0631\u0628\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F');
    } else {
      await API.post('/api/users', body);
      toast('\u06A9\u0627\u0631\u0628\u0631 \u0633\u0627\u062E\u062A\u0647 \u0634\u062F');
    }
    closeModal('modal-user');
    loadUsers(); loadStats();
  } catch(e){ toast(e.message, 'error'); }
  btn.disabled = false; btn.textContent = '\u0630\u062E\u06CC\u0631\u0647 \u06A9\u0627\u0631\u0628\u0631';
});

/* ---------- sub modal ---------- */
function openSubModal(username){
  var origin = location.origin;
  var subUrl = origin + '/sub/' + encodeURIComponent(username);
  document.getElementById('sub-url').textContent = subUrl;
  var qrBox = document.getElementById('sub-qr');
  qrBox.innerHTML = '';
  try {
    var qr = qrcode(0, 'M');
    qr.addData(subUrl); qr.make();
    var img = qr.createDataURL(6, 8);
    qrBox.innerHTML = '<div class="qr-box"><img src="' + img + '" alt="QR"/></div>';
  } catch(e){
    qrBox.innerHTML = '<div class="text-xs text-slate-400">QR \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A</div>';
  }
  var formats = [
    { label: 'Base64 (\u0639\u0645\u0648\u0645\u06CC)', url: subUrl },
    { label: 'Clash', url: subUrl + '?format=clash' },
    { label: 'sing-box', url: subUrl + '?format=singbox' },
    { label: 'Raw (v2rayNG)', url: subUrl + '?format=raw' }
  ];
  document.getElementById('sub-formats').innerHTML = formats.map(function(f){
    return '<a href="' + f.url + '" target="_blank" class="btn btn-ghost" style="font-size:12px">' + f.label + '</a>';
  }).join('');
  API.get('/sub/' + encodeURIComponent(username) + '?format=raw').then(function(text){
    document.getElementById('sub-raw').textContent = text;
  }).catch(function(){});
  openModal('modal-sub');
}
document.getElementById('sub-copy').addEventListener('click', function(){
  var t = document.getElementById('sub-url').textContent;
  navigator.clipboard.writeText(t).then(function(){ toast('\u06A9\u067E\u06CC \u0634\u062F'); }).catch(function(){ toast('\u06A9\u067E\u06CC \u0646\u0627\u0645\u0648\u0641\u0642', 'error'); });
});

/* ---------- proxies ---------- */
async function loadProxies(){
  try {
    var r = await API.get('/api/proxies?pageSize=100');
    document.getElementById('proxy-count').textContent = fmtNum(r.total) + ' \u067E\u0631\u0648\u06A9\u0633\u06CC';
    var ps = r.proxies || [];
    if (!ps.length) {
      document.getElementById('proxies-table').innerHTML = '<div class="empty">\u0647\u0646\u0648\u0632 \u067E\u0631\u0648\u06A9\u0633\u06CC\u200C\u0627\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u0634\u062F\u0647</div>';
      return;
    }
    document.getElementById('proxies-table').innerHTML =
      '<table><thead><tr><th>URI</th><th>\u06A9\u0634\u0648\u0631</th><th>Latency</th><th>\u0648\u0636\u0639\u06CC\u062A</th><th></th></tr></thead><tbody>' +
      ps.map(function(p){
        return '<tr>' +
          '<td class="mono text-[11px]" style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.uri) + '</td>' +
          '<td><span class="chip chip-cyan">' + esc((p.country||'\u2014').toUpperCase()) + '</span></td>' +
          '<td class="text-xs text-slate-400">' + (p.latency_ms ? p.latency_ms + 'ms' : '\u2014') + '</td>' +
          '<td>' + (p.is_active ? '<span class="chip chip-green">\u0641\u0639\u0627\u0644</span>' : '<span class="chip chip-red">\u063A\u06CC\u0631\u0641\u0639\u0627\u0644</span>') + '</td>' +
          '<td><button class="btn btn-ghost btn-icon" data-pid="' + p.id + '" title="\u062D\u0630\u0641"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></td>' +
        '</tr>';
      }).join('') + '</tbody></table>';
    document.querySelectorAll('[data-pid]').forEach(function(b){
      b.addEventListener('click', function(){
        API.del('/api/proxies/' + b.dataset.pid).then(function(){ toast('\u062D\u0630\u0641 \u0634\u062F'); loadProxies(); }).catch(function(e){ toast(e.message,'error'); });
      });
    });
  } catch(e){ document.getElementById('proxies-table').innerHTML = '<div class="empty text-rose-400">' + esc(e.message) + '</div>'; }
}
document.getElementById('proxy-import').addEventListener('click', async function(){
  var url = document.getElementById('proxy-url').value.trim();
  var cc = document.getElementById('proxy-cc').value.trim().toUpperCase();
  if (!url) return toast('URL \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646', 'error');
  var b = this; b.disabled = true; b.textContent = '\u062F\u0631 \u062D\u0627\u0644 \u0627\u06CC\u0645\u067E\u0648\u0631\u062A...';
  try {
    var r = await API.post('/api/proxies/import', { url: url, country: cc });
    toast(r.imported + ' \u067E\u0631\u0648\u06A9\u0633\u06CC \u0627\u06CC\u0645\u067E\u0648\u0631\u062A \u0634\u062F');
    loadProxies();
  } catch(e){ toast(e.message, 'error'); }
  b.disabled = false; b.textContent = '\u0627\u06CC\u0645\u067E\u0648\u0631\u062A';
});
document.getElementById('proxy-health').addEventListener('click', function(){
  API.post('/api/proxies/health', {}).then(function(){ toast('\u0628\u0631\u0631\u0633\u06CC \u0633\u0644\u0627\u0645\u062A \u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC \u0634\u062F'); }).catch(function(e){ toast(e.message,'error'); });
});
document.getElementById('proxy-reload').addEventListener('click', function(){
  API.post('/api/proxies/pool/reload', {}).then(function(r){ toast(r.active + ' \u067E\u0631\u0648\u06A9\u0633\u06CC \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0634\u062F'); }).catch(function(e){ toast(e.message,'error'); });
});

/* ---------- modal helpers ---------- */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('[data-close-modal]').forEach(function(b){
  b.addEventListener('click', function(){
    b.closest('.modal-backdrop').classList.remove('open');
  });
});
document.querySelectorAll('.modal-backdrop').forEach(function(m){
  m.addEventListener('click', function(e){ if (e.target === m) m.classList.remove('open'); });
});
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(function(m){ m.classList.remove('open'); });
});

/* ---------- confirm dialog ---------- */
var _cfCb = null;
function confirmDial(title, msg, cb){
  document.getElementById('cf-title').textContent = title;
  document.getElementById('cf-msg').textContent = msg;
  _cfCb = cb;
  openModal('modal-confirm');
}
document.getElementById('cf-ok').addEventListener('click', function(){
  closeModal('modal-confirm');
  if (_cfCb) { var f = _cfCb; _cfCb = null; f(); }
});

/* ---------- start ---------- */
boot();
</script>
</body></html>`;
}
function notFoundHtml() {
  return "<!doctype html><html><head><title>404</title><style>body{font-family:monospace;background:#0b1220;color:#94a3b8;text-align:center;padding:3rem}</style></head><body><h1>404 Not Found</h1><p>nginx/1.25.3</p></body></html>";
}
function escServer(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function statusHtml(user, subLinks) {
  const esc = escServer;
  const usedGb = Number(user.used_gb || 0);
  const limitGb = user.limit_gb;
  const pct = limitGb ? Math.min(100, Math.round(usedGb / limitGb * 100)) : 0;
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>' + esc(String(user.username || "user")) + ' \u2014 \u0648\u0636\u0639\u06CC\u062A</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"/><script src="https://cdn.tailwindcss.com"></script><style>body{font-family:Vazirmatn;background:#000;color:#e5e7eb;min-height:100vh;background:radial-gradient(ellipse at top,rgba(34,211,238,.12),transparent 60%),#000}.glass{background:rgba(10,12,20,.72);backdrop-filter:blur(18px);border:1px solid rgba(148,163,184,.12)}</style></head><body class="grid place-items-center p-4"><div class="w-full max-w-md glass rounded-3xl p-7"><div class="flex items-center gap-3 mb-5"><img src="/icon.svg" class="w-12 h-12"/><div><h1 class="text-xl font-black">' + esc(String(user.username || "")) + '</h1><p class="text-xs text-slate-400">\u0635\u0641\u062D\u0647 \u0648\u0636\u0639\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631</p></div></div><div class="space-y-3 text-sm"><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u062D\u062C\u0645 \u0645\u0635\u0631\u0641\u200C\u0634\u062F\u0647</span><span class="font-bold text-cyan-400">' + usedGb.toFixed(2) + ' GB</span></div><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u0633\u0642\u0641</span><span class="font-bold">' + (limitGb == null ? "\u221E" : limitGb.toFixed(2) + " GB") + '</span></div><div class="h-2 rounded-full overflow-hidden" style="background:rgba(148,163,184,.1)"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#22d3ee,#0ea5e9)"></div></div><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u0627\u0646\u0642\u0636\u0627</span><span class="font-bold">' + (user.expiry_days == null ? "\u221E" : esc(String(user.expiry_days)) + " \u0631\u0648\u0632") + '</span></div><div class="flex justify-between p-3 rounded-xl" style="background:rgba(148,163,184,.05)"><span class="text-slate-400">\u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627</span><span class="font-bold">' + esc(String(user.used_req || 0)) + '</span></div></div><a class="mt-5 inline-flex w-full justify-center items-center gap-2 py-3 rounded-xl font-bold" style="background:linear-gradient(135deg,#22d3ee,#0ea5e9);color:#00131c" href="/sub/' + encodeURIComponent(String(user.username || "")) + '">\u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0646\u06A9 \u0627\u0634\u062A\u0631\u0627\u06A9</a><pre style="display:none" id="cfg">' + esc(subLinks) + "</pre></div></body></html>";
}

// src/services/cleanIps.ts
var DEFAULT_CLEAN_IPS = [
  "104.21.25.236",
  "104.25.18.135",
  "45.95.241.156",
  "104.17.2.204",
  "104.18.116.88",
  "104.24.200.193",
  "104.18.131.149",
  "104.24.64.50",
  "172.64.80.223",
  "172.67.204.122",
  "104.20.5.43",
  "104.19.145.139",
  "104.16.157.102",
  "104.21.210.159",
  "172.65.234.100",
  "104.21.13.119",
  "104.21.78.62",
  "104.17.131.244",
  "104.18.200.104",
  "104.17.237.123",
  "104.19.75.119",
  "172.66.165.46",
  "104.19.69.35",
  "104.25.28.186",
  "172.67.139.36",
  "104.25.32.199",
  "172.64.157.115",
  "104.21.27.230",
  "172.65.108.158",
  "104.21.25.127",
  "162.159.61.163",
  "104.17.198.61",
  "104.27.82.136",
  "2.16.125.13",
  "104.25.247.5",
  "104.24.22.33",
  "104.16.227.74",
  "104.20.58.164",
  "89.116.180.250",
  "104.25.155.45",
  "172.66.213.38",
  "172.67.161.96",
  "172.67.227.250",
  "104.25.54.8",
  "104.17.66.215",
  "172.67.73.198",
  "23.227.60.0",
  "104.25.127.127",
  "104.16.68.77",
  "2.16.125.21",
  "162.159.139.14",
  "104.18.151.46",
  "104.21.29.109",
  "172.64.230.176",
  "209.46.30.26",
  "104.16.104.85",
  "104.24.226.143",
  "104.16.55.62",
  "104.25.139.165",
  "104.16.86.1",
  "104.24.53.202",
  "104.21.115.177",
  "104.21.38.239",
  "172.66.197.67",
  "104.18.94.126",
  "2.16.1.165",
  "185.7.240.178",
  "104.24.219.77",
  "104.19.84.82",
  "104.17.130.100",
  "104.18.226.166",
  "104.18.247.102",
  "172.64.83.41",
  "172.67.230.214",
  "104.24.190.80",
  "5.10.214.102",
  "104.24.215.239",
  "104.25.99.169",
  "104.24.161.23",
  "104.17.159.116"
];
function parseIpsField(ips) {
  if (!ips)
    return DEFAULT_CLEAN_IPS;
  try {
    if (Array.isArray(ips) && ips.length)
      return ips.filter((x) => typeof x === "string");
    if (typeof ips === "string") {
      const arr = JSON.parse(ips);
      if (Array.isArray(arr) && arr.length)
        return arr;
    }
  } catch {
  }
  return DEFAULT_CLEAN_IPS;
}

// src/services/subscription.ts
var TLS_PORTS = /* @__PURE__ */ new Set(["443", "2053", "2083", "2087", "2096", "8443"]);
async function generateSubscription(user, ctx, format = "base64") {
  const links = buildLinks(user, ctx);
  if (format === "raw") {
    return { body: links.join("\n"), contentType: "text/plain; charset=utf-8" };
  }
  if (format === "clash") {
    return { body: buildClash(user, ctx, links), contentType: "text/yaml; charset=utf-8" };
  }
  if (format === "singbox") {
    return {
      body: JSON.stringify(buildSingBox(user, ctx, links), null, 2),
      contentType: "application/json; charset=utf-8"
    };
  }
  const noise = [
    "# Sub Update: OK",
    "# Random Code: " + Math.random().toString(36).slice(2, 10),
    "# Aether Panel",
    ""
  ].join("\n");
  const plain = noise + links.join("\n");
  return {
    body: b64url(plain),
    contentType: "text/plain; charset=utf-8"
  };
}
function buildLinks(user, ctx) {
  const out = [];
  const host = ctx.host;
  const sni = user.sni_host || host;
  const fp = user.fingerprint || "chrome";
  const path = "/" + Math.random().toString(36).slice(2, 12);
  const pathEnc = encodeURIComponent(path);
  const ips = parseIpsField(user.ips).slice(0, 30);
  const ports = String(user.port || "443").split(",").map((p) => p.trim()).filter(Boolean);
  const connType = String(user.connection_type || "vless").toLowerCase();
  const enableVless = connType.includes("vless") || !connType.includes("trojan");
  const enableTrojan = connType.includes("trojan");
  const enableVmess = connType.includes("vmess");
  let frag = "";
  if (user.fragment)
    frag += "&fragment=" + encodeURIComponent(user.fragment);
  for (const ip of ips) {
    for (const portStr of ports) {
      const isTls = TLS_PORTS.has(portStr);
      const sec = isTls ? "tls" : "none";
      const remark = "Aether|" + user.username + "|" + ip;
      const encRemark = encodeURIComponent(remark);
      if (enableVless) {
        out.push(
          "vless://" + user.uuid + "@" + ip + ":" + portStr + "?path=" + pathEnc + "&security=" + sec + "&encryption=none&insecure=0&host=" + encodeURIComponent(sni) + "&fp=" + fp + "&type=ws&allowInsecure=0&sni=" + encodeURIComponent(sni) + frag + "#" + encRemark
        );
      }
      if (enableTrojan) {
        out.push(
          "trojan://" + user.uuid + "@" + ip + ":" + portStr + "?path=" + pathEnc + "&security=" + sec + "&insecure=0&host=" + encodeURIComponent(sni) + "&fp=" + fp + "&type=ws&allowInsecure=0&sni=" + encodeURIComponent(sni) + frag + "#" + encRemark
        );
      }
      if (enableVmess) {
        const json = {
          v: "2",
          ps: remark,
          add: ip,
          port: portStr,
          id: user.uuid,
          aid: "0",
          net: "ws",
          type: "none",
          host: sni,
          path,
          tls: isTls ? "tls" : "",
          sni
        };
        out.push("vmess://" + b64url(JSON.stringify(json)));
      }
    }
  }
  return out;
}
function buildClash(user, ctx, _links) {
  const host = ctx.host;
  const sni = user.sni_host || host;
  const ip = parseIpsField(user.ips)[0] || DEFAULT_CLEAN_IPS[0];
  const directDomains = parseList(user.route_direct);
  const blockDomains = parseList(user.route_block);
  const directRules = directDomains.map((d) => "  - DOMAIN-SUFFIX," + d + ",DIRECT").join("\n");
  const blockRules = blockDomains.map((d) => "  - DOMAIN-SUFFIX," + d + ",REJECT").join("\n");
  return '# Aether Panel Clash configuration\nmixed-port: 7890\nallow-lan: false\nmode: rule\nlog-level: info\nipv6: true\ndns:\n  enable: true\n  listen: 0.0.0.0:53\n  default-nameserver: [1.1.1.1, 8.8.8.8]\n  nameserver: [https://cloudflare-dns.com/dns-query, https://dns.google/dns-query]\nproxies:\n  - name: "aether-' + user.username + '"\n    type: vless\n    server: ' + ip + "\n    port: " + (user.port || 443) + "\n    uuid: " + user.uuid + "\n    network: ws\n    tls: true\n    servername: " + sni + '\n    ws-opts:\n      path: "/"\n      headers:\n        Host: ' + sni + "\n    client-fingerprint: " + (user.fingerprint || "chrome") + '\nproxy-groups:\n  - name: PROXY\n    type: select\n    proxies: ["aether-' + user.username + '"]\nrules:\n' + (directRules ? directRules + "\n" : "") + (blockRules ? blockRules + "\n" : "") + "  - GEOIP,IR,DIRECT\n  - MATCH,PROXY\n";
}
function buildSingBox(user, ctx, _links) {
  const sni = user.sni_host || ctx.host;
  const ip = parseIpsField(user.ips)[0] || DEFAULT_CLEAN_IPS[0];
  return {
    log: { level: "info" },
    dns: {
      servers: [
        { tag: "cf", address: "https://cloudflare-dns.com/dns-query" },
        { tag: "local", address: "local", detour: "direct" }
      ],
      rules: [{ domain_suffix: [".ir"], server: "local" }]
    },
    outbounds: [
      {
        type: "vless",
        tag: "proxy",
        server: ip,
        server_port: user.port || 443,
        uuid: user.uuid,
        tls: { enabled: true, server_name: sni, utls: { enabled: true, fingerprint: user.fingerprint || "chrome" } },
        transport: { type: "ws", path: "/" }
      },
      { type: "direct", tag: "direct" },
      { type: "block", tag: "block" }
    ],
    route: { final: "proxy" }
  };
}
function parseList(json) {
  if (!json)
    return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function b64url(s) {
  const u8 = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < u8.byteLength; i++)
    bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

// src/do/UserState.ts
var DEFAULT_STATE = {
  bytesUnflushed: 0,
  requestsUnflushed: 0,
  lastFlush: 0,
  active: {}
};
var FLUSH_BYTES = 25 * 1024 * 1024;
var FLUSH_MS = 3e4;
var UserState = class {
  state;
  env;
  data = { ...DEFAULT_STATE };
  flushTimer = null;
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("data");
      if (stored)
        this.data = stored;
    });
    this.flushTimer = setInterval(() => {
      this.state.waitUntil(this.flush());
    }, FLUSH_MS);
  }
  async fetch(req) {
    const url = new URL(req.url);
    const action = url.pathname.replace(/^\//, "");
    switch (action) {
      case "connect": {
        const { ip, subnet, ua } = await req.json();
        const limit = parseInt(url.searchParams.get("ipLimit") || "0", 10);
        const keys = Object.keys(this.data.active);
        if (limit > 0 && keys.length >= limit && !this.data.active[subnet]) {
          return Response.json({ ok: false, code: "ip_limit", active: keys.length });
        }
        this.data.active[subnet] = { ip, subnet, ua, startedAt: Date.now() };
        await this.persist();
        return Response.json({ ok: true, active: Object.keys(this.data.active).length });
      }
      case "disconnect": {
        const { subnet } = await req.json();
        delete this.data.active[subnet];
        await this.persist();
        return Response.json({ ok: true, active: Object.keys(this.data.active).length });
      }
      case "addBytes": {
        const { bytes, requests } = await req.json();
        this.data.bytesUnflushed += bytes | 0;
        this.data.requestsUnflushed += (requests || 0) | 0;
        if (this.data.bytesUnflushed >= FLUSH_BYTES) {
          this.state.waitUntil(this.flush());
        }
        return Response.json({ ok: true, unflushed: this.data.bytesUnflushed });
      }
      case "status": {
        return Response.json({
          active: Object.keys(this.data.active).length,
          unflushedBytes: this.data.bytesUnflushed,
          unflushedRequests: this.data.requestsUnflushed,
          connections: this.data.active
        });
      }
      case "flush": {
        await this.flush();
        return Response.json({ ok: true });
      }
      default:
        return new Response("not found", { status: 404 });
    }
  }
  async persist() {
    await this.state.storage.put("data", this.data);
  }
  async flush() {
    if (this.data.bytesUnflushed === 0 && this.data.requestsUnflushed === 0)
      return;
    const bytes = this.data.bytesUnflushed;
    const reqs = this.data.requestsUnflushed;
    this.data.bytesUnflushed = 0;
    this.data.requestsUnflushed = 0;
    this.data.lastFlush = Date.now();
    await this.persist();
    try {
      const user = this.state.id.name?.toString() || "";
      if (user) {
        const gb = bytes / (1024 * 1024 * 1024);
        await this.env.DB.prepare(
          `UPDATE users
             SET used_gb = used_gb + ?,
                 lifetime_gb = lifetime_gb + ?,
                 used_req = used_req + ?,
                 last_active = ?
           WHERE username = ?`
        ).bind(gb, gb, reqs, Math.floor(Date.now() / 1e3), user).run();
      }
    } catch (e) {
      this.data.bytesUnflushed += bytes;
      this.data.requestsUnflushed += reqs;
      await this.persist();
      console.error("UserState flush failed", e);
    }
  }
};

// src/do/PoolState.ts
var EMPTY = { byCountry: {} };
var PoolState = class {
  state;
  env;
  data = EMPTY;
  alarmScheduled = false;
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("pool");
      if (stored)
        this.data = stored;
    });
  }
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\//, "");
    if (path === "pick") {
      const cc = (url.searchParams.get("cc") || "").toUpperCase();
      const list = cc ? this.data.byCountry[cc] || [] : Object.values(this.data.byCountry).flat();
      const alive = list.filter((p) => p.ok);
      if (!alive.length)
        return Response.json({ error: "empty pool" }, { status: 503 });
      const pick = alive[Math.floor(Math.random() * alive.length)];
      return Response.json({ uri: pick.uri, latencyMs: pick.latencyMs, country: pick.country });
    }
    if (path === "import") {
      const { country, list } = await req.json();
      const cc = (country || "XX").toUpperCase();
      this.data.byCountry[cc] = list.map((uri) => ({ uri, country: cc, ok: true, lastChecked: 0 }));
      await this.state.storage.put("pool", this.data);
      this.scheduleAlarm();
      return Response.json({ ok: true, count: list.length });
    }
    if (path === "health-check") {
      ctxWaitUntil(this.state, this.healthCheck());
      return Response.json({ ok: true });
    }
    return new Response("not found", { status: 404 });
  }
  scheduleAlarm() {
    if (this.alarmScheduled)
      return;
    this.alarmScheduled = true;
    this.state.storage.setAlarm(6e4).catch(() => {
    });
  }
  async alarm() {
    this.alarmScheduled = false;
    await this.healthCheck();
    if (Object.values(this.data.byCountry).flat().length)
      this.scheduleAlarm();
  }
  async healthCheck() {
    const all = Object.values(this.data.byCountry).flat();
    const sample = all.slice(0, 50);
    for (const p of sample) {
      try {
        const u = new URL(p.uri);
        const host = u.hostname;
        const port = parseInt(u.port || "1080", 10);
        const t0 = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4e3);
        const res = await fetch(`https://${host}:${port}`, {
          method: "HEAD",
          signal: controller.signal,
          mode: "no-cors"
        }).catch(() => null);
        clearTimeout(timer);
        p.latencyMs = Date.now() - t0;
        p.ok = !!res;
      } catch {
        p.ok = false;
      }
      p.lastChecked = Date.now();
    }
    for (const cc of Object.keys(this.data.byCountry)) {
      this.data.byCountry[cc] = this.data.byCountry[cc].filter((p) => p.ok);
    }
    await this.state.storage.put("pool", this.data);
  }
};
function ctxWaitUntil(state, p) {
  try {
    state.waitUntil(p);
  } catch {
  }
}

// src/do/RateLimiter.ts
var RateLimiter = class {
  state;
  env;
  bucket = { count: 0, resetAt: 0 };
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("b");
      if (stored)
        this.bucket = stored;
    });
  }
  async fetch(req) {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);
    const windowMs = parseInt(url.searchParams.get("window") || "900000", 10);
    const now = Date.now();
    if (now > this.bucket.resetAt) {
      this.bucket = { count: 0, resetAt: now + windowMs };
    }
    this.bucket.count += 1;
    await this.state.storage.put("b", this.bucket);
    return Response.json({
      ok: this.bucket.count <= limit,
      count: this.bucket.count,
      remaining: Math.max(0, limit - this.bucket.count),
      resetAt: this.bucket.resetAt
    });
  }
};

// src/ui/assets.ts
var ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#020617"/>
  <rect x="48" y="48" width="416" height="416" rx="88" fill="url(#g)" opacity="0.18"/>
  <g transform="translate(128,96) scale(16)" fill="none" stroke="#67e8f9" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M4 22 L14 2 L14 12 L22 12 L10 30 L10 20 L4 20 Z"/>
  </g>
</svg>`;
var PWA_MANIFEST = JSON.stringify({
  name: "Aether Panel",
  short_name: "Aether",
  description: "Modern Cloudflare Worker proxy panel",
  start_url: "/panel",
  scope: "/",
  display: "standalone",
  background_color: "#07090d",
  theme_color: "#07090d",
  dir: "rtl",
  lang: "fa-IR",
  orientation: "any",
  icons: [
    { src: "/icon.svg", sizes: "192x192 512x512", type: "image/svg+xml", purpose: "any maskable" }
  ],
  categories: ["utilities", "productivity"]
});
var SW_JS = `
const CACHE = "aether-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.startsWith("/api/") || u.pathname.startsWith("/sub/")) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      const run = fetch(e.request).then((res) => {
        if (res && res.status === 200) cache.put(e.request, res.clone());
        return res;
      }).catch(() => hit);
      return hit || run;
    })
  );
});
`;

// src/index.ts
var app = new Hono2();
app.use("*", logger());
app.use("/api/*", cors({ origin: (origin) => origin || "*", credentials: true }));
app.get(
  "/manifest.json",
  (c) => c.json(JSON.parse(PWA_MANIFEST), 200, { "content-type": "application/manifest+json" })
);
app.get("/icon.svg", (c) => c.body(ICON_SVG, 200, { "content-type": "image/svg+xml" }));
app.get("/sw.js", (c) => c.body(SW_JS, 200, { "content-type": "application/javascript" }));
app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);
app.route("/api/proxies", proxyRoutes);
app.route("/api/system", systemRoutes);
app.post("/tg/webhook", async (c) => {
  if (!c.env.TELEGRAM_TOKEN)
    return c.text("bot disabled", 404);
  return handleTelegramUpdate(c.req.raw, c.env);
});
app.get("/api/health", (c) => c.json({ ok: true, version: c.env.APP_VERSION, ts: Date.now() }));
app.get("/api/traffic/:username", async (c) => {
  const username = c.req.param("username");
  const hours = Math.min(168, parseInt(c.req.query("hours") || "24", 10));
  const since = Math.floor(Date.now() / 1e3) - hours * 3600;
  const rows = await c.env.DB.prepare(
    "SELECT hour_bucket, bytes_up, bytes_down, requests FROM traffic_hourly WHERE username = ? AND hour_bucket >= ? ORDER BY hour_bucket"
  ).bind(username, since).all();
  return c.json({ username, hours, points: rows.results });
});
app.get("/api/stats", async (c) => {
  const total = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
  const active = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE is_active = 1").first();
  const gb = await c.env.DB.prepare("SELECT COALESCE(SUM(used_gb),0) AS s FROM users").first();
  const req = await c.env.DB.prepare("SELECT COALESCE(SUM(used_req),0) AS s FROM users").first();
  return c.json({
    users: total?.n ?? 0,
    active: active?.n ?? 0,
    usedGb: gb?.s ?? 0,
    usedReq: req?.s ?? 0
  });
});
app.get("/sub/:user", async (c) => {
  const username = decodeURIComponent(c.req.param("user"));
  const row = await c.env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE OR uuid = ?").bind(username, username).first();
  if (!row)
    return c.text("not found", 404);
  const fmt = c.req.query("format") || "base64";
  const { body, contentType } = await generateSubscription(row, {
    host: new URL(c.req.url).hostname,
    port: row.port ?? 443,
    tls: row.tls !== "off"
  }, fmt);
  const ua = (c.req.header("user-agent") || "").toLowerCase();
  if (!ua.includes("mozilla") && !ua.includes("chrome")) {
    c.executionCtx.waitUntil(
      c.env.DB.prepare("UPDATE users SET used_req = used_req + 1 WHERE username = ?").bind(row.username).run()
    );
  }
  return c.body(body, 200, {
    "content-type": contentType,
    "profile-update-interval": "12",
    "subscription-userinfo": `upload=0; download=${Math.floor((row.used_gb ?? 0) * 1024 * 1024 * 1024)}; total=${Math.floor((row.limit_gb ?? 0) * 1024 * 1024 * 1024)}; expire=${Math.floor(Date.now() / 1e3) + (row.expiry_days ?? 0) * 86400}`
  });
});
app.get("/feed/:user", (c) => c.redirect("/sub/" + encodeURIComponent(c.req.param("user")), 302));
app.get("/status/:user", async (c) => {
  const username = decodeURIComponent(c.req.param("user"));
  const row = await c.env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE OR uuid = ?").bind(username, username).first();
  if (!row)
    return c.text("not found", 404);
  const { body } = await generateSubscription(row, {
    host: new URL(c.req.url).hostname,
    port: row.port ?? 443,
    tls: row.tls !== "off"
  }, "raw");
  return c.html(statusHtml(row, body));
});
app.get("/panel", (c) => c.html(panelHtml(c.env.APP_VERSION, false)));
app.get("/login", (c) => c.html(loginHtml()));
app.get("/", (c) => c.html(notFoundHtml()));
app.get("*", (c) => c.html(notFoundHtml(), 404));
var rawFetch = async (request, env, ctx) => {
  ctx.waitUntil(ensurePoolSynced(env));
  const url = new URL(request.url);
  const upgrade = request.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() === "websocket") {
    return handleTunnel(request, env, ctx);
  }
  return app.fetch(request, env, ctx);
};
var scheduled = async (event, env, ctx) => {
  const now = Date.now();
  if (event.cron === "* * * * *") {
    const id = env.POOL_STATE.idFromName("global");
    ctx.waitUntil(env.POOL_STATE.get(id).fetch("http://do/health-check"));
  }
  if (event.cron === "*/5 * * * *") {
    ctx.waitUntil(autoRotateIps(env));
  }
  if (event.cron === "0 * * * *") {
    ctx.waitUntil(autoResetQuotas(env));
  }
};
var queue = async (batch, env) => {
  const updates = /* @__PURE__ */ new Map();
  for (const msg of batch.messages) {
    const body = msg.body;
    if (body?.type === "traffic" && body.username) {
      const u = updates.get(body.username) || { bytes: 0, requests: 0 };
      u.bytes += body.bytes || 0;
      u.requests += body.requests || 0;
      updates.set(body.username, u);
    }
  }
  for (const [username, delta] of updates) {
    const gb = delta.bytes / (1024 * 1024 * 1024);
    await env.DB.prepare(
      "UPDATE users SET used_gb = used_gb + ?, lifetime_gb = lifetime_gb + ?, used_req = used_req + ? WHERE username = ?"
    ).bind(gb, gb, delta.requests, username).run();
  }
};
async function autoRotateIps(env) {
  try {
    const now = Date.now();
    const { results } = await env.DB.prepare(
      "SELECT * FROM users WHERE auto_rotate_ip = 1 AND rotate_minutes > 0 AND ? >= (last_rotate_time + rotate_minutes * 60000)"
    ).bind(now).all();
    if (!results?.length)
      return;
    const res = await fetch(env.PRIMARY_FETCH).catch(() => null);
    if (!res || !res.ok)
      return;
    const text = await res.text();
    const blocks = text.split(/----------+/);
    const byOp = {};
    for (const block of blocks) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      let op = "unknown";
      const ips = [];
      for (const line of lines) {
        if (line.startsWith("#"))
          op = line.slice(1).trim();
        else if (!line.startsWith("["))
          ips.push(line);
      }
      if (ips.length)
        byOp[op] = ips;
    }
    for (const u of results) {
      const pool = u.ip_operator === "all" ? Object.values(byOp).flat() : byOp[String(u.ip_operator || "all")] || [];
      if (!pool.length)
        continue;
      const count = Number(u.ip_count) || 15;
      const chosen = [];
      for (let i = 0; i < count && pool.length; i++)
        chosen.push(pool[Math.floor(Math.random() * pool.length)]);
      await env.DB.prepare("UPDATE users SET ips = ?, last_rotate_time = ? WHERE id = ?").bind(JSON.stringify(chosen), now, u.id).run();
    }
  } catch (e) {
    console.error("autoRotateIps", e);
  }
}
var poolSynced = false;
async function ensurePoolSynced(env) {
  if (poolSynced)
    return;
  poolSynced = true;
  try {
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM proxies").first();
    if (count && count.n > 0) {
      await syncPool(env);
    }
  } catch (e) {
    console.error("ensurePoolSynced", e);
  }
}
async function autoResetQuotas(env) {
  const now = Date.now();
  const todayUtc = Math.floor(now / 864e5) * 864e5;
  await env.DB.prepare(
    `UPDATE users SET used_gb = 0, is_active = 1, last_reset_vol_time = ?
      WHERE auto_reset_vol_days > 0 AND ? >= (last_reset_vol_time + auto_reset_vol_days * 86400000)`
  ).bind(todayUtc, todayUtc).run();
  await env.DB.prepare(
    `UPDATE users SET used_req = 0, is_active = 1, last_reset_req_time = ?
      WHERE auto_reset_req_days > 0 AND ? >= (last_reset_req_time + auto_reset_req_days * 86400000)`
  ).bind(todayUtc, todayUtc).run();
}
var src_default = { fetch: rawFetch, scheduled, queue };
export {
  PoolState,
  RateLimiter,
  UserState,
  src_default as default
};
//# sourceMappingURL=index.js.map
