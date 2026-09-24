const validateIntegrationKey = (req, res, next) => {
  const key = req.headers['x-integration-key'];
  const secret = process.env.FITAI_INTEGRATION_SECRET;

  if (!secret) {
    console.error('FITAI_INTEGRATION_SECRET not configured');
    return res.status(500).json({ message: 'Integration not configured' });
  }

  if (!key || key !== secret) {
    return res.status(401).json({ message: 'Invalid integration key' });
  }

  next();
};

module.exports = { validateIntegrationKey };
