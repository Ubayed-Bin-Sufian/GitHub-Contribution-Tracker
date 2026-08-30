function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAuthEnv() {
  return {
    secret: required("AUTH_SECRET"),
    githubId: required("AUTH_GITHUB_ID"),
    githubSecret: required("AUTH_GITHUB_SECRET"),
  };
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
}
