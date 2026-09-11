/** Text fields GT may change. Everything else remains owned by English.
 * Shared by translation normalization and build-time validation.
 * @param {string} collection
 * @returns {readonly string[]}
 */
export function translatedFields(collection) {
  switch (collection) {
    case 'home':
      return [
        'title',
        'description',
        'eyebrow',
        'nowLabel',
        'workTitle',
        'resumeLabel',
        'invitation',
        'gardenLabel',
        'currentLabel',
      ];
    case 'resume':
      return [
        'title',
        'description',
        'eyebrow',
        'summary',
        'location',
        'qualification',
        'experienceTitle',
        'educationTitle',
        'skillsTitle',
        'linkedinLabel',
        'currentLabel',
        'presentLabel',
      ];
    default:
      return ['title', 'description', 'eyebrow'];
  }
}
