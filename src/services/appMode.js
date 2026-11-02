export const localMode = import.meta.env?.VITE_DATA_MODE !== 'firebase';

if (localMode && import.meta.env?.PROD && import.meta.env?.VITE_ALLOW_LOCAL_PRODUCTION !== 'true') {
  throw new Error('Le mode local est interdit en production. Configurez VITE_DATA_MODE=firebase.');
}
