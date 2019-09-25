"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSuffix = exports.patchWindow = exports.nodePolyfill = exports.getStaticRoutePaths = exports.fixHtmlSuffix = exports.findJSON = exports.removeSuffixHtml = exports.modifyTitle = exports.injectChunkMaps = exports._getDocumentHandler = exports.isDynamicRoute = void 0;

var _cheerio = _interopRequireDefault(require("cheerio"));

var _ssrPolyfill = _interopRequireDefault(require("ssr-polyfill"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const isDynamicRoute = path => {
  return path.split('/').some(snippet => snippet.startsWith(':'));
};

exports.isDynamicRoute = isDynamicRoute;

const _getDocumentHandler = (html, option) => {
  return _cheerio.default.load(html, _objectSpread({
    decodeEntities: false,
    recognizeSelfClosing: true
  }, option));
};

exports._getDocumentHandler = _getDocumentHandler;

const injectChunkMaps = (html, chunkMap, publicPath) => {
  const js = chunkMap.js,
        css = chunkMap.css;

  const $ = _getDocumentHandler(html); // filter umi.css and umi.*.css, htmlMap have includes


  const styles = css.filter(style => !/^umi([.\w]*)?\.css$/g.test(style)) || [];
  styles.forEach(style => {
    $('head').append(`<link rel="stylesheet" href="${publicPath}${style}" />`);
  }); // filter umi.js and umi.*.js

  const scripts = js.filter(script => !/^umi([.\w]*)?\.js$/g.test(script)) || [];
  scripts.forEach(script => {
    $('head').append(`<link rel="preload" href="${publicPath}${script}" as="script"/>`);
  });
  return $.html();
};

exports.injectChunkMaps = injectChunkMaps;

const modifyTitle = (html, title) => {
  const $ = _getDocumentHandler(html);

  if (html && title) {
    $('title').text(title);
  }

  return $.html();
};

exports.modifyTitle = modifyTitle;

const removeSuffixHtml = path => {
  return path.replace('?', '').replace('(', '').replace(')', '').replace(/\.(html|htm)/g, '');
};

exports.removeSuffixHtml = removeSuffixHtml;

const isHtmlPath = path => {
  return /\.(html|htm)/g.test(path);
};

const findJSON = (baseDir, fileName) => {
  const _require = require('path'),
        join = _require.join;

  const _require2 = require('fs'),
        existsSync = _require2.existsSync;

  const absFilePath = join(baseDir, fileName);

  if (existsSync(absFilePath)) {
    return absFilePath;
  }
};

exports.findJSON = findJSON;

const fixHtmlSuffix = route => {
  if (route.path && route.path !== '/' && !isHtmlPath(route.path) && !isDynamicRoute(route.path) && !route.redirect) {
    route.path = `${route.path}(.html)?`;
  }
};

exports.fixHtmlSuffix = fixHtmlSuffix;

const getStaticRoutePaths = (routes, _) => {
  return _.uniq(routes.reduce((memo, route) => {
    // filter dynamic Routing like /news/:id, etc.
    if (route.path && !isDynamicRoute(route.path) && !route.redirect) {
      memo.push(removeSuffixHtml(route.path));

      if (route.routes) {
        memo = memo.concat(getStaticRoutePaths(route.routes, _));
      }
    }

    return memo;
  }, []));
};

exports.getStaticRoutePaths = getStaticRoutePaths;

const nodePolyfill = (url, context, disablePolyfill = false) => {
  const mountGlobal = ['document', 'location', 'navigator', 'Image', 'self'];

  if (disablePolyfill) {
    global.window = {};
    mountGlobal.forEach(mount => {
      global[mount] = mockWin[mount];
    });
    return global.window;
  }

  let params = {};

  if (typeof context === 'object') {
    params = context;
  } else if (typeof context === 'function') {
    params = context();
  }

  const mockWin = (0, _ssrPolyfill.default)(_objectSpread({
    url
  }, params)); // mock first

  global.window = mockWin; // mock global

  mountGlobal.forEach(mount => {
    global[mount] = mockWin[mount];
  }); // merge user global params

  Object.keys(params).forEach(key => {
    // just mount global key (filter mountGlobal)
    // like { USER_BAR: "foo" }
    // => global.USER_BAR = "foo";
    // => global.window.USER_BAR = "foo";
    if (!mountGlobal.includes(key)) {
      global[key] = params[key];
    }
  });
  return mockWin;
};

exports.nodePolyfill = nodePolyfill;

const patchWindow = context => {
  let params = {};

  if (typeof context === 'object') {
    params = context;
  }

  Object.keys(params).forEach(key => {
    // just mock global.window.bar = '';
    global.window[key] = typeof params[key] === 'object' ? _objectSpread({}, global.window[key], {}, params[key]) : params[key];
    global[key] = global.window[key];
  });
};

exports.patchWindow = patchWindow;

const getSuffix = filename => {
  return `${filename || 'index'}.html`;
};

exports.getSuffix = getSuffix;