if (import.meta.env.VITE_IS_LOCAL_SETUP_REQUIRED === undefined) {
  throw new Error('Env variable VITE_IS_LOCAL_SETUP_REQUIRED is required.');
}
if (import.meta.env.VITE_API_HOST === undefined) {
  throw new Error('Env variable VITE_API_HOST is required.');
}

const Config = {
  IS_LOCAL_SETUP_REQUIRED: Boolean(
    Number(import.meta.env.VITE_IS_LOCAL_SETUP_REQUIRED),
  ),
  API_HOST: import.meta.env.VITE_API_HOST,
};

export default Config;
