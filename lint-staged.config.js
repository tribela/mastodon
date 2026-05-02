const config = {
  '*': 'oxfmt --no-error-on-unmatched-pattern',
  'Gemfile|*.{rb,ruby,ru,rake}': 'bin/rubocop --force-exclusion -a',
  '*.{js,jsx,ts,tsx}': 'eslint --fix',
  '*.{css,scss}': 'stylelint --fix',
  '*.haml': 'bin/haml-lint -a',
};

module.exports = config;
