// import { State } from '@/store';
import createApp from './main';

// declare global {
//   interface Window {
//     __INITIAL_STATE__: State;
//   }
// }

const init = async () => {
  // const { app, store, router } = await createApp();
  const { app, router } = await createApp();

  // if (window.__INITIAL_STATE__) {
    // store.replaceState(window.__INITIAL_STATE__);
  // }

  router.isReady().then(() => {
    app.mount('#app');
  });
};

init();