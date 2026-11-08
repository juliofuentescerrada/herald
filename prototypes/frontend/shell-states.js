const params = new URLSearchParams(location.search);
const allowed = new Set([...document.querySelectorAll('[data-state-link]')].map(link => link.dataset.stateLink));
const active = allowed.has(params.get('state')) ? params.get('state') : 'public-shell';
document.querySelectorAll('.shell-state').forEach(section => section.hidden = section.id !== active);
document.querySelector(`[data-state-link="${active}"]`).setAttribute('aria-current', 'page');

// Narrow public navigation: a disclosure; `menu=open` opens it for review captures.
document.querySelectorAll('.shell-menu-button').forEach(button => {
  const header = button.closest('.shell-publicnav');
  const toggle = open => { header.classList.toggle('is-open', open); button.setAttribute('aria-expanded', String(open)); };
  button.addEventListener('click', () => toggle(button.getAttribute('aria-expanded') !== 'true'));
  if (params.get('menu') === 'open') toggle(true);
});

document.querySelectorAll('[data-demo-action]').forEach(button => button.addEventListener('click', () => {
  const feedback = button.closest('main').querySelector('.shell-feedback');
  feedback.textContent = 'Review only: ' + button.dataset.demoAction;
  feedback.hidden = false;
}));
document.querySelectorAll('[data-dismiss]').forEach(button => button.addEventListener('click', () => button.closest('.shell-banner').remove()));
