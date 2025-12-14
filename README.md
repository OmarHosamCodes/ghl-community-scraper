# GHL Community Scraper

A comprehensive scraper for GoHighLevel (GHL) community data. Fetches posts, comments (with recursive reply extraction), users, gamification data, and community information.

## Features

- **Posts**: Fetch all posts with pagination
- **Comments**: Recursive comment extraction including nested replies (configurable depth)
- **Users/Members**: Fetch all community members with profiles
- **Gamification**: Leaderboards, badges, levels, and point actions
- **Community Info**: Community details, groups, and channels

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file with the following variables:

```env
COMMUNITY_ID=your_community_id
GROUP_ID=your_group_id
TOKEN_ID=your_token_id
FETCH_LIMIT=20
FETCH_DELAY_MS=500
```

## Usage

### Full Scrape

Run the main scraper to fetch all data:

```bash
bun run src/index.ts
```

### Configurable Options

Edit `src/index.ts` to customize what data to fetch:

```typescript
const options: ScraperOptions = {
  fetchPosts: true,        // Fetch all posts
  fetchComments: true,     // Fetch comments for each post
  fetchUsers: true,        // Fetch all community members
  fetchGamification: true, // Fetch leaderboard, badges, levels
  fetchCommunityInfo: true,// Fetch community, groups, channels
  maxCommentDepth: 10,     // Maximum depth for nested replies
};
```

### Using Individual Services

You can also use individual services directly:

```typescript
import { 
  PostsService, 
  CommentsService, 
  UsersService, 
  GamificationService, 
  CommunityService 
} from "./services";

// Fetch just posts
const postsService = new PostsService();
const posts = await postsService.fetchAll();

// Fetch comments with nested replies
const commentsService = new CommentsService();
const comments = await commentsService.fetchAllWithReplies(postId, { maxDepth: 5 });

// Fetch users
const usersService = new UsersService();
const users = await usersService.fetchAll();

// Fetch gamification data
const gamificationService = new GamificationService();
const gamification = await gamificationService.fetchAll();

// Fetch community info
const communityService = new CommunityService();
const communityData = await communityService.fetchAll();
```

## Output

Data is exported to the `output/` directory:

- `full-data.json` - Complete dataset
- `posts.json` - All posts with their comments
- `users.json` - All community members
- `gamification.json` - Leaderboard, badges, levels, point actions
- `community.json` - Community info, groups, channels

## Project Structure

```
src/
├── index.ts              # Main entry point
├── api/
│   ├── client.ts         # Axios client and endpoints
│   ├── headers.ts        # Request headers
│   └── index.ts
├── config/
│   └── env.ts            # Environment configuration
├── services/
│   ├── posts.ts          # Posts fetching service
│   ├── comments.ts       # Comments with recursive replies
│   ├── users.ts          # Users/members service
│   ├── gamification.ts   # Leaderboard, badges, levels
│   ├── community.ts      # Community, groups, channels
│   ├── scraper.ts        # Main orchestrator service
│   └── index.ts
├── types/
│   ├── post.ts           # Post types
│   ├── comment.ts        # Comment types
│   ├── user.ts           # User types
│   ├── gamification.ts   # Gamification types
│   ├── community.ts      # Community types
│   ├── export.ts         # Export types
│   └── index.ts
└── utils/
    ├── file.ts           # File export utilities
    └── index.ts
```

## License

MIT
