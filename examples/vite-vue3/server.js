const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;

async function createServer(root = process.cwd(), isProd = process.env.NODE_ENV === 'production') {
  try {
    const resolve = (p) => path.resolve(__dirname, p);
    const app = express();
    const indexProd = isProd ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8') : fs.readFileSync(resolve('index.html'), 'utf-8');
    const manifest = isProd
      ? require('./dist/client/ssr-manifest.json')
      : {};
    /**
     * @type {import('vite').ViteDevServer}
     */
    let vite;

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }));

    // parse application/json
    app.use(bodyParser.json());

    //
    // app.use(cookieParser());

    if (isProd) {
      app.use(require('compression')());
      app.use(
        require('serve-static')(resolve('dist/client'), {
          index: false,
        }),
      );
    }
    else {
      vite = await require('vite').createServer({
        root,
        logLevel: isTest ? 'error' : 'info',
        server: {
          middlewareMode: 'ssr',
          watch: {
            // During tests we edit the files too fast and sometimes chokidar
            // misses change events, so enforce polling for consistency
            usePolling: true,
            interval: 100,
          },
        },
      });
      // use vite's connect instance as middleware
      app.use(vite.middlewares);
    }

    app.get('/NodeServerHealthCheck', async (req, res) => {
      try {
        const healthcheck = {
          uptime: process.uptime(),
          message: 'OK',
          timestamp: new Date().toString()
        };

        res.send(healthcheck);
      }
      catch (e) {
        // healthcheck.message = e;
        res.status(500).send();
      }
    });

    app.use('/external', express.static(path.join(__dirname, isProd ? './dist/libs/external' : './external')));

    let entryRender;
    app.use('/*', async (req, res) => {
      try {
        const url = req.originalUrl;
        // const userAgent = req.get('User-Agent');
        // const isCrawler = true; //userAgent.test(//);
        let template;
        let render;
        let html;

        if (isProd) {
          template = indexProd;
          render = entryRender ? entryRender : require('./dist/server/entry-server.js').render;
          if (!entryRender) entryRender = render;
          
        }
        else {
          // always read fresh template in dev
          template = fs.readFileSync(resolve('index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          render = (await vite.ssrLoadModule('/src/entry-server.ts')).render;
        }

        const {
          html: appHTML,
          headTags,
          state,
          preloadLinks,
          isRedirected,
          currentPath,
        } = await render({ req }, url, manifest, __dirname);

        if (isRedirected) {
          res.redirect(currentPath);
        }
        else {
          // if(isCrawler) {
          html = template.replace('<!--preload-links-->', preloadLinks)
            .replace('<!--ssr-outlet-->', appHTML)
            .replace('<!--head-tags-->', headTags)
            .replace('<!--vuex-state-->', state);
          // }
          // else {
          //   html = template.replace(`<!--preload-links-->`, preloadLinks).replace(/\<\$\= title \$\>/g, Math.random());
          // }

          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);

          html = null;
        }
      }
      catch (ex) {
        vite && vite.ssrFixStacktrace(ex);
        res.status(500).end(ex.stack);
      }
    });

    return { app, vite };
  }
  catch (ex) {
    if (!isProd) console.error('create server error... ', ex);

    process.exit();
  }
}

if (!isTest) {
  const isProd = 'production' === process.env.NODE_ENV;
  const port = isProd ? 33330 : 33333;

  // initLogger();
  createServer(process.cwd(), isProd).then(({ app }) => 
    app.listen(port, () => {
      const startMessage = `server start ${port}`;

      if (!isProd) console.log(startMessage);

      console.info(startMessage);
    })
  ).catch(ex => {
    console.error('run server error... ', ex.stack);
  });
}

process.on('unhandledRejection', function(reason) {
  console.error(reason.stack);
});

exports.createServer = createServer;
