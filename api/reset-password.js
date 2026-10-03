// Vercel Serverless Function: ang admin lang ang puwedeng mag-reset ng password ng client.
// Kailangan ng env var na FIREBASE_SERVICE_ACCOUNT (laman ng service account JSON).
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

// Mga email na pinapayagang mag-reset (dapat kapareho ng ADMIN_EMAILS sa admin.html)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@admin.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST lang ang tinatanggap.' });

  try {
    const { idToken, email, password } = req.body || {};
    if (!idToken) return res.status(401).json({ ok: false, error: 'Walang login token.' });

    // Siguraduhing admin ang nagpapadala ng request
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!ADMIN_EMAILS.includes((decoded.email || '').toLowerCase())) {
      return res.status(403).json({ ok: false, error: 'Hindi awtorisado. Admin lang ang puwede.' });
    }

    const targetEmail = String(email || '').trim().toLowerCase();
    if (!targetEmail) return res.status(400).json({ ok: false, error: 'Walang email.' });
    if (!password || String(password).length < 6) {
      return res.status(400).json({ ok: false, error: 'Hindi bababa sa 6 na karakter ang password.' });
    }

    let user, created = false;
    try {
      user = await admin.auth().getUserByEmail(targetEmail);
      await admin.auth().updateUser(user.uid, { password: String(password) });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        user = await admin.auth().createUser({ email: targetEmail, password: String(password) });
        created = true;
      } else {
        throw e;
      }
    }
    // I-logout ang lahat ng lumang session ng client
    await admin.auth().revokeRefreshTokens(user.uid);

    return res.status(200).json({ ok: true, uid: user.uid, created });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};
