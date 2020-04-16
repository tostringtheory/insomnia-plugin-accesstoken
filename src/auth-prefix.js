module.exports = {
  name: 'prefix',
  displayName: 'Auth Prefix',
  description: "reference auth prefix from other requests",
  args: [
    {
      displayName: 'Request',
      type: 'model',
      model: 'Request',
    }
  ],

  async run(context, oauthRequestId) {
    const { meta } = context;

    if (!meta.requestId || !meta.workspaceId) {
      return null;
    }

    if (!oauthRequestId) {
      throw new Error('No request specified');
    }

    const authenticationRequest = await context.util.models.request.getById(oauthRequestId);
    const prefix = ((authenticationRequest || {}).authentication || {}).tokenPrefix;

    if (prefix === 'NO_PREFIX') {
    	throw new Error('The selected request has specifically specified no prefix');
    }

    return `${prefix || 'Bearer'}`.trim();
  }
};
