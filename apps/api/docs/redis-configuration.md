# Redis Configuration for Ghost Wallet Backend

Redis is used for caching and rate limiting in the Ghost Wallet Backend API. This document covers the configuration, usage, and monitoring of Redis.

## Configuration

### Environment Variables

```env
# Redis connection URL
REDIS_URL=redis://localhost:6379

# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=60000        # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100       # 100 requests per minute
RATE_LIMIT_MAX_AUTH_ATTEMPTS=10   # 10 auth attempts per minute

# Cache TTL configuration (in milliseconds)
CACHE_TTL_ROUTES_MS=300000        # 5 minutes for LI.FI routes
CACHE_TTL_USERNAME_MS=60000       # 1 minute for username availability
CACHE_TTL_PROFILE_MS=600000       # 10 minutes for user profiles
```

### Connection String Formats

- **Local**: `redis://localhost:6379`
- **Redis Cloud**: `redis://username:password@host:port`
- **Redis with SSL**: `rediss://host:port`
- **Socket**: `redis+socket:///path/to/redis.sock`

## Caching Strategy

### What Gets Cached

1. **LI.FI Route Responses** (5 minutes)
   - Key: `route:{route_hash}`
   - TTL: 5 minutes
   - Purpose: Reduce LI.FI API calls and improve response time

2. **Username Availability Checks** (1 minute)
   - Key: `username:availability:{username}`
   - TTL: 1 minute
   - Purpose: Reduce database queries for username checks

3. **User Profile Data** (10 minutes)
   - Key: `profile:{wallet_address}`
   - TTL: 10 minutes
   - Purpose: Reduce database queries for user data

### Cache Invalidation

- User profile cache is invalidated when user data changes
- Username cache is invalidated after TTL expires
- Route cache is invalidated after TTL expires
- Manual cache clearing via `/health/cache` endpoint

## Rate Limiting

### Limits

1. **General Requests**: 100 requests per minute per IP/user
2. **Authentication Attempts**: 10 attempts per minute per identifier
3. **IP Blocking**: Temporary blocking after 5 violations in 1 hour

### Headers

Rate limit responses include these headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (when limited)

### Implementation

Rate limiting uses Redis sorted sets with sliding window algorithm:
- Each request adds a timestamp to a sorted set
- Old timestamps are removed based on window size
- Request count is the size of the sorted set

## Development Setup

### Using Docker Compose

```bash
# Start Redis with Redis Commander (web UI)
cd apps/api
docker-compose -f docker-compose.redis.yml up -d

# View logs
docker-compose -f docker-compose.redis.yml logs -f

# Stop Redis
docker-compose -f docker-compose.redis.yml down
```

### Manual Installation

```bash
# Install Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Check status
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

## Monitoring

### Health Endpoints

1. **`GET /health`** - Overall health with Redis status
2. **`GET /health/cache`** - Detailed cache statistics

### Redis Commander

Access Redis Commander at `http://localhost:8081` (when using Docker Compose):
- Username: `admin`
- Password: `admin`

### Command Line

```bash
# Connect to Redis
redis-cli

# Monitor commands in real-time
redis-cli monitor

# Get memory info
redis-cli info memory

# Get database size
redis-cli dbsize

# Clear all cache (development only)
redis-cli flushall
```

## Production Considerations

### Memory Management

```redis
# Configure in redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Persistence

```redis
# Enable AOF persistence
appendonly yes
appendfsync everysec
```

### Security

```redis
# Set password
requirepass your-strong-password

# Rename dangerous commands
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG ""
```

### High Availability

For production, consider:
- Redis Sentinel for failover
- Redis Cluster for sharding
- Managed Redis service (AWS ElastiCache, Google Memorystore, etc.)

## Error Handling

The Redis implementation includes graceful degradation:
- If Redis is unavailable, cache operations return `null`
- If Redis is unavailable, rate limiting allows all requests
- Errors are logged but don't crash the application
- Fallback to direct database/API calls when cache fails

## Testing

### Unit Tests

```bash
# Run Redis-related tests
pnpm run test --testPathPattern=redis

# Test with Redis mock
# See __tests__/redis.test.ts for examples
```

### Integration Tests

```bash
# Start test Redis instance
docker run -d -p 6380:6379 --name test-redis redis:7-alpine

# Run integration tests
REDIS_URL=redis://localhost:6380 pnpm run test
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if Redis is running: `redis-cli ping`
   - Check firewall settings
   - Verify connection string

2. **Memory usage high**
   - Check cache TTL settings
   - Monitor cache hit rate
   - Consider increasing `maxmemory`

3. **Rate limiting not working**
   - Check Redis connection
   - Verify rate limit configuration
   - Check request headers

4. **Cache not updating**
   - Check cache invalidation logic
   - Verify TTL settings
   - Check for cache key collisions

### Logs

Redis logs are available via:
```bash
# Docker
docker logs ghost-redis

# Systemd
sudo journalctl -u redis-server

# Redis CLI
redis-cli slowlog get
redis-cli info stats
```

## Performance Tuning

### Optimal Settings

```redis
# Increase max clients
maxclients 10000

# Enable TCP keepalive
tcp-keepalive 60

# Optimize memory
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
```

### Monitoring Metrics

Key metrics to monitor:
- Cache hit rate
- Memory usage
- Connection count
- Command latency
- Evicted keys count

## Backup and Recovery

### Manual Backup

```bash
# Create backup
redis-cli save
# or
redis-cli bgsave

# Copy RDB file
cp /var/lib/redis/dump.rdb /backup/
```

### Automated Backup

Use Redis `BGSAVE` with cron:
```bash
# Daily backup
0 2 * * * redis-cli bgsave
```

### Recovery

```bash
# Stop Redis
sudo systemctl stop redis-server

# Restore RDB file
cp /backup/dump.rdb /var/lib/redis/

# Start Redis
sudo systemctl start redis-server
```

## Security Best Practices

1. **Use strong passwords**
2. **Enable TLS for remote connections**
3. **Restrict network access**
4. **Regularly update Redis**
5. **Monitor for suspicious activity**
6. **Use separate Redis instances for different purposes**
7. **Implement connection pooling**
8. **Set appropriate memory limits**