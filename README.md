# KarkhanaX — Official Website

> **Build Local. Scale National.**
> The official website for **KarkhanaX**, an Integrated Fabrication & Manufacturing Support Centre based in Jhunjhunu, Rajasthan — a venture under Sudeep Industries.

Small manufacturers have the skills but not the complete infrastructure. KarkhanaX bridges that gap by offering job work, specialized machinery access, manufacturing support, and product-to-market linkage — all from one integrated facility. This repository contains the marketing/company website built to showcase that capability, take inbound orders, and support market linkage (as outlined in the "Digital Infrastructure" line item of our project ask).

---

## Tech Stack

| Technology | Purpose | Details |
| :--- | :--- | :--- |
| **[Next.js](https://nextjs.org/)** | Framework & App Router | Next.js 16 (App Router, Server & Client Components) |
| **[React](https://react.dev/)** | UI Library | React 19 |
| **[Tailwind CSS](https://tailwindcss.com/)** | Styling | Tailwind CSS v4 (zero-config, high-performance CSS engine) |
| **[TypeScript](https://www.typescriptlang.org/)** | Type System | TypeScript 5 |
| **[Geist](https://vercel.com/font)** | Typography | `next/font` variable font integration |
| **ESLint** | Code Quality | ESLint 9 flat configuration |
| **Deployment** | Hosting | Vercel (or preferred production host) |
| **Forms / Contact** | Lead Capture | API routes / Resend / Formspree *(to be integrated)* |

---

## Project Structure

```text
karkhanax/
├── app/                    # Next.js App Router
│   ├── favicon.ico         # Favicon
│   ├── globals.css         # Global styles & Tailwind v4 imports
│   ├── layout.tsx          # Root layout & Geist font configuration
│   └── page.tsx            # Home / Landing page
├── public/                 # Static assets (logos, icons, illustrations)
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies & scripts
├── postcss.config.mjs      # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

---

## Key Website Sections

Mapped from the KarkhanaX business model:

| Section | Purpose |
|---|---|
| **Hero** | "Build Local. Scale National." — tagline, value proposition, and primary CTAs |
| **The Problem** | Skilled manpower exists, but specialized infrastructure (laser cutting, hydraulic press, bending, welding, powder coating) is fragmented |
| **Our Solution** | Job Work → Manufacturing Support → Product Development & Market Linkage |
| **What Makes Us Different** | Traditional fragmented job work vs. the KarkhanaX integrated facility model |
| **Capabilities / Services** | CNC laser cutting, bending, welding, powder coating, assembly, quality inspection |
| **Case Studies** | Verified completed orders (e.g., education-sector math labs & DIY kits) |
| **Business Model** | Job work, contract manufacturing, proprietary products, institutional orders |
| **Traction & Infrastructure** | 5,000 sq.ft facility, operational powder coating plant, revenue metrics, machinery |
| **Contact / Enquiry** | High-intent lead capture for job work, contract fabrication, and bulk institutional orders |

---

## Brand Notes

- **Positioning Line:** *"From Job Work to Product Innovation. From Local Fabricators to National Markets."*
- **Tone:** Grounded, credible, industrial — avoids generic "startup" fluff; highlights a real, operating manufacturing facility with proven commercial traction.
- **Proof Points to Surface:**
  - **5,000 sq.ft.** integrated manufacturing facility in Jhunjhunu, Rajasthan
  - **₹17L+** commercial revenue generated
  - **Verified institutional orders** (education-sector DIY kits & math labs)
  - **Operational machinery** including in-house industrial powder coating plant

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: `v20.9.0` or higher
- **Package Manager**: `npm`, `pnpm`, `yarn`, or `bun`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ankitkumar25-rk/KarkhanaX.git
   cd KarkhanaX
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   # or
   bun install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *(Add `NEXT_PUBLIC_SITE_URL`, contact form endpoints, and analytics keys as needed)*

### Development Server

Start the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Builds the optimized production application |
| `npm run start` | Runs the compiled production build |
| `npm run lint` | Runs ESLint to verify code quality and style |

---

## Roadmap for the Site

- [ ] **Hero & Core Pages**: Home, About (promoter & Sudeep Industries story), Services, Contact
- [ ] **Traction & Case Studies**: Section showcasing verified orders, facility photos, and stats
- [ ] **Lead Capture & Enquiry Form**: Wired to email / CRM backend for fabrication requests
- [ ] **SEO & Open Graph**: Comprehensive metadata, OG images, and structured data
- [ ] **Analytics**: Lightweight privacy-friendly analytics integration
- [ ] **Mobile Responsiveness**: Thorough QA across mobile, tablet, and desktop viewports
- [ ] **Production Deployment**: Custom domain configuration on Vercel

---

## Deployment

The easiest way to deploy KarkhanaX is via the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

For alternative hosting solutions, see the [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## License

Internal project — all rights reserved by **Sudeep Industries / KarkhanaX**, unless otherwise specified.