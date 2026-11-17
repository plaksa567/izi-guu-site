// The demo keeps a local account directory. Signing out clears only the session.
(() => {
  const form = document.getElementById('accountForm');
  const mail = document.getElementById('accountEmail');
  const password = document.getElementById('accountPassword');
  const message = document.getElementById('accountMessage');
  const directoryKey = 'izi-local-accounts-v3';
  let busy = false;

  function hex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function verifier(value, salt) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(value), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 210000
    }, key, 256);
    return hex(new Uint8Array(bits));
  }

  async function submit(mode) {
    if (busy) return;
    const register = mode === 'register';
    const valid = register ? form.reportValidity() : mail.reportValidity() && password.reportValidity();
    if (!valid) return;
    const email = mail.value.trim().toLowerCase();
    const name = document.getElementById('accountName').value.trim();
    if (register && !name) { message.textContent = 'Введи имя.'; return; }
    if (!window.crypto?.subtle) {
      message.textContent = 'Для входа открой сайт через localhost или HTTPS.';
      return;
    }
    busy = true;
    message.textContent = '';
    try {
      const records = load(directoryKey, []);
      let record = records.find(item => item.email === email);
      if (register) {
        if (record) { message.textContent = 'Такой email уже зарегистрирован. Нажми «Войти».'; return; }
        const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
        record = { name, email, role: document.getElementById('accountRole').value, salt, hash: await verifier(password.value, salt) };
        const latest = load(directoryKey, []);
        if (latest.some(item => item.email === email)) { message.textContent = 'Такой email уже зарегистрирован.'; return; }
        save(directoryKey, [...latest, record]);
      } else if (!record || await verifier(password.value, record.salt) !== record.hash) {
        message.textContent = 'Проверь email и пароль демо-аккаунта в этом браузере.';
        return;
      }
      save('izi-user', { name: record.name, email: record.email, role: record.role });
      form.reset();
      renderAccountUI();
      closeModal('accountModal');
      if (!finishAuthReturn()) toast(register ? 'Демо-аккаунт создан' : 'Вход выполнен');
    } catch {
      message.textContent = 'Не удалось сохранить вход. Проверь, разрешено ли браузеру сохранять данные сайта.';
    } finally {
      busy = false;
    }
  }

  form.addEventListener('submit', event => { event.preventDefault(); submit('register'); });
  document.getElementById('loginButton').addEventListener('click', () => submit('login'));
})();
