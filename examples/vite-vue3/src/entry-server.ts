import createApp from './main';
import { renderToString } from 'vue/server-renderer';
// import { renderHeadToString } from '@vueuse/head';
// import { ServerContext } from './interfaces/types';

export async function render(context: any, url: string, manifest: any, rootDir: string) {
  // const app = createSSRApp(App).use(store).use(router);
  // const { app, head, store, router } = await createApp(context);
  const { app, router } = await createApp(context);

  // set the router to the desired URL before rendering
  await router.push(url);
  await router.isReady();

  // redirect 체크
  const currentPath = router.currentRoute.value.fullPath;
  const isRedirected = !!router.currentRoute.value.redirectedFrom;
  
  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = {
    forbizServerContext: context
  } as any;
  const html = await renderToString(app, ctx);
  // const state = JSON.stringify(store.state);
  // const { headTags } = await renderHeadToString(head);

  // for testing. Use deep import built-in module. PR #5248
  const fs =
    process.versions.node.split('.')[0] >= '14'
      ? await import('fs/promises')
      : (await import('fs')).promises

  // the SSR manifest generated by Vite contains module -> chunk/asset mapping
  // which we can then use to determine what files need to be preloaded for this
  // request.
  const preloadLinks = renderPreloadLinks(ctx.modules, manifest);

  return {
    html,
    // headTags,
    // state,
    preloadLinks,
    currentPath,
    isRedirected
  };
}

function renderPreloadLinks(modules: any, manifest: any) {
  const seen = new Set();
  let links = '';

  modules.forEach((id: any) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file: any) => {
        if (!seen.has(file)) {
          seen.add(file)
          links += renderPreloadLink(file)
        }
      })
    }
  });

  return links;
}

function renderPreloadLink(file: any) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`;
  }
  else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`;
  }
  else {
    // TODO
    return '';
  }
}