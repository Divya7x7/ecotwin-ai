# ♻ EcoTwin AI

EcoTwin AI is a website that tells you what to do with your waste.
Take a photo of an item and the AI tells you:

- what the item is and what it is made of
- which bin it goes in
- how to throw it away properly
- ways to reuse it

**Live website:** https://ecotwin-9h8ky3vc6-dexter-cbcf.vercel.app/

---

## How to use the website

1. Open the website link above.
2. Click **Scan Your Waste**.
3. Take a photo, or choose one from your phone or computer.
4. Click **Analyse Image**.
5. Wait a few seconds and read the result.

Tips: use good light, show one item at a time, and avoid blurry photos.

Note: recycling rules are different in every city, so always double-check
with your local waste service.

---

## Built with

- React + Vite (the website)
- Supabase Edge Functions (the backend)
- Groq AI (identifies the item from the photo)
- Vercel (hosting)

## How it works

1. You pick a photo and the website shrinks it.
2. The photo is sent to a Supabase function called `analyze-waste`.
3. The function asks the Groq AI what the item is.
4. The answer comes back and the website shows it.

Your AI key is kept safe in Supabase and is never in the website code.

---

## Run it on your own computer

You need Node.js installed.

```bash
git clone https://github.com/Divya7x7/ecotwin-ai.git
cd ecotwin-ai
npm install
```

Make a file called `.env.local` in the main folder (copy `.env.example`) and add:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Then start it:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Backend setup (Supabase)

1. Deploy the function in `supabase/functions/analyze-waste/index.ts`
   with the name `analyze-waste`.
2. Turn **JWT verification off** for this function.
3. In Supabase, go to **Edge Functions → Secrets** and add:
   `GROQ_API_KEY` = your key from console.groq.com

## Put it online (Vercel)

1. Go to vercel.com and import this repository.
2. Add the two `VITE_` variables from above.
3. Click **Deploy**.

---

## Limits

- The AI can make mistakes.
- Advice is general, not specific to your city.
- Scans are not saved.