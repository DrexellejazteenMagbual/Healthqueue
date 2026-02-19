# Profile Picture Setup Guide

## Overview
Profile picture functionality has been implemented with Supabase Storage integration. Follow these steps to set it up.

## 1. Run SQL Migration

Execute the SQL file in your Supabase SQL Editor:
- File: `ADD_PROFILE_PICTURE_TO_STAFF.sql`
- This adds the `profile_picture_url` column to the `staff_users` table

## 2. Create Storage Bucket in Supabase

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **"New Bucket"**
4. Configure the bucket:
   - **Name**: `profile-pictures`
   - **Public**: ✅ Enabled
   - **File size limit**: 5242880 bytes (5MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`

## 3. Set Storage Policies

Create policies for the `profile-pictures` bucket:

### Policy 1: Allow Upload (INSERT)
- **Name**: "Users can upload profile pictures"
- **Operation**: INSERT
- **Policy**: `true` (allow all for now)
- **Target roles**: authenticated

### Policy 2: Allow Public Read (SELECT)
- **Name**: "Public can view profile pictures"
- **Operation**: SELECT
- **Policy**: `true` (allow public access)
- **Target roles**: anon, authenticated

### Policy 3: Allow Update
- **Name**: "Users can update their profile pictures"
- **Operation**: UPDATE
- **Policy**: `true`
- **Target roles**: authenticated

### Policy 4: Allow Delete
- **Name**: "Users can delete their profile pictures"
- **Operation**: DELETE
- **Policy**: `true`
- **Target roles**: authenticated

## 4. How It Works

### User Flow:
1. User clicks on their profile icon in the top navigation
2. Profile modal opens with current info
3. User clicks the camera icon on their avatar
4. Selects an image file (JPEG, PNG, GIF, or WebP up to 5MB)
5. Image uploads to Supabase Storage
6. Database updates with the public URL
7. Profile picture displays immediately

### Technical Details:
- Images are stored in: `profile-pictures/{userId}.{ext}`
- Each user can have one profile picture (overwrites previous)
- Profile pictures are publicly accessible via URL
- URLs are stored in `staff_users.profile_picture_url`
- File validation: type and size checked before upload

### Components Modified:
- `UserProfileModal.tsx` - Upload functionality with loading state
- `Sidebar.tsx` - Display profile picture in user badge
- SQL Migration added for database schema

## 5. Testing

1. **Upload Test**:
   - Log in as a user
   - Click profile icon
   - Click camera button
   - Select an image
   - Verify success message
   - Check image appears immediately

2. **Persistence Test**:
   - Refresh page
   - Profile picture should still appear
   - Check Supabase Storage to verify file exists
   - Check database for correct URL

3. **Update Test**:
   - Upload a different image
   - Old image should be replaced
   - New image should display

## 6. Security Notes

**Current Implementation** (Development):
- All authenticated users can upload
- Public read access for viewing

**Production Recommendations**:
1. Add RLS policies to restrict uploads to own profile
2. Implement file scanning for malware
3. Add rate limiting for uploads
4. Consider CDN for better performance
5. Add image optimization/resizing on upload
6. Implement proper cleanup for deleted users

## 7. File Size & Format Limits

- **Max Size**: 5MB
- **Allowed Formats**: 
  - JPEG/JPG
  - PNG
  - GIF
  - WebP
- **Validation**: Client-side (mimetype and size check)

## 8. Troubleshooting

### Upload Fails:
- Check Supabase Storage bucket exists
- Verify bucket is public
- Check storage policies are set
- Verify file size < 5MB
- Check file format is allowed

### Image Doesn't Display:
- Check browser console for errors
- Verify URL in database is valid
- Check image is accessible via direct URL
- Verify public access is enabled

### Database Update Fails:
- Check `profile_picture_url` column exists
- Verify user ID is correct
- Check RLS policies on `staff_users` table

## Need Help?
Check the Supabase documentation:
- Storage: https://supabase.com/docs/guides/storage
- Policies: https://supabase.com/docs/guides/storage/security/access-control
