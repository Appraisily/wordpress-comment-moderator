# WordPress Comment Moderator Service

An automated service that moderates WordPress comments using AI, classifies spam, and generates personalized responses using OpenAI GPT and a custom Michelle AI agent.

## Service URL

The service is deployed and accessible at:
```
https://wordpress-comment-moderator-856401495068.us-central1.run.app
```

## Project Structure

```
/home/project/
├── src/
│   ├── app.js           # Express app setup
│   ├── index.js         # Application entry point
│   ├── config/
│   │   └── index.js     # Configuration management
│   ├── middleware/
│   │   └── auth.js      # Authentication middleware
│   ├── routes/
│   │   ├── index.js     # Route definitions
│   │   └── handlers.js  # Route handlers
│   └── services/
│       ├── ai.js        # AI service integration
│       ├── moderator.js # Comment moderation logic
│       ├── scheduler.js # Periodic processing
│       └── wordpress.js # WordPress API integration
├── Dockerfile
├── package.json
└── README.md
```

## Features

- 🤖 **AI-Powered Comment Classification**
  - Automatic spam detection
  - Smart content analysis
  - Real-time processing

- 💬 **Intelligent Response Generation**
  - Personalized responses via Michelle AI
  - Context-aware interactions
  - Professional tone maintenance

- 🔄 **Batch Processing**
  - Efficient handling of comment queues
  - Configurable batch sizes
  - Automatic retry mechanisms

- 📊 **Monitoring & Statistics**
  - Real-time processing stats
  - Comment queue monitoring
  - Performance metrics

## Prerequisites

- Node.js v18 or higher
- Google Cloud Platform account
- WordPress site with REST API enabled
- OpenAI API access
- Michelle AI service access

## Environment Setup

The service uses Google Cloud Secret Manager for secure configuration. Required secrets:

```
wp_username           # WordPress username
wp_app_password      # WordPress application password
WORDPRESS_API_URL    # WordPress API base URL
OPENAI_API_KEY       # OpenAI API key
SHARED_SECRET        # Webhook authentication secret
MICHELLE_USERNAME    # Michelle bot username
MICHELLE_APP_PASSWORD # Michelle bot password
DIRECT_API_KEY       # Michelle API access key
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd wordpress-comment-moderator
```

2. Install dependencies:
```bash
npm install
```

3. Start the service:
```bash
npm start
```

## API Endpoints

### POST /webhook
Receives new comment notifications from WordPress.

**Headers:**
- `x-shared-secret`: Authentication token

**Response:**
- `200 OK`: Comment processed successfully
- `403 Forbidden`: Invalid authentication
- `500 Error`: Processing failed

### POST /process-batch
Triggers batch processing of pending comments.

**Response:**
```json
{
  "message": "Processing batch of X comments",
  "count": X,
  "batchSize": Y
}
```

### GET /stats
Retrieves system statistics.

**Response:**
```json
{
  "total": "total comments count",
  "totalPages": "total pages count",
  "currentBatch": "current batch size"
}
```

## Architecture

### Comment Processing Flow

1. **Comment Reception**
   - Webhook notifications for new comments
   - Batch processing for pending comments

2. **Classification**
   - OpenAI-powered content analysis
   - Spam detection
   - Content legitimacy verification

3. **Response Generation**
   - Michelle AI context processing
   - Personalized response creation
   - WordPress API integration

4. **Comment Management**
   - Automatic approval/rejection
   - Response posting
   - Status tracking

### Configuration

```javascript
BATCH_SIZE = 50                 // Comments per batch
DELAY_BETWEEN_COMMENTS = 1000   // 1 second delay
DELAY_BETWEEN_BATCHES = 5000    // 5 seconds between batches
```

## Security

- **Authentication**
  - WordPress API basic auth
  - Webhook shared secret verification
  - Michelle API key authentication

- **Data Protection**
  - Secure secret management via Google Cloud
  - Rate limiting
  - Request validation

## Error Handling

- Automatic retry mechanisms
- Failed comment tracking
- Error logging and monitoring
- Rate limit management

## Deployment

### Google Cloud Run

1. Build the Docker image:
```bash
docker build -t gcr.io/[PROJECT_ID]/wordpress-comment-moderator .
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy wordpress-comment-moderator \
  --image gcr.io/[PROJECT_ID]/wordpress-comment-moderator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Monitoring

The service provides detailed logging for:
- Service initialization
- Comment processing
- AI classifications
- Response generation
- Error occurrences

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify WordPress credentials
   - Check secret configuration
   - Validate webhook secret

2. **Processing Delays**
   - Monitor batch size settings
   - Check API rate limits
   - Verify network connectivity

3. **Response Generation Issues**
   - Validate OpenAI API access
   - Check Michelle API connectivity
   - Review response templates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Open an issue in the repository
- Contact the development team
- Check the documentation

## Acknowledgments

- OpenAI for GPT integration
- WordPress REST API
- Michelle AI team
- Google Cloud Platform