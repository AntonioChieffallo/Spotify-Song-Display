# Spotify-Thingy - GitHub Copilot Instructions

**ALWAYS follow these instructions first and refer to additional context when needed.**

## Project Overview

Spotify-Thingy is a project designed to interact with or enhance the Spotify experience. This is an early-stage project that will be expanded with specific features and functionality.

### Core Purpose
- Integration with Spotify's ecosystem
- Enhancing music discovery and playback experiences
- Building tools for Spotify users

## Project Status

This project is currently in its early stages. As the project evolves, these instructions will be updated to reflect:
- Technology stack and architecture decisions
- Development setup procedures
- Testing strategies
- Deployment guidelines
- Security best practices

## Development Principles

### Code Quality
- Write clean, readable, and maintainable code
- Follow language-specific best practices and conventions
- Use meaningful variable and function names
- Add comments only when necessary to explain complex logic
- Keep functions small and focused on a single responsibility

### Version Control
- Write clear, descriptive commit messages
- Use feature branches for new development
- Keep commits atomic and focused
- Reference issue numbers in commit messages when applicable

### Security Considerations
- Never commit API keys, tokens, or sensitive credentials
- Use environment variables for configuration
- Follow OAuth best practices when integrating with Spotify API
- Validate and sanitize all user inputs
- Keep dependencies up to date

## Spotify API Integration

When working with the Spotify API:

### Authentication
- Use OAuth 2.0 for user authentication
- Store tokens securely using environment variables
- Implement proper token refresh mechanisms
- Follow Spotify's API Terms of Service

### API Best Practices
- Respect rate limits (429 responses)
- Implement exponential backoff for retries
- Cache responses when appropriate
- Use pagination for large datasets
- Handle errors gracefully

### Common Spotify API Patterns
```
# Authentication flow
1. Redirect user to Spotify authorization page
2. Handle callback with authorization code
3. Exchange code for access and refresh tokens
4. Store tokens securely
5. Use access token for API requests
6. Refresh token when expired

# Common endpoints to consider
- User Profile: /v1/me
- Playlists: /v1/me/playlists
- Tracks: /v1/tracks
- Search: /v1/search
- Player: /v1/me/player
```

## Testing Strategy

As the project grows, implement:
- Unit tests for business logic
- Integration tests for API interactions
- End-to-end tests for critical user flows
- Mock Spotify API responses for reliable testing

## Documentation

### Keep Updated
- README.md with setup instructions
- API documentation for any endpoints created
- Configuration file examples
- Troubleshooting guides

### Code Documentation
- Document complex algorithms
- Explain non-obvious design decisions
- Keep inline comments up to date with code changes

## Common Development Tasks

### Setting Up Development Environment
```bash
# Clone the repository
git clone https://github.com/AntonioChieffallo/Spotify-Thingy.git
cd Spotify-Thingy

# Install dependencies (when applicable)
# Command will depend on chosen technology stack

# Configure environment variables
# Create .env file based on .env.example

# Run the application
# Command will depend on chosen technology stack
```

### Working with Features
```bash
# Create a new feature branch
git checkout -b feature/feature-name

# Make changes and test locally

# Commit changes
git add .
git commit -m "feat: add feature description"

# Push to remote
git push origin feature/feature-name

# Create pull request for review
```

## Project Structure

As the project evolves, maintain a clear structure:
```
Spotify-Thingy/
├── .github/              # GitHub configuration
│   └── copilot-instructions.md
├── src/                  # Source code (structure TBD)
├── tests/                # Test files
├── docs/                 # Documentation
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore patterns
└── README.md            # Project readme
```

## Future Considerations

As the project develops, consider:
- **Performance**: Optimize API calls and data processing
- **Scalability**: Design for growth in users and data
- **User Experience**: Focus on intuitive interfaces
- **Accessibility**: Ensure features are accessible to all users
- **Privacy**: Respect user data and privacy preferences
- **Monitoring**: Implement logging and error tracking
- **Analytics**: Track usage patterns and feature adoption

## Resource Links

### Spotify Developer Resources
- [Spotify for Developers](https://developer.spotify.com/)
- [Web API Reference](https://developer.spotify.com/documentation/web-api/)
- [Web API Console](https://developer.spotify.com/console/)
- [API Terms of Service](https://developer.spotify.com/terms)

### Best Practices
- Follow the [GitHub flow](https://guides.github.com/introduction/flow/) for collaboration
- Implement [semantic versioning](https://semver.org/) when ready for releases
- Use [conventional commits](https://www.conventionalcommits.org/) for clear history

## Getting Help

- Check Spotify's [API documentation](https://developer.spotify.com/documentation/)
- Review [Spotify Community](https://community.spotify.com/t5/Spotify-for-Developers/bd-p/Spotify_Developer)
- Search existing issues in the repository
- Create new issues for bugs or feature requests

## Notes for Copilot

When generating code suggestions:
- Prioritize security and privacy
- Follow established patterns in the codebase
- Include error handling
- Add appropriate type hints/types where applicable
- Consider edge cases and validation
- Suggest tests alongside new features
- Keep the Spotify API rate limits in mind
- Use async/await patterns for API calls where appropriate

---

**Remember**: This project is evolving. As new patterns, tools, and practices are established, update these instructions to reflect the current state and standards of the project.
