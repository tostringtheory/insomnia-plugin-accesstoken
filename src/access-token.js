module.exports = {
  name: 'token',
  displayName: 'Access Token',
  description: "reference access token from other requests",
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
    const prefix = ((authenticationRequest || {}).authentication || {}).tokenPrefix || '';

    const token = await context.util.models.oAuth2Token.getByRequestId(authenticationRequest._id);
    const accessToken = (token || {}).accessToken || '';

    if (context.renderPurpose == null) {
      return `${prefix} ${accessToken || "<access-token-pending>"}`.trim();
    }

    if (!accessToken) {
      await context.app.alert("Access Token", "The access token is missing");

      return '';
    }
    else if (token.expiresAt < new Date()) {
      await context.app.alert("Access Token", "The access token has expired");

      return '';
    }

    return `${prefix} ${accessToken}`.trim();
  }
};
