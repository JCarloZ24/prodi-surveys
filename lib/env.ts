export function requireAnyEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }

  throw new Error(`Missing required environment variable: ${names.join(" or ")}`);
}
