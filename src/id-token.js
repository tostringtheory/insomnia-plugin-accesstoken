module.exports = {
  name: 'id_token',
  displayName: 'ID Token',
  description: "reference ID token from other requests",
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
    const idToken = (token || {}).identityToken || '';

    if (context.renderPurpose == null) {
      return `${prefix} ${idToken || "<id-token-pending>"}`.trim();
    }

    if (!idToken) {
      if (!disableMissingTokenCheck)
        await context.app.alert("ID Token", "The ID token is missing");

      return '';
    }
    else if (token.expiresAt < new Date()) {
      if (!disableExpiredTokenCheck)
        await context.app.alert("ID Token", "The ID token has expired");

      return '';
    }

    return `${prefix} ${idToken}`.trim();
  }
};
