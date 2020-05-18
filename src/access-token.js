module.exports = {
  name: 'token',
  displayName: 'Access Token',
  description: "reference access token from other requests",
  args: [
    {
      displayName: 'Request',
      type: 'model',
      model: 'Request',
    },
    {
      displayName: 'Disable Auto Prefix',
      type: 'boolean',
      help: 'If this is disabled, your token will lack the prefix as specified on the source request.',
      defaultValue: false,
    },
    {
      displayName: 'Disable Expired Token Check',
      type: 'boolean',
      help: 'If this is disabled, you will not receive a notice when the token expires.',
      defaultValue: false,
    },
    {
      displayName: 'Disable Missing Token Check',
      type: 'boolean',
      help: 'If this is disabled, you will not receive a notice when the token is missing.',
      defaultValue: false,
    },
  ],

  async run(context,
    oauthRequestId,
    disableAutoPrefix,
    disableExpiredTokenCheck,
    disableMissingTokenCheck
  ) {
    const { meta } = context;

    if (!meta.requestId || !meta.workspaceId) {
      return null;
    }

    if (!oauthRequestId) {
      throw new Error('No request specified');
    }

    const authenticationRequest = await context.util.models.request.getById(oauthRequestId);
    const prefix = disableAutoPrefix ? '' : ((authenticationRequest || {}).authentication || {}).tokenPrefix || '';

    const token = await context.util.models.oAuth2Token.getByRequestId(authenticationRequest._id);
    const accessToken = (token || {}).accessToken || '';

    if (context.renderPurpose == null) {
      return `${prefix} ${accessToken || "<access-token-pending>"}`.trim();
    }

    if (!accessToken) {
      if (!disableMissingTokenCheck)
        await context.app.alert("Access Token", "The access token is missing");

      return '';
    }
    else if (token.expiresAt < new Date()) {
      if (!disableExpiredTokenCheck)
        await context.app.alert("Access Token", "The access token has expired");

      return '';
    }

    return `${prefix} ${accessToken}`.trim();
  }
};
