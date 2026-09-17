This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Firebase setup

The app uses Firebase Authentication and Cloud Firestore. All visitors share the same
vehicle collection at `vehicles/{vehicleId}`. Any anonymously authenticated visitor
can create, edit, or delete every record. A vehicle document contains:

```ts
{
  id: string
  vehicle: string
  plateNumber: string | null
  easytripAccount: string | null
  autosweepAccount: string | null
  imageUrl: string | null // compressed JPEG thumbnail data URL
}
```

### Console configuration

1. In Firebase Project Overview, select **Add app**, choose **Web**, and register the app.
2. Copy the values from the Firebase configuration object into a new `.env.local`
   using `.env.example` as the template.
3. Open **Security > Authentication > Sign-in method** and enable **Anonymous**.
4. Open **Databases & Storage > Firestore Database**, create the database, and choose
   a region close to your users.
5. In Firestore's **Rules** tab, paste the contents of `firestore.rules` and publish.
6. Restart the Next.js development server after creating `.env.local`.

The Firebase web configuration identifies the project but does not grant database
access. Access is enforced by `firestore.rules`. The current rules intentionally make
reads public and allow any anonymous app user to create, edit, and delete shared data.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
