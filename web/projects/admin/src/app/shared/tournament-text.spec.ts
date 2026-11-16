import { lifecycleLabels } from './tournament-text';

describe('Lifecycle labels', () => {
  it('show a finalised competition as Finalised, text only',
    { meta: { type: 'covers', description: 'competition-finalisation: The tournament list after finalisation' } }, () => {
      expect(lifecycleLabels({ publication: 'published', registration: 'closed', competition: 'finalised' })[2]).toEqual({ text: 'Finalised', tone: 'success' });
    });

  it('keep Running and Preparing as they were', () => {
    expect(lifecycleLabels({ publication: 'published', registration: 'closed', competition: 'running' })[2].text).toBe('Running');
    expect(lifecycleLabels({ publication: 'draft', registration: 'notOpen', competition: 'preparation' })[2].text).toBe('Preparing');
  });

  it('show a cancelled competition as Cancelled and an archived one with Archived beside it', () => {
    expect(lifecycleLabels({ publication: 'published', registration: 'closed', competition: 'cancelled', archived: true }).slice(2)).toEqual([
      { text: 'Cancelled', tone: 'danger' },
      { text: 'Archived' },
    ]);
  });
});
