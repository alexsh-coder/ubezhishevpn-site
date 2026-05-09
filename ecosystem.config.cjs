module.exports = {
  apps: [
    {
      name: 'ubezhishe',
      script: 'start-server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
