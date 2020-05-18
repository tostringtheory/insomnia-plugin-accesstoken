module.exports = {
  name: 'prefix',
  displayName: 'Auth Prefix',
  description: "reference auth prefix from other requests",
  args: [
    {
      displayName: 'Request',
      type: 'model',
      model: 'Request',
    },
    {
      displayName: 'Disallow Prefix(s)',
      type: 'string',
      help: 'If needed, specify 1 or more \';\' delimited prefixes to disallow.  To  customize the error message, delimit with \':\'.  i.e. "NO_PREFIX:The selected request has specifically specified no prefix"',
      defaultValue: ''
    }
  ],

  async run(context, oauthRequestId, disallowed) {
    const { meta } = context;

    if (!meta.requestId || !meta.workspaceId) {
      return null;
    }

    if (!oauthRequestId) {
      throw new Error('No request specified');
    }

    const authenticationRequest = await context.util.models.request.getById(oauthRequestId);
    const prefix = ((authenticationRequest || {}).authentication || {}).tokenPrefix;

    const sentinels = mapDisallowedToSentinelPairs(disallowed);
    sentinels.forEach(sentinel => {
      if (prefix === sentinel.prefix)
        throw new Error(sentinel.message);
    });

    return `${prefix || 'Bearer'}`.trim();
  }
};

function mapDisallowedToSentinelPairs(disallowed) {
  return (disallowed || '')
    .trim()
    .split(';')
    .map(disallowed => {
      const parts = disallowed.split(':');
      const sentinel = { prefix: parts[0], message: "The referenced request prefix is disallowed" };
      if (parts.length > 1)
        sentinel.message = parts[1];
      return sentinel;
    });
}
