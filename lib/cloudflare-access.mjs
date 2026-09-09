const decode = value => JSON.parse(new TextDecoder().decode(Uint8Array.from(
  atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')),
  character => character.charCodeAt(0),
)));

const teamUrl = value => {
  const url = String(value || '').trim().replace(/\/$/, '');
  return url.startsWith('https://') ? url : `https://${url}`;
};

export async function verifyCloudflareAccess(request, env, fetcher = fetch) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  const audience = String(env.CF_ACCESS_AUD || '').trim();
  const issuer = teamUrl(env.CF_ACCESS_TEAM_DOMAIN);
  const allowedEmail = String(env.GUIDE_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!token || !audience || !env.CF_ACCESS_TEAM_DOMAIN || !allowedEmail) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = decode(parts[0]);
    const claims = decode(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) return null;
    const response = await fetcher(`${issuer}/cdn-cgi/access/certs`);
    if (!response.ok) return null;
    const { keys = [] } = await response.json();
    const jwk = keys.find(key => key.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signature = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[2].length / 4) * 4, '=')), character => character.charCodeAt(0));
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!valid || claims.iss !== issuer || !audiences.includes(audience) || claims.exp <= now || claims.nbf > now) return null;
    return String(claims.email || '').toLowerCase() === allowedEmail ? claims : null;
  } catch {
    return null;
  }
}
