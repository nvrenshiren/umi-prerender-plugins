"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var path = _interopRequireWildcard(require("path"));

var fs = _interopRequireWildcard(require("fs"));

var _reactSsrChecksum = require("react-ssr-checksum");

var mkdirp = _interopRequireWildcard(require("mkdirp"));

var _utils = require("./utils");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _default = (api, opts) => {
  const debug = api.debug,
        config = api.config,
        findJS = api.findJS,
        _ = api._,
        log = api.log,
        paths = api.paths;

  const _ref = opts || {},
        _ref$exclude = _ref.exclude,
        exclude = _ref$exclude === void 0 ? [] : _ref$exclude,
        _ref$runInMockContext = _ref.runInMockContext,
        runInMockContext = _ref$runInMockContext === void 0 ? {} : _ref$runInMockContext,
        _ref$staticMarkup = _ref.staticMarkup,
        staticMarkup = _ref$staticMarkup === void 0 ? false : _ref$staticMarkup,
        _ref$htmlSuffix = _ref.htmlSuffix,
        htmlSuffix = _ref$htmlSuffix === void 0 ? false : _ref$htmlSuffix,
        _ref$disablePolyfill = _ref.disablePolyfill,
        disablePolyfill = _ref$disablePolyfill === void 0 ? false : _ref$disablePolyfill,
        _ref$checkSum = _ref.checkSum,
        checkSum = _ref$checkSum === void 0 ? false : _ref$checkSum,
        _ref$postProcessHtml = _ref.postProcessHtml,
        postProcessHtml = _ref$postProcessHtml === void 0 ? null : _ref$postProcessHtml,
        _ref$diyRender = _ref.diyRender,
        diyRender = _ref$diyRender === void 0 ? null : _ref$diyRender;

  if (!config.ssr) {
    throw new Error('config must use { ssr: true } when using umi preRender plugin');
  }

  api.onPatchRoute(({
    route
  }) => {
    debug(`route before, ${JSON.stringify(route)}`);

    if (htmlSuffix) {
      (0, _utils.fixHtmlSuffix)(route);
    }

    debug(`route after, ${JSON.stringify(route)}`);
  });

  if (checkSum) {
    api.addRendererWrapperWithComponent(() => {
      const modulePath = path.join(paths.absTmpDirPath, './CheckSum.js');
      fs.writeFileSync(modulePath, `import CheckSum from 'react-ssr-checksum';
          export default (props) => (
            <CheckSum checksumCode={window.UMI_PRERENDER_SUM_CODE}>{props.children}</CheckSum>
          )`);
      return {
        source: modulePath
      };
    });
  } // onBuildSuccess hook


  api.onBuildSuccessAsync(
  /*#__PURE__*/
  _asyncToGenerator(function* () {
    const routes = api.routes,
          paths = api.paths;
    const absOutputPath = paths.absOutputPath;
    const _ref3 = config.ssr,
          _ref3$manifestFileNam = _ref3.manifestFileName,
          manifestFileName = _ref3$manifestFileNam === void 0 ? 'ssr-client-mainifest.json' : _ref3$manifestFileNam; // require serverRender function

    const umiServerFile = findJS(absOutputPath, 'umi.server');
    const manifestFile = (0, _utils.findJSON)(absOutputPath, manifestFileName);

    if (!umiServerFile) {
      throw new Error(`can't find umi.server.js file`);
    } // mock window


    (0, _utils.nodePolyfill)('http://localhost', runInMockContext, disablePolyfill);

    const serverRender = require(umiServerFile);

    const routePaths = (0, _utils.getStaticRoutePaths)(routes, _).filter(path => !/(\?|\)|\()/g.test(path)); // exclude render paths

    const renderPaths = routePaths.filter(path => !exclude.includes(path));
    debug(`renderPaths: ${renderPaths.join(',')}`);
    log.start('umiJS prerender start'); // loop routes

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = renderPaths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        const url = _step.value;
        const ctx = {
          url,
          req: {
            url
          },
          request: {
            url
          }
        }; // init window BOM

        (0, _utils.nodePolyfill)(`http://localhost${url}`, runInMockContext, disablePolyfill); // throw umi.server.js error stack, not catch

        const ReactDOMServer = serverRender.ReactDOMServer;
        debug(`react-dom version: ${ReactDOMServer.version}`);

        const _ref4 = yield serverRender.default(ctx),
              htmlElement = _ref4.htmlElement,
              matchPath = _ref4.matchPath;

        let ssrHtml = diyRender ? yield diyRender(ReactDOMServer, htmlElement, _utils._getDocumentHandler) : ReactDOMServer[staticMarkup ? 'renderToStaticMarkup' : 'renderToString'](htmlElement); // console.log(JSON.stringify(ssrHtml))

        if (checkSum) {
          try {
            const hashCode = (0, _reactSsrChecksum.getCode)(ssrHtml);
            debug(`hashCode: ${hashCode}`);
            ssrHtml = ssrHtml.replace('</head>', `<script>window.UMI_PRERENDER_SUM_CODE = "${hashCode}";</script></head>`);
          } catch (e) {
            log.warn('getHashCode error', e);
          }
        }

        if (postProcessHtml) {
          try {
            const $ = (0, _utils._getDocumentHandler)(ssrHtml); // avoid user not return $

            ssrHtml = (postProcessHtml($, url) || $).html();
            debug(`ssrHtml: ${ssrHtml}`);
          } catch (e) {
            log.warn(`${url} postProcessHtml`, e);
          }
        }

        try {
          const manifest = require(manifestFile);

          const chunk = manifest[matchPath];
          debug('matchPath', matchPath);
          debug('chunk', chunk);

          if (chunk) {
            ssrHtml = (0, _utils.injectChunkMaps)(ssrHtml, chunk, config.publicPath || '/');
          }
        } catch (e) {
          log.warn(`${url} reading get chunkMaps failed`, e);
        }

        const dir = url.substring(0, url.lastIndexOf('/'));
        const filename = (0, _utils.getSuffix)(url.substring(url.lastIndexOf('/') + 1, url.length));

        try {
          // write html file
          const outputRoutePath = path.join(absOutputPath, dir);
          mkdirp.sync(outputRoutePath);
          fs.writeFileSync(path.join(outputRoutePath, filename), `<!DOCTYPE html>${ssrHtml}`);
          log.complete(`${path.join(dir, filename)}`);
        } catch (e) {
          log.fatal(`${url} render ${filename} failed`, e);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    log.success('umiJS prerender success!');
  }));
};

exports.default = _default;