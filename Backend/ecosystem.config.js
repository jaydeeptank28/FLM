module.exports = {
  apps: [{
    name: "flm-backend",
    script: "./index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "development",
      PORT: 4747
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 4747 
    }
  }]
};
