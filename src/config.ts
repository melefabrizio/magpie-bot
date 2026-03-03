export const config = {
  // Discord
  discordToken: process.env.DISCORD_TOKEN!,
  channelIds: process.env.CHANNEL_IDS!.split(","),

  // Karakeep
  karakeepApiUrl: process.env.KARAKEEP_API_URL!,
  karakeepApiKey: process.env.KARAKEEP_API_KEY!,

  // AWS Bedrock (picked up automatically from env / instance profile)
  awsRegion: process.env.AWS_REGION ?? "eu-west-1",

  // Pipeline
  blockedDomains: [
    "drive.google.com",
    "clickup.com",
    "monade.io",
    "monadeapps.xyz",
  ],

  // Metadata fetch timeout
  fetchTimeoutMs: 5000,

  // Reaction emoji on successful bookmark
  successEmoji: "🐦",
  errorEmoji: "❌",
};
