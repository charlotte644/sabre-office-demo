/* SABRE OFFICE DEMO - shared helpers (talking to the back end, formatting, page header and footer). */
(function () {
  var CFG = window.SABRE_CONFIG || {};
  var S = window.Sabre = {};
  var LOGO = 'https://www.sabreoffice.co.uk/admin/images/sitelogo/22241_SiteLogo.jpg';

  S.h = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  S.money = function (n) { return '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  S.date = function (iso) { if (!iso) return ''; var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  S.dateTime = function (iso) { if (!iso) return ''; var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
  S.qs = function (name) { return new URLSearchParams(location.search).get(name) || ''; };
  S.$ = function (sel, root) { return (root || document).querySelector(sel); };
  S.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // browser storage that never throws
  S.store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  // calls a function on the Apps Script back end
  S.api = function (fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (!CFG.SCRIPT_URL) return Promise.reject(new Error('This demo is not connected to its back end yet.'));
    return fetch(CFG.SCRIPT_URL, {
      method: 'POST', credentials: 'omit', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args })
    }).then(function (res) { return res.text(); }, function () {
      throw new Error('We could not reach the system. Please check your connection and try again.');
    }).then(function (text) {
      var reply;
      try { reply = JSON.parse(text); } catch (e) { throw new Error('The system is having a moment. Please try again in a minute.'); }
      if (!reply.ok) throw new Error(reply.error || 'Something went wrong.');
      return reply.result;
    });
  };

  S.toast = function (msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || ''); t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, kind === 'err' ? 6000 : 3500);
  };

  S.modal = function (html, opts) {
    var ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener('mousedown', function (e) { if (e.target === ov && !(opts && opts.sticky)) close(); });
    ov.close = close;
    return ov;
  };

  S.busy = function (btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner' + (btn.classList.contains('ghost') ? ' dark' : '') + '"></span> ' + (label || 'Please wait'); }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  };

  S.stagePill = function (stage) {
    var cls = { 'New enquiry': '', 'Measure-up requested': 'amber', 'Measure-up booked': 'green', 'Quote sent': '', 'Accepted - awaiting payment': 'amber', 'Paid - order confirmed': 'green', 'Out for delivery': 'amber', 'Delivered': 'green', 'Declined - save the sale': 'red', 'Closed - lost': 'grey' }[stage] || '';
    return '<span class="pill ' + cls + '">' + S.h(S.stageLabel(stage)) + '</span>';
  };
  S.stageLabel = function (stage) { return { 'Measure-up requested': 'Visit requested', 'Measure-up booked': 'Visit booked', 'Declined - save the sale': 'Declined: call to save' }[stage] || String(stage || '').replace(' - ', ': '); };

  // client's log-in session (kept in this browser only)
  S.session = {
    get: function () { return S.store.get('sabre_session'); },
    set: function (s, cust) { S.store.set('sabre_session', { token: s, customer: cust }); },
    clear: function () { S.store.del('sabre_session'); }
  };

  // page chrome ---------------------------------------------------------------------------------
  S.layout = function (active) {
    var ses = S.session.get();
    var acct = ses && ses.customer ? 'Hi ' + S.h((ses.customer.name || '').split(' ')[0]) : 'Your account';
    var head =
      '<div class="topbar"><div class="wrap"><div><a href="index.html">Home</a><a href="mailto:sales@sabreoffice.co.uk">Contact us</a></div>' +
      '<div>Call us: <a href="tel:02920882780" style="margin-right:12px">029 2088 2780</a> Email: <a href="mailto:sales@sabreoffice.co.uk" style="margin-right:0">sales@sabreoffice.co.uk</a></div></div></div>' +
      '<div class="mainhead"><div class="wrap"><a href="index.html"><img class="logo" src="' + LOGO + '" alt="Sabre Office"></a>' +
      '<div class="headlinks"><a href="account.html"><span class="ico" aria-hidden="true">&#9679;</span><span>' + acct + '<br><span class="small muted">' + (ses ? 'My orders' : 'Log in') + '</span></span></a></div></div></div>' +
      '<nav class="nav"><div class="wrap"><a href="index.html" class="' + (active === 'order' ? 'active' : '') + '">Order &amp; get a quote</a>' +
      '<a href="account.html" class="' + (active === 'account' ? 'active' : '') + '">Existing customers: log in</a><span class="spacer"></span></div></nav>' +
      '<div class="demoband"><strong>DEMO SYSTEM</strong> built by Hammer &amp; Pen for Sabre Office. Try it with your own email address. No goods will be supplied and no money is taken.</div>';
    var foot =
      '<div class="footer"><div class="wrap">This is a demonstration of an automated quote-to-order process for Sabre Office, built by Hammer &amp; Pen. ' +
      'Product names and prices are read from <a href="https://www.sabreoffice.co.uk/" target="_blank" rel="noopener">www.sabreoffice.co.uk</a>. Prices shown are before VAT.</div></div>';
    var h = document.getElementById('site-header'), f = document.getElementById('site-footer');
    if (h) h.innerHTML = head;
    if (f) f.innerHTML = foot;
  };
})();
