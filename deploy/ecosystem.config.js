module.exports = {
  apps: [
    {
      name: 'gmaths-backend',
      script: './dist/index.js',
      cwd: '/var/www/gmaths/backend',
      instances: 1, // Single instance for t2.small
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: '', // To be set via environment
        JWT_SECRET: '', // To be set via environment
        REDIS_URL: '', // To be set via environment
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/gmaths/backend-error.log',
      out_file: '/var/log/gmaths/backend-out.log',
      log_file: '/var/log/gmaths/backend-combined.log',
      time: true,
      merge_logs: true,
      // Health check configuration
      health_check_endpoint: 'http://localhost:3000/health',
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      // Resource limits for t2.small instance
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Environment specific settings
      node_args: ['--max-old-space-size=512'], // Limit Node.js memory for t2.small
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: ['gmaths.edu.vn'],
      ref: 'origin/main',
      repo: 'https://github.com/gmaths-education/gmaths-education-website.git',
      path: '/var/www/gmaths',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
}; 