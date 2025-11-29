// File: api/go.js
export default function handler(req, res) {
  // 1) Map IDs to your affiliate URLs (now with 3 entries)
  const map = {
    "go-car-quote-auto-insurance":
      "https://adswinleads.o18.link/c?o=21843210&m=21935&a=721565&aff_click_id={replace_it}&sub_aff_id={replace_it}",
    "super-auto-budget":
      "https://adswinleads.o18.link/c?o=21812552&m=21935&a=721565&aff_click_id={replace_it}&sub_aff_id={replace_it}",
    "auto-quote-hub":
      "https://adswinleads.o18.link/c?o=21852507&m=21935&a=721565&aff_click_id={replace_it}&sub_aff_id={replace_it}"
  };

  const id = req.query.id;
  let dest = map[id];
  if (!dest) return res.status(404).send("Unknown link id");

  // 2) Build click IDs (ad_id/adset_id if present; else random)
  const clickId =
    req.query.aff_click_id ||
    req.query.ad_id ||
    req.query.fbclid ||
    ("r" + Date.now().toString(36) + Math.random().toString(36).slice(2,8));

  const subId =
    req.query.sub_aff_id ||
    req.query.adset_id ||
    req.query.campaign_id ||
    clickId;

  // 3) Replace placeholders and append UTMs
  dest = dest.replace(/{replace_it}/g, encodeURIComponent(clickId));

  const UTM = [
    "utm_source","utm_medium","utm_campaign","utm_content","utm_term",
    "fbclid","gclid","msclkid","campaign_id","adset_id","ad_id","src"
  ];

  const u = new URL(dest);
  u.searchParams.set("aff_click_id", clickId);
  u.searchParams.set("sub_aff_id",  subId);
  for (const k of UTM) if (req.query[k] && !u.searchParams.has(k)) u.searchParams.set(k, req.query[k]);

  // 4) Optional fallback HTML (button) if auto-redirects are blocked
  if (req.query.mode === "html") {
    const final = u.toString();
    res.setHeader("Content-Type","text/html; charset=utf-8");
    res.setHeader("Cache-Control","no-store");
    res.setHeader("Referrer-Policy","no-referrer");
    return res.status(200).send(`<!doctype html>
<meta name="referrer" content="no-referrer">
<title>Redirecting…</title>
<style>
  body{font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.45;margin:40px;color:#111}
  a{background:#0c4a6e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none}
  .box{max-width:520px;margin:auto;text-align:center}
</style>
<div class="box">
  <h1>Taking you to our partner…</h1>
  <p>If nothing happens, click Continue.</p>
  <p><a href="${final}" rel="noreferrer">Continue</a></p>
</div>
<script>setTimeout(function(){location.replace(${JSON.stringify(final)});},300);</script>`);
  }

  // 5) Normal 302 redirect
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Referrer-Policy","no-referrer-when-downgrade");
  return res.redirect(302, u.toString());
}