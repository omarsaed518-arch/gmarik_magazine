/* Gmarik Magazine — local password gate for dashboard demos.
   Important: this protects the browser interface only. Enforce the same roles
   in Firebase Authentication + Firestore Security Rules for real protection. */
window.GmarikRoleGate = (() => {
  const hash = async value => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
  };

  function mountStyle() {
    if (document.getElementById('gmarik-role-gate-style')) return;
    const style = document.createElement('style');
    style.id = 'gmarik-role-gate-style';
    style.textContent = `
      #gmarik-role-gate{position:fixed;inset:0;z-index:999999;background:radial-gradient(circle at top right,#253967,#060a14 56%);display:grid;place-items:center;padding:20px;font-family:Cairo,Tahoma,Arial,sans-serif;color:#f8fafc;direction:rtl}
      #gmarik-role-gate .gate-card{width:min(440px,100%);padding:32px;border:1px solid rgba(226,183,20,.5);border-radius:22px;background:rgba(12,20,38,.96);box-shadow:0 25px 70px rgba(0,0,0,.55);text-align:center}
      #gmarik-role-gate .gate-icon{width:60px;height:60px;margin:0 auto 14px;display:grid;place-items:center;border-radius:18px;color:#101827;background:linear-gradient(135deg,#fff1a9,#e2b714);font-size:25px}
      #gmarik-role-gate h1{font-size:1.35rem;margin:0 0 8px}#gmarik-role-gate p{color:#a8b7d0;font-size:.9rem;line-height:1.7;margin:0 0 18px}
      #gmarik-role-gate input{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#080e1c;color:#fff;padding:13px 14px;outline:0;font:inherit;direction:ltr;text-align:left}
      #gmarik-role-gate input:focus{border-color:#e2b714}#gmarik-role-gate button{width:100%;margin-top:11px;border:0;border-radius:12px;padding:13px;background:linear-gradient(135deg,#ffe998,#e2b714);color:#121827;font:800 1rem Cairo,Tahoma,Arial,sans-serif;cursor:pointer}
      #gmarik-role-gate .gate-error{min-height:20px;margin:9px 0 0;color:#ff9ca5;font-size:.78rem}
    `;
    document.head.appendChild(style);
  }

  async function protect({ role, label, passwordHash }) {
    if (!role || !label || !passwordHash) throw new Error('Role gate configuration is incomplete.');
    const key = `gmarik_dashboard_role_${role}`;
    if (sessionStorage.getItem(key) === 'granted') return;
    mountStyle();
    const overlay = document.createElement('section');
    overlay.id = 'gmarik-role-gate';
    overlay.innerHTML = `<div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div class="gate-icon">🔐</div><h1 id="gate-title">دخول ${label}</h1>
      <p>هذه اللوحة مخصصة لهذه الصلاحية فقط. من فضلك أدخل كلمة المرور للمتابعة.</p>
      <form id="gmarik-role-form"><input id="gmarik-role-password" type="password" autocomplete="current-password" placeholder="كلمة المرور" required autofocus>
      <button type="submit">دخول آمن</button><div class="gate-error" aria-live="polite"></div></form></div>`;
    document.body.prepend(overlay);
    overlay.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const entered = overlay.querySelector('input').value;
      if (await hash(entered) === passwordHash) {
        sessionStorage.setItem(key, 'granted');
        overlay.remove();
      } else {
        overlay.querySelector('.gate-error').textContent = 'كلمة المرور غير صحيحة. حاول مرة أخرى.';
        overlay.querySelector('input').select();
      }
    });
  }
  return { protect, hash };
})();
