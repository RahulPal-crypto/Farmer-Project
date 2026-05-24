# Deployment Checklist

Deploy the backend first, then deploy the frontend.

## Backend environment variables

Set these in your backend hosting provider:

```env
NODE_ENV=production
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=use-a-long-random-secret
CLIENT_URL=https://your-frontend-domain.com
API_PUBLIC_URL=https://your-backend-domain.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

`PORT` is usually provided automatically by the host. Only set it if your host requires it.

Use Cloudinary in production. Local `/uploads` storage can disappear after redeploys or restarts on many hosting providers.

## Frontend environment variables

Set this in your frontend hosting provider:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

Vite reads this at build time, so redeploy the frontend after changing it.

## Deploy order

1. Push the latest code.
2. Redeploy the backend.
3. Open `https://your-backend-domain.com/` and confirm the API message appears.
4. Set `VITE_API_URL` on the frontend host.
5. Redeploy the frontend.
6. Create a new product with an image and confirm the image opens in the browser.

Images uploaded before Cloudinary was configured may need to be uploaded again.
