// Helper script available to sls deployments at deploy time.

module.exports = () => new Date().toISOString();