const allowed = new Set([...document.querySelectorAll('[data-state-link]')].map(link => link.dataset.stateLink));
const requested = new URLSearchParams(location.search).get('state');
const active = allowed.has(requested) ? requested : 'onboarding';
document.querySelectorAll('.review-state').forEach(section => section.hidden = section.id !== active);
document.querySelectorAll('[data-state-link]').forEach(link => {
  if (link.dataset.stateLink === active) link.setAttribute('aria-current', 'page');
});
document.querySelectorAll('[data-demo-action]').forEach(button => button.addEventListener('click', () => {
  const feedback = document.querySelector('#review-feedback');
  feedback.textContent = 'Review only: ' + button.dataset.demoAction;
  feedback.hidden = false;
}));

// Keep the current snapshot visible in the narrow horizontal navigator.
if (matchMedia('(max-width:700px)').matches) {
  const navigation = document.querySelector('.review-nav');
  const current = navigation.querySelector('[aria-current="page"]');
  if (current) navigation.scrollLeft = current.offsetLeft - navigation.offsetLeft - 16;
}
