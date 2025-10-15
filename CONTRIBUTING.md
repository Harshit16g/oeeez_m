# Contributing to Artistly

Thank you for your interest in contributing to Artistly! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and be patient
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm
- Git
- A Supabase account (for database access)

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click the Fork button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Artistlydotcom.git
   cd Artistlydotcom
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Harshit16g/Artistlydotcom.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Creating a New Feature

1. **Sync your fork with upstream**
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic

4. **Test your changes**
   ```bash
   npm run lint
   npm run build
   # Test manually in the browser
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to GitHub and create a PR from your branch
   - Fill out the PR template
   - Link any related issues

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add user profile page
fix: resolve authentication redirect issue
docs: update installation instructions
style: format code with prettier
refactor: simplify notification logic
test: add tests for booking form
chore: update dependencies
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new files
- Define interfaces for data structures
- Avoid using `any` type
- Use meaningful variable names

```typescript
// Good
interface UserProfile {
  id: string
  name: string
  email: string
}

function getUserProfile(userId: string): Promise<UserProfile> {
  // ...
}

// Avoid
function getData(id: any): Promise<any> {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop typing

```typescript
// Good
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```

### File Naming

- Components: PascalCase (`UserProfile.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Hooks: camelCase with 'use' prefix (`useAuth.ts`)
- Pages: kebab-case (`user-profile.tsx`)

### Styling

- Use Tailwind CSS utility classes
- Avoid inline styles
- Use consistent spacing and naming
- Follow mobile-first responsive design

```tsx
// Good
<div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Title</h2>
  <p className="text-gray-600 dark:text-gray-300">Description</p>
</div>

// Avoid
<div style={{ display: 'flex', padding: '24px' }}>
  <h2 style={{ fontSize: '24px' }}>Title</h2>
</div>
```

## Testing

### Manual Testing

Before submitting a PR, test your changes:

1. Test in different browsers (Chrome, Firefox, Safari)
2. Test on different screen sizes (mobile, tablet, desktop)
3. Test light and dark mode
4. Test with different user roles
5. Test edge cases and error scenarios

### Future: Automated Testing

We plan to add:
- Unit tests with Jest
- Integration tests with React Testing Library
- E2E tests with Playwright
- Visual regression tests

## Documentation

- Update README.md if adding new features
- Add JSDoc comments for complex functions
- Update ARCHITECTURE.md for architectural changes
- Create examples for new components

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tested manually in browser
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Screenshots (if applicable)
Add screenshots for UI changes

## Testing
How has this been tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## Areas for Contribution

### High Priority

- [ ] Add missing pages (bookings, notifications, etc.)
- [ ] Implement payment integration
- [ ] Add real-time chat system
- [ ] Improve mobile responsiveness
- [ ] Add unit and integration tests

### Medium Priority

- [ ] Add more artist categories
- [ ] Improve search and filtering
- [ ] Add user reviews and ratings
- [ ] Implement email notifications
- [ ] Add admin dashboard

### Good First Issues

Look for issues labeled `good first issue` on GitHub. These are:
- Well-defined problems
- Limited scope
- Good for learning the codebase
- Mentorship available

## Questions?

- Open an issue for bugs or feature requests
- Join our community discussions
- Reach out to maintainers

## Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Eligible for contributor badges
- Part of the Artistly community

Thank you for contributing to Artistly! 🎉
