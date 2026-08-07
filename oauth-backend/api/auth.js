const crypto = require("crypto");

module.exports = async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).send("Missing GITHUB_CLIENT_ID.");

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo,user",
    state
  });

  res.setHeader("Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};
