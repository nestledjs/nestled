# Project Config Generator

The project config generator creates several important config files.

- .env.example
- .prettierrc
- Dockerfile
- docker-compose.yml

You will be asked if you want to create each one (although the two dockerfiles are wrapped into one question).  This way, if in the future you want to reset, you can generate just one of the files to regain the initial state.
```bash
nx g @nestled/generators:project-config
```
