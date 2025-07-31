# Troubleshooting Guide

## Authentication Issues

### 1. Signup Fails

**Common Causes:**
- Missing environment variables
- Database connection issues
- Password requirements too strict
- Rate limiting

**Solutions:**

1. **Check Environment Variables:**
   ```bash
   npm run setup
   ```
   This will check if all required environment variables are set.

2. **Create .env file:**
   ```env
   MONGO_URL=mongodb://localhost:27017/job_portal
   JWT_SECRET=your_secret_key_here
   ```

3. **Check MongoDB:**
   - Make sure MongoDB is running
   - Check if you can connect to the database

4. **Password Requirements:**
   - Minimum 6 characters (reduced from 8 for development)
   - Stricter requirements are commented out in User.js

### 2. Login Fails After Multiple Attempts

**Common Causes:**
- Rate limiting (was set to 5 requests per 15 minutes)
- Email verification required
- Database connection issues

**Solutions:**

1. **Rate Limiting Fixed:**
   - Increased from 5 to 20 requests per 15 minutes
   - Check `config/security.js` for current settings

2. **Email Verification:**
   - If email is not configured, users can login without verification
   - If email is configured, verification is required

3. **Check Server Logs:**
   ```bash
   npm run server
   ```
   Look for error messages in the console.

### 3. Email Verification Issues

**If email is not configured:**
- Users can login without verification
- Verification codes are logged to console
- Check server logs for verification codes

**If email is configured:**
- Make sure EMAIL_USER and EMAIL_PASS are set
- For Gmail, use App Password, not regular password
- Check if emails are being sent

### 4. Database Issues

**Check MongoDB:**
```bash
# Start MongoDB (if not running)
mongod

# Or if using MongoDB service
sudo systemctl start mongod
```

**Test Connection:**
```bash
npm run setup
```

### 5. Development vs Production

**Development Mode:**
- Relaxed password requirements
- Email verification optional
- More lenient rate limiting
- Console logging for verification codes

**Production Mode:**
- Stricter password requirements
- Email verification required
- Stricter rate limiting
- Proper email configuration required

## Quick Fixes

1. **Reset Rate Limiting:**
   - Restart the server
   - Wait 15 minutes for rate limit to reset

2. **Clear Browser Data:**
   - Clear localStorage
   - Clear cookies
   - Try in incognito mode

3. **Check Network:**
   - Ensure server is running on correct port
   - Check if API endpoints are accessible

## Environment Variables Reference

**Required:**
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens

**Optional (for email verification):**
- `EMAIL_USER`: Gmail address
- `EMAIL_PASS`: Gmail app password
- `EMAIL_FROM`: From email address

**Optional (for SMS verification):**
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

## Testing the Fixes

1. **Run setup script:**
   ```bash
   npm run setup
   ```

2. **Start server:**
   ```bash
   npm run server
   ```

3. **Test signup:**
   - Go to signup page
   - Create account with simple password (6+ chars)
   - Check console for verification code if email not configured

4. **Test login:**
   - Try logging in immediately after signup
   - Should work even without email verification if email not configured

## Still Having Issues?

1. Check server console for error messages
2. Verify MongoDB is running
3. Ensure all environment variables are set
4. Try creating a new account with different email
5. Check browser console for network errors 