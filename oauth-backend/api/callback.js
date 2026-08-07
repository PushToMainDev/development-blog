function cookies(header = "") {
  return Object.fromEntries(header.split(";").map(x => x.trim()).filter(Boolean).map(x => {
    const i = x.indexOf("="); return [x.slice(0,i), decodeURIComponent(x.slice(i+1))];
  }));
}

module.exports = async function handler(req, res) {
  const { code, state } = req.query;
  const c = cookies(req.headers.cookie || "");

  if (!code || !state || !c.oauth_state || state !== c.oauth_state)
    return res.status(400).send("Invalid OAuth request.");

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    return res.status(500).send("Missing OAuth environment variables.");

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
  });
  const data = await response.json();
  if (!data.access_token) return res.status(400).send("GitHub authentication failed.");

  const payload = JSON.stringify({ token: data.access_token, provider: "github" }).replace(/'/g, "\\'");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html><html><body><script>
    (function(){
      function receiveMessage(e) {
        window.opener.postMessage('authorization:github:success:${payload}', e.origin);
        window.removeEventListener("message", receiveMessage, false);
        window.close();
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener && window.opener.postMessage("authorizing:github", "*");
    })();
  </script><p>Authentication complete. This window can close.</p></body></html>`);
};
