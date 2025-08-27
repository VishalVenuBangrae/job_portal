# Yacht Daywork Job Portal

A comprehensive job portal specifically designed for yacht industry positions including daywork/freelance and delivery roles.

## Features

### For Employers
- ✅ Post jobs with specific yacht industry categories
- ✅ **NEW: Advanced location selection with countries, cities, and ports worldwide**
- ✅ Manage job postings with date/time tracking
- ✅ View all applications for each job
- ✅ Update application status (pending, reviewed, accepted, rejected)
- ✅ Close/reopen job postings
- ✅ Comprehensive dashboard with tabbed interface

### For Job Seekers
- ✅ Browse available jobs with filtering by category and position
- ✅ **NEW: Advanced location filtering by country, city, and port**
- ✅ **NEW: Global search across job titles, companies, and locations**
- ✅ Apply to jobs with resume upload and cover letter
- ✅ Track application status
- ✅ View applied jobs with detailed information
- ✅ Jobs sorted by newest first

### Job Categories & Positions
- **Daywork/Freelance**: Captain, Engineer, Bosun, Mate, Deckhand, Chef/crew cook, Chief Stewardess, 2nd Stewardess
- **Deliveries**: Captain, Mate, Stewardess, Chef

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT tokens
- **File Upload**: Multer (resume uploads)
- **Email**: Nodemailer (verification & password reset)

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017/job_portal

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=8080
DEV_MODE=development

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### 3. Setup Locations (Optional but Recommended)
```bash
npm run setup:locations
```
This will populate the database with popular yacht locations worldwide.

### 3.1. Sync Yacht Ports from API (Recommended)
```bash
# Sync all yacht ports from OpenSeaMap API
npm run sync:ports

# Sync yacht ports for specific country
npm run sync:ports France

# Sync with custom limit
npm run sync:ports France 50
```
This will fetch real-time yacht port data from OpenSeaMap API and sync it to your database.

### 4. Start the Server
```bash
npm start
```

The application will be available at `http://localhost:8080`

## Deployment Options

### Railway (Recommended - 5 minutes)
1. Push your code to GitHub
2. Connect your GitHub repo to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically

### Render
1. Connect your GitHub repo to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy

### Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `heroku config:set MONGO_URL=your_mongodb_url`
4. `git push heroku main`

### Vercel
1. Connect your GitHub repo to Vercel
2. Configure environment variables
3. Deploy

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-email` - Email verification
- `POST /api/v1/auth/forgot-password` - Password reset

### Jobs
- `GET /api/v1/jobs` - Get all jobs (with location filtering)
- `POST /api/v1/jobs` - Create job (employer only)
- `GET /api/v1/jobs/posted` - Get posted jobs (employer only)
- `GET /api/v1/jobs/applied` - Get applied jobs (jobseeker only)
- `POST /api/v1/jobs/:id/apply` - Apply to job (jobseeker only)
- `GET /api/v1/jobs/:id/applications` - Get job applications (employer only)
- `PUT /api/v1/jobs/applications/:id/status` - Update application status (employer only)

### Locations
- `GET /api/v1/locations/countries` - Get all countries
- `GET /api/v1/locations/cities/:country` - Get cities by country
- `GET /api/v1/locations/ports/:country/:city` - Get ports by city
- `GET /api/v1/locations/all-ports` - Get all ports (with optional country/city filtering)
- `GET /api/v1/locations/api-ports` - Get yacht ports from OpenSeaMap API
- `GET /api/v1/locations/search` - Search locations
- `GET /api/v1/locations/popular` - Get popular yacht locations
- `POST /api/v1/locations/sync-api` - Sync yacht ports from API to database (admin only)

## Database Schema

### User Model
- Basic info (name, email, password, phone)
- User type (jobseeker/employer)
- Profile information
- Applied jobs tracking
- Posted jobs tracking (employers)

### Job Model
- Job details (title, company, description)
- **NEW: Structured location data (country, city, port, coordinates)**
- Category (Daywork/Freelance, Deliveries)
- Position (Captain, Engineer, etc.)
- Applications array with status tracking
- Timestamps for posting date

### Location Model
- Country, city, and port information
- Geographic coordinates (latitude/longitude)
- Region categorization (Mediterranean, Caribbean, etc.)
- Active/inactive status

## File Structure

```
job_portal/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── jobController.js    # Job management logic
│   └── locationController.js # Location management logic
├── middleware/
│   ├── authMiddleware.js   # JWT authentication
│   └── roleMiddleware.js   # Role-based access control
├── models/
│   ├── User.js            # User schema
│   ├── Job.js             # Job schema
│   └── Location.js        # Location schema
├── routes/
│   ├── authRoutes.js      # Authentication routes
│   ├── jobRoutes.js       # Job routes
│   └── locationRoutes.js  # Location routes
├── public/                # Frontend files
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Registration page
│   ├── employer.html      # Employer dashboard
│   ├── jobseeker.html     # Jobseeker dashboard
│   └── *.js              # Frontend JavaScript
├── uploads/              # Resume uploads
├── setup-locations.js    # Location setup script
├── server.js             # Main server file
└── package.json          # Dependencies
```

## Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ File upload validation
- ✅ Input sanitization
- ✅ CORS protection

## Performance Features

- ✅ Jobs sorted by newest first
- ✅ Efficient database queries with population
- ✅ File upload size limits
- ✅ Responsive design
- ✅ **NEW: Server-side location filtering for better performance**
- ✅ **NEW: Cached location data for faster UI responses**

## Location Features

### Global Coverage
- **80+ locations** across 8 major regions
- **Mediterranean**: Monaco, France, Italy, Spain, Greece, Croatia, Turkey, Malta
- **Caribbean**: Bahamas, BVI, Antigua, St. Martin, St. Barts, and more
- **Indian Ocean**: Seychelles, Maldives, Mauritius, Madagascar
- **Asia Pacific**: Thailand, Singapore, Malaysia, Indonesia, Philippines, Vietnam
- **Australia & New Zealand**: Sydney, Gold Coast, Auckland, Wellington
- **North America**: Miami, Fort Lauderdale, Newport, San Diego, Vancouver
- **Europe**: London, Amsterdam, Hamburg, Oslo, Stockholm, Copenhagen
- **Middle East**: Dubai, Abu Dhabi, Doha, Muscat
- **South America**: Rio de Janeiro, São Paulo, Buenos Aires, Valparaíso

### Advanced Filtering
- Filter by country, city, and specific port
- Cascading dropdowns for intuitive navigation
- Search across all location fields
- Popular locations quick access

## API Integration Features

### Multi-Source API Integration
- **Multiple maritime data sources** (World Ports, OpenSeaMap Overpass)
- **Automatic fallback** to local database if APIs fail
- **Comprehensive marina information** with coordinates
- **Robust error handling** ensures system always works

### Sync Capabilities
- **One-time sync**: `npm run sync:ports`
- **Country-specific sync**: `npm run sync:ports France`
- **Custom limits**: `npm run sync:ports France 50`
- **Automatic deduplication** and updates

### API Endpoints
- **Live API data**: `GET /api/v1/locations/api-ports`
- **Database sync**: `POST /api/v1/locations/sync-api`
- **Hybrid approach**: Combines API and local data

## Support

For deployment assistance or feature requests, please contact the development team.

---

**Status**: ✅ Production Ready - 95% Complete
**Last Updated**: Current
**Version**: 1.0.0 