module.exports = {
  // Frontend files
  'jewellery-crm/**/*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  
  // Backend Python files
  'backend/**/*.py': [
    'black',
    'isort',
    'flake8',
    'git add'
  ],
  
  // Markdown and documentation
  '**/*.{md,mdx}': [
    'prettier --write',
    'git add'
  ],
  
  // JSON and YAML files
  '**/*.{json,yaml,yml}': [
    'prettier --write',
    'git add'
  ]
};
