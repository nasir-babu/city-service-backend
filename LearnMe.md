# City Services Backend: নিজে বুঝুন, আত্মবিশ্বাসের সঙ্গে ব্যাখ্যা করুন

এই নথিটি repository-র বর্তমান code দেখে লেখা। লক্ষ্য হলো শুধু endpoint-এর নাম মনে রাখা নয়—request কীভাবে route, middleware, controller, service এবং database পেরিয়ে যায়, সেটি বোঝা।

> **Payment সম্পর্কে গুরুত্বপূর্ণ তথ্য:** এই codebase-এ **SSLCommerz নয়, Stripe** payment gateway যুক্ত আছে। নিচে তাই বাস্তবে থাকা Stripe integration-ই ব্যাখ্যা করা হয়েছে। Interview-এ SSLCommerz বলার আগে implementation-টি সত্যিই SSLCommerz-এ পরিবর্তন করতে হবে।

## ১. Packages: কোনটি কেন এবং কোথায় ব্যবহৃত

প্রজেক্টের dependency manifest হলো [`package.json`](./package.json)। নিচে manifest-এ থাকা সব direct dependency ও devDependency-র কাজ সংক্ষেপে দেওয়া হলো।

### Runtime dependencies

| Package | এই project-এ কেন লাগে | কোথায় দেখবেন |
|---|---|---|
| `express` | HTTP server, router, request/response এবং middleware pipeline | [`src/app.ts`](./src/app.ts), `src/app/module/**/**.route.ts` |
| `@prisma/client` | Prisma ORM client-এর runtime package। project-এ generated client import করা হয়েছে `src/generated/prisma/client` path থেকে; Prisma API ও database access ব্যবহৃত হয় | [`src/app/lib/prisma.ts`](./src/app/lib/prisma.ts), module-এর service file |
| `@prisma/adapter-pg` | Prisma-কে PostgreSQL driver-এর সঙ্গে যুক্ত করার adapter | [`src/app/lib/prisma.ts`](./src/app/lib/prisma.ts) |
| `pg` | PostgreSQL ecosystem/driver dependency; Prisma-র PostgreSQL adapter-এর সঙ্গে ব্যবহৃত | `src/app/lib/prisma.ts` এবং Prisma setup |
| `bcryptjs` | password hash ও login-এ password মিলিয়ে দেখা | `src/app/module/auth/auth.service.ts`, `src/app/utils/seed.ts` |
| `jsonwebtoken` | access/refresh JWT তৈরি ও verify | [`src/app/utils/jwt.ts`](./src/app/utils/jwt.ts), `src/app/middleware/checkAuth.ts` |
| `cookie-parser` | request-এর cookie parse করে `req.cookies`-এ দেয় | [`src/app.ts`](./src/app.ts), `src/app/middleware/checkAuth.ts` |
| `cors` | configured frontend origin থেকে credential/cookie-সহ cross-origin request অনুমোদন | [`src/app.ts`](./src/app.ts) |
| `helmet` | সাধারণ HTTP security header যোগ করে | [`src/app.ts`](./src/app.ts) |
| `express-rate-limit` | নির্দিষ্ট সময়সীমায় request সংখ্যা সীমিত করে | [`src/app.ts`](./src/app.ts): ১৫ মিনিটে সর্বোচ্চ ১০০ request |
| `http-status` | HTTP status code-কে readable constant হিসেবে ব্যবহারের সুবিধা | `src/app/module/auth/auth.controller.ts`, `src/app/middleware/globalErrorHandler.ts` |
| `zod` | body input-এর schema validation | `src/app/module/**/**.validation.ts`, `src/app/middleware/validateRequest.ts` |
| `multer` | `multipart/form-data` থেকে uploaded file গ্রহণ; memory storage ব্যবহৃত | [`src/app/lib/multer.ts`](./src/app/lib/multer.ts), upload-সহ routes |
| `@types/multer` | Multer-এর TypeScript type declaration; runtime upload করে না | Multer ব্যবহার করা controller ও service-এর file type |
| `cloudinary` | image Cloudinary-তে upload/delete | [`src/app/lib/cloudinary.ts`](./src/app/lib/cloudinary.ts), [`src/app/utils/cloudinary.ts`](./src/app/utils/cloudinary.ts) |
| `stripe` | hosted Checkout Session তৈরি, Stripe webhook signature যাচাই, event process | [`src/app/lib/stripe.ts`](./src/app/lib/stripe.ts), `src/app/module/payment/**` |
| `redis` | registration OTP ও অস্থায়ী registration data রাখা | [`src/app/lib/redis.ts`](./src/app/lib/redis.ts), `src/app/module/auth/auth.service.ts` |
| `google-auth-library` | Google ID token verify করে Google login | [`src/app/lib/googlAuth.ts`](./src/app/lib/googlAuth.ts), `src/app/module/auth/auth.service.ts` |
| `nodemailer` | OTP, welcome, password ও payment-সংক্রান্ত email পাঠানো | [`src/app/lib/notemailter.ts`](./src/app/lib/notemailter.ts), auth/payment service |
| `ejs` | email template-এ user/payment-এর তথ্য বসিয়ে HTML render | `src/app/templates/*.ejs`, auth/payment service |
| `dotenv` | `.env` থেকে environment variable load | [`src/app/config/index.ts`](./src/app/config/index.ts), `src/app/lib/prisma.ts` |

### Development dependencies

| Package | এই project-এ কাজ |
|---|---|
| `typescript` | TypeScript compile/type system |
| `tsx` | development-এ TypeScript server চালানো; `npm run dev` |
| `tsup` | production build bundle করা; `npm run build` |
| `prisma` | schema/client generation ও Prisma tooling; generated Prisma code ব্যবহৃত |
| `@biomejs/biome` | source formatting ও lint check; `formate:*` এবং `lint:*` scripts |
| `@types/express` | Express-এর TypeScript type |
| `@types/cookie-parser` | Cookie parser-এর TypeScript type |
| `@types/cors` | CORS-এর TypeScript type |
| `@types/ejs` | EJS-এর TypeScript type |
| `@types/jsonwebtoken` | JWT package-এর TypeScript type |
| `@types/node` | Node.js API-এর TypeScript type |
| `@types/pg` | PostgreSQL package-এর TypeScript type |

কিছু `@types/*` package শুধু compile-time type দেয়; এগুলো runtime-এ নিজে কোনো server feature চালায় না। `npm test` বর্তমানে placeholder script—manifest-এ কার্যকর test runner বা test command configure করা নেই।

## ২. Backend-এর সামগ্রিক কাঠামো

প্রজেক্টটি feature/module-কেন্দ্রিক। উদাহরণ হিসেবে `serviceRequest` module-এ route, controller, service, validation ও interface আলাদা:

1. **Route** URL, HTTP method, middleware এবং controller নির্ধারণ করে।
2. **Middleware** authentication, role check, validation বা file parsing করে।
3. **Controller** HTTP request থেকে input নেয়, service call করে এবং response পাঠায়।
4. **Service** business rule ও Prisma database operation চালায়।
5. **Prisma** model অনুযায়ী PostgreSQL-এ query করে।

একটি request-এর সাধারণ পথ:

```text
HTTP request
  -> app.ts-এ global middleware
  -> module route
  -> auth / validation / upload middleware
  -> controller
  -> service
  -> Prisma / external service
  -> JSON response
```

`src/server.ts` startup-এ database ও Redis connection এবং email transporter verify করে; এরপর seed data প্রস্তুত করে server listen করে। API-র route prefix-গুলো `src/app.ts`-এ: `/api/v1/auth`, `/api/v1/categories`, `/api/v1/service-request`, `/api/v1/users`, `/api/v1/admin`, `/api/v1/staff`, `/api/v1/comment`, `/api/v1/payments`।

উদাহরণ: `POST /api/v1/service-request` route-এ auth, Multer এবং controller ক্রমানুসারে চলে—দেখুন [`serviceRequest.route.ts`](./src/app/module/serviceRequest/serviceRequest.route.ts)।

## ৩. Pagination ও metadata: `skip`, `take`, `total`

সবচেয়ে পরিষ্কার উদাহরণ হলো [`getAllServiceRequests`](./src/app/module/serviceRequest/serviceRequest.service.ts)। `GET /api/v1/service-request` query parameter হিসেবে `page` ও `limit` নেয়। default হলো page `1`, limit `10`।

```ts
const pageNum = Number(page);
const limitNum = Number(limit);
const skip = (pageNum - 1) * limitNum;

const result = await prisma.serviceRequest.findMany({
  where: whereConditions,
  skip,
  take: limitNum,
  orderBy: { [sortBy]: sortOrder },
});

const total = await prisma.serviceRequest.count({
  where: whereConditions,
});

return {
  meta: {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  },
  data: result,
};
```

### হিসাবটি কীভাবে কাজ করে?

- `page=1&limit=10` হলে `skip = (1 - 1) * 10 = 0`; প্রথম ১০টি record ফেরে।
- `page=2&limit=10` হলে `skip = 10`; প্রথম ১০টি বাদ দিয়ে পরের ১০টি আসে।
- Prisma-র `take` হলো সর্বোচ্চ কতটি row ফেরাতে হবে—এখানে সেটি `limitNum`।
- `count` একই `whereConditions`-এ চলে; তাই `total` হলো **filter মেলার সব record-এর সংখ্যা**, শুধু বর্তমান page-এর সংখ্যা নয়।
- `totalPages` হলো `ceil(total / limit)`। যেমন ২৩টি match এবং limit ১০ হলে ৩ page।

Controller `meta` ও `data`-কে JSON response-এ পাঠায়। Pagination-এর অনুরূপ pattern category listing-এও আছে: [`category.service.ts`](./src/app/module/category/category.service.ts)। একটি ছোট naming পার্থক্য: service request-এর metadata-তে `totalPages`, কিন্তু category-তে `totalPage` (শেষে `s` নেই)। Client তৈরি করার সময় API response-এর প্রকৃত key দেখে নিতে হবে।

**গুরুত্বপূর্ণ সীমাবদ্ধতা:** query string-কে `Number(...)`-এ রূপান্তর করা হলেও এই listing endpoint-এ `page`/`limit`-এর জন্য এখানে কোনো explicit positive-number বা maximum-limit check দেখা যায় না। `limit=0`, ঋণাত্মক সংখ্যা বা অস্বাভাবিক বড় limit পাঠালে edge case তৈরি হতে পারে। Service request route-এ query validation middleware-ও যুক্ত নেই। Production-এ limit cap এবং query validation যোগ করা নিরাপদ হবে।

## ৪. Filter, sort ও search

`GET /api/v1/service-request`-এর query interface [`serviceRequest.interface.ts`](./src/app/module/serviceRequest/serviceRequest.interface.ts)-এ সংজ্ঞায়িত। ব্যবহারিক উদাহরণ:

```text
GET /api/v1/service-request?page=2&limit=10&search=road&status=PENDING&priority=HIGH&type=PAID&categoryId=<id>&sortBy=createdAt&sortOrder=desc
```

### Search

`search` থাকলে service `title`, `description` ও `address`-এ case-insensitive `contains` খোঁজে:

```ts
andConditions.push({
  OR: [
    { title: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
    { address: { contains: search, mode: "insensitive" } },
  ],
});
```

অর্থাৎ তিনটি field-এর যেকোনো একটিতে search text মিললেই search condition মেলে।

### Filter এবং AND/OR-এর অর্থ

- `status`, `priority`, `type`, `categoryId` আলাদা filter।
- Service এগুলোকে `andConditions` array-তে যোগ করে; ফলে search condition ও নির্বাচিত filter—সবগুলো একই সঙ্গে মেলতে হয় (**AND**)।
- Search-এর ভেতরে field-গুলো `OR`—title **অথবা** description **অথবা** address।
- `type` category relation দিয়ে প্রয়োগ হয়; যেমন category type `PAID`।
- সব listing-এ `isDeleted: false` শর্ত থাকে।
- unauthenticated visitor-কে কেবল FREE category-র request দেখানো হয়। Citizen নিজের request এবং FREE request দেখতে পারে; staff assigned request এবং FREE request দেখতে পারে। এই scope-ও মূল filter-এর সঙ্গে AND হয়।

### Sort

`sortBy` default `createdAt`, `sortOrder` default `desc`; Prisma-র `orderBy`-তে এগুলো dynamic ভাবে ব্যবহৃত হয়:

```ts
orderBy: {
  [sortBy]: sortOrder,
}
```

এই implementation-এ `sortOrder` interface-এ `"asc" | "desc"` হলেও `sortBy` কেবল `string`; route-এ query-র জন্য allowlist validation দেখা যায় না। তাই API client কী পাঠাতে পারবে এবং Prisma কী গ্রহণ করবে—তা অনুমান না করে বাস্তব schema অনুযায়ী দেখুন। আরও মজবুত implementation-এ `sortBy`-এর অনুমোদিত field allowlist, `sortOrder` validation এবং pagination bounds যাচাই করা উচিত।

অন্য listing-এ search/filter-এর variation আছে:

- Category: name/description search, `type` filter, `createdAt desc` sort—[`category.service.ts`](./src/app/module/category/category.service.ts)।
- Payment: status filter, transaction ID/user name/email search, `createdAt desc`—[`payment.service.ts`](./src/app/module/payment/payment.service.ts)।
- Service request listing-এ user role অনুযায়ী visibility query-র business rule-এর অংশ—এটি শুধু UI filter নয়।

## ৫. File upload: Multer থেকে Cloudinary

এই project file-কে local disk-এ রাখে না। Multer প্রথমে file-এর bytes memory buffer-এ নেয়; controller সেই buffer Cloudinary upload stream-এ পাঠায়।

### ধাপ ১: Multer file গ্রহণ

[`src/app/lib/multer.ts`](./src/app/lib/multer.ts)-এ:

```ts
const storage = multer.memoryStorage();
export const upload = multer({ storage });
```

Route-এ upload middleware:

- `POST /api/v1/service-request`: `upload.array("images", 4)`—`images` field-এ সর্বোচ্চ ৪টি file।
- `PATCH /api/v1/service-request/:id`: একইভাবে সর্বোচ্চ ৪টি।
- `PATCH /api/v1/users/me`: `upload.single("image")`—একটি profile image।

এখানে `memoryStorage()` হওয়ায় file `req.file` বা `req.files`-এ buffer হিসেবে পাওয়া যায়।

### ধাপ ২: Cloudinary-তে stream upload

Cloudinary credentials [`src/app/lib/cloudinary.ts`](./src/app/lib/cloudinary.ts)-এ config থেকে আসে। [`src/app/utils/cloudinary.ts`](./src/app/utils/cloudinary.ts)-এর helper buffer-টি upload stream-এ লেখে:

```ts
const uploadStream = cloudinary.uploader.upload_stream(
  { folder: folderName },
  (error, result) => {
    if (error) return reject(error);
    resolve(result as ICloudinaryResponse);
  },
);
uploadStream.end(file.buffer);
```

এটি Promise ফেরায়। তাই controller-এ `await uploadToCloudinary(...)` দিয়ে সফল হলে `secure_url` ও `public_id` পাওয়া যায়; error হলে Promise reject করে এবং controller-এর `catchAsync` সেটিকে error middleware-এ পাঠায়।

### ধাপ ৩: URL ও identifier database-এ রাখা

Service request controller-এ:

```ts
const uploadResult = await uploadToCloudinary(
  file,
  "city_complaints_requests",
);
imageUrls.push(uploadResult.secure_url);
imagePublicIds.push(uploadResult.public_id);
```

Profile update-এ [`users.service.ts`](./src/app/module/users/users.service.ts) পুরোনো `imagePublicId` থাকলে Cloudinary থেকে delete করে নতুন file upload করে, তারপর user row-তে URL ও public ID update করে। Delete করার জন্য একই utility-তে `deleteFromCloudinary(publicId)` আছে।

**Service request upload-এ লক্ষণীয় বিষয়:** controller `images`-এর পাশাপাশি `imagePublicIds` payload-এ পাঠায়, এবং schema-তে `imagePublicIds` field আছে; তবে `createServiceRequest`-এর Prisma create data-তে `images` আছে, `imagePublicIds` নেই। তাই code-এর বর্তমান অবস্থায় create করা request-এর Cloudinary public ID database-এ সংরক্ষিত হয় না। ভবিষ্যতে request image delete/replace করতে সেই ID দরকার হতে পারে। শেখার জন্য controller, service এবং schema—তিনটিই মিলিয়ে পড়ুন: [`serviceRequest.controller.ts`](./src/app/module/serviceRequest/serviceRequest.controller.ts), [`serviceRequest.service.ts`](./src/app/module/serviceRequest/serviceRequest.service.ts), [`serviceRequest.prisma`](./prisma/schema/serviceRequest.prisma)।

Upload endpoint-এ file size/type restriction Multer config-এ দেখা যায় না; বড় বা অনুপযুক্ত file আটকাতে হলে server-side file filter ও size limit যোগ করা দরকার।

## ৬. Payment gateway: বাস্তবে Stripe flow

আবারও মনে রাখুন: package ও code-এ `stripe` আছে, `sslcommerz` integration দেখা যায় না। প্রধান implementation [`payment.service.ts`](./src/app/module/payment/payment.service.ts), [`payment.controller.ts`](./src/app/module/payment/payment.controller.ts) এবং [`src/app.ts`](./src/app.ts)-এ।

### Checkout তৈরি ও pending record

Citizen `POST /api/v1/payments/create-checkout-session` পাঠায়; route-এ `auth(Role.CITIZEN)` আছে। Request body-তে `serviceRequestId` লাগে।

`createCheckoutSession` service:

1. Service request ও category load করে।
2. Request না থাকলে 404; অন্য user-এর হলে 403।
3. আগেই paid, resolved, accepted নয়—অথবা amount শূন্য/ঋণাত্মক—হলে payment প্রত্যাখ্যান করে।
4. `ACCEPTED` এবং positive amount হলে Stripe Checkout Session তৈরি করে।
5. Currency `bdt`; Stripe-এর `unit_amount` smallest unit-এ, তাই code `amount * 100` করে।
6. `metadata`-তে `serviceRequestId` ও `userId` রাখে—webhook-এ এগুলো দিয়ে record চেনার জন্য।
7. Payment row `PENDING` হিসেবে `upsert` করে; একই service request-এর payment থাকলে update করে, না থাকলে create করে।
8. Client-কে hosted checkout-এর `paymentUrl` ফেরত দেয়।

```ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  line_items: [/* service title, BDT amount */],
  success_url: `${config.frontend_url}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${config.frontend_url}/payments/cancel`,
  metadata: { serviceRequestId: serviceRequest.id, userId },
});
```

### Success webhook: browser redirect নয়, server-side confirmation

`src/app.ts`-এ webhook route JSON parser-এর **আগে** raw body নেয়:

```ts
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleWebhook,
);
```

Stripe signature যাচাই করতে original raw body প্রয়োজন। Controller `stripe.webhooks.constructEvent(...)`-এ request body, `stripe-signature` header এবং `STRIPE_WEBHOOK_SECRET` পাঠায়। Signature invalid হলে `400` ফেরে। Valid event হলে service-এ পাঠায়।

`checkout.session.completed` এলে service একটি Prisma transaction-এ:

- transaction ID দিয়ে payment-কে `PAID` করে;
- service request-এ `isPaid: true` সেট করে;
- user ও service request-এর তথ্য নেয়।

Database update সফল হলে user-এর email থাকলে EJS template দিয়ে receipt/confirmation email পাঠায়। Payment update এবং service request update একই database transaction-এ থাকায় একটির পরিবর্তন হয়ে অন্যটি না হওয়ার ঝুঁকি কমে।

### Payment failure ও checkout cancel আলাদা করে বুঝুন

- `checkout.session.async_payment_failed` webhook event এলে payment row `FAILED` হয় এবং email পাঠানোর চেষ্টা হয়।
- Checkout page-এর `cancel_url` হলো user browser-এ checkout cancel করলে frontend-এ ফেরার URL।
- `cancel_url`-এ redirect হওয়া নিজে database-এ payment `FAILED` করার webhook logic নয়। Code-এ async payment fail event handle করা হয়েছে; checkout cancel event-কে payment failure হিসেবে update করার handler এখানে দেখা যায় না.
- Success URL-এ browser ফিরে এলেই database-এ payment-এর চূড়ান্ত অবস্থা নির্ধারিত হয় না; code-এ server-side Stripe webhook `checkout.session.completed` event-ই payment-কে `PAID` করে।

Interview-এ বলতে পারেন: “আমি Stripe Checkout Session তৈরি করি, metadata-তে request/user ID পাঠাই, signature-verified webhook-এ transaction-এর মাধ্যমে payment ও service request update করি। এই repository-তে SSLCommerz নয়, Stripe ব্যবহৃত হয়েছে।”

## ৭. Global Error Handler ও `catchAsync`

Async controller/service-এ database বা third-party call reject করতে পারে। প্রতিটি route-এ বারবার `try/catch` না লিখে [`catchAsync`](./src/app/utils/catchAsync.ts) async error-কে Express error pipeline-এ পাঠায়:

```ts
export const catchAsync = (fn: RequestHandler) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
```

উদাহরণ: controller-এ `catchAsync(async (req, res) => { ... await Service.create... })` লেখা হয়। Service-এ `throw new AppError(404, "...")` বা Prisma error হলে সেটি `next(error)` দিয়ে নিচের error middleware-এ পৌঁছায়।

`src/app.ts`-এর শেষে route-গুলো mount করার পরে `globalErrorHandler` বসানো হয়েছে। [`globalErrorHandler.ts`](./src/app/middleware/globalErrorHandler.ts) error-এর ধরন দেখে response তৈরি করে:

- `AppError`: নিজের status code ও message।
- Prisma validation error: `400`।
- Prisma known error: যেমন `P2002` duplicate key, `P2003` foreign key, `P2025` record না পাওয়া।
- Prisma initialization error: যেমন DB credentials বা connection issue।
- অন্য native `Error`: default `500`, message error থেকে।

Development mode-এ error name, object এবং stack পাঠায়/log করে; অন্য environment-এ response-এ generic `"Error"` name রাখে এবং stack/error object প্রকাশ করে না। Response shape হলো `success: false`, `statusCode`, `name`, `message`, এবং development-এ `error`/`stack`।

`AppError` helper [`appError.ts`](./src/app/utils/appError.ts)-এ `Error`-কে extend করে এবং `statusCode` যোগ করে। এ কারণে application-এর প্রত্যাশিত error আর অপ্রত্যাশিত server error আলাদা করে চেনা যায়।

## ৮. AuthGuard ও Middleware

[`auth`](./src/app/middleware/checkAuth.ts) একটি middleware factory: `auth(Role.ADMIN, Role.CITIZEN)`-এ যে role দেওয়া হয়, কেবল সেগুলোই endpoint-এ প্রবেশ করতে পারে। Role না দিলে token-valid যে কোনো user-এর জন্য route অনুমোদিত—যদিও route-গুলো সাধারণত নির্দিষ্ট role দিয়ে middleware call করে।

### Guard-এর ধাপ

1. Token প্রথমে `accessToken` cookie থেকে পড়ে।
2. Cookie না থাকলে `Authorization: Bearer <token>` header দেখে; code-এ bare authorization token fallback-ও আছে।
3. Token না থাকলে `401`।
4. `jwtUtils.verifyToken(token, jwt_access_secret)` দিয়ে signature/expiry যাচাই; ব্যর্থ হলে `401`।
5. JWT payload থেকে `userId`, `email`, `name`, `role` নেয়।
6. `requiredRoles` দেওয়া থাকলে role না মিললে `403`।
7. Database-এ user খুঁজে; না থাকলে `404`, `BLOCKED` হলে `403`।
8. `needPasswordChange` সত্য হলে `/reset-password` ছাড়া অন্য URL block করে।
9. Valid user context `req.user`-এ বসিয়ে `next()` করে।

```ts
const token = req.cookies.accessToken
  ? req.cookies.accessToken
  : req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization?.split(" ")[1]
    : req.headers.authorization;

const verifiedToken = jwtUtils.verifyToken(
  token,
  config.jwt_access_secret,
);
```

JWT utility [`jwt.ts`](./src/app/utils/jwt.ts)-এ token create/verify করে। Login service bcrypt hash compare করে access/refresh token বানায়; controller token-গুলো `httpOnly` cookie-তে সেট করে—দেখুন [`auth.controller.ts`](./src/app/module/auth/auth.controller.ts)।

### Required auth বনাম optional auth

- `auth(...)`: token/user/role আবশ্যক; failure হলে request error হয়।
- `optionalAuth()`: public listing-এ ব্যবহার হয়। Token না থাকলে anonymous হিসেবে চালায়; invalid token বা blocked/missing user-ও `req.user = undefined` করে `next()` করে। এরপর service anonymous visibility rule প্রয়োগ করে।

এ কারণে `GET /api/v1/service-request` public হলেও authenticated citizen/staff অতিরিক্ত প্রাসঙ্গিক request দেখতে পারে। আর single request-এর ক্ষেত্রে paid request-এর মালিক/assigned staff check service layer-এও হয়—শুধু route guard-ই সম্পূর্ণ authorization নয়।

Validation middleware [`validateRequest.ts`](./src/app/middleware/validateRequest.ts) Zod schema দিয়ে body parse করে; সফল হলে parsed data `req.body`-তে দেয়, ব্যর্থ হলে `AppError(400, ...)` ছোড়ে। অর্থাৎ authentication, authorization এবং payload validation তিনটি আলাদা concern।

## ৯. Interview-এ ব্যাখ্যা করার মতো আরও কিছু design point

- **Layer separation:** route HTTP wiring করে; controller request/response নিয়ে কাজ করে; service business rules চালায়। এই separation controller-কে ছোট এবং business logic-কে test/reuse করার উপযোগী রাখে।
- **Role-based access:** middleware নির্দিষ্ট role-কে route-এ প্রবেশাধিকার দেয়; service-এ ownership/assignment-এর মতো record-level authorization-ও আছে।
- **Database transaction:** service request create + audit log, staff assignment + audit log, status update + staff availability, এবং payment success update-এর মতো একাধিক সম্পর্কিত write-এ Prisma transaction ব্যবহৃত।
- **Soft delete:** category ও service request-এ `isDeleted` flag ব্যবহার করে record সরাসরি মুছে না দিয়ে query থেকে বাদ দেওয়া হয়।
- **Configuration:** secrets ও service URL `.env`/config থেকে আসে; source code-এ credentials hard-code করা হয়নি। [`config/index.ts`](./src/app/config/index.ts) এবং `.env.example` দেখে required setting বুঝুন।
- **Response helper:** [`sendResponse.ts`](./src/app/utils/sendResponse.ts) success response-এর `success`, `statusCode`, `message`, `data` ও ঐচ্ছিক `meta`-র shape একরকম রাখে।
- **Route-not-found:** কোনো route match না হলে [`notFound.ts`](./src/app/middleware/notFound.ts) `404` দেয়।

## ১০. নিজে শেখার জন্য পড়ার ক্রম

1. [`src/app.ts`](./src/app.ts) — middleware, route prefix, webhook ও error-handler placement।
2. [`serviceRequest.route.ts`](./src/app/module/serviceRequest/serviceRequest.route.ts) — একটি feature-এ route ও middleware-এর ক্রম।
3. [`serviceRequest.controller.ts`](./src/app/module/serviceRequest/serviceRequest.controller.ts) — HTTP থেকে service call-এ input কীভাবে যায়।
4. [`serviceRequest.service.ts`](./src/app/module/serviceRequest/serviceRequest.service.ts) — filter/pagination এবং business rules।
5. [`checkAuth.ts`](./src/app/middleware/checkAuth.ts), [`catchAsync.ts`](./src/app/utils/catchAsync.ts), [`globalErrorHandler.ts`](./src/app/middleware/globalErrorHandler.ts) — auth ও error flow।
6. [`multer.ts`](./src/app/lib/multer.ts), [`cloudinary.ts`](./src/app/utils/cloudinary.ts), profile/service request controller — upload lifecycle।
7. [`payment.route.ts`](./src/app/module/payment/payment.route.ts), [`payment.controller.ts`](./src/app/module/payment/payment.controller.ts), [`payment.service.ts`](./src/app/module/payment/payment.service.ts) — checkout থেকে webhook পর্যন্ত।
8. [`serviceRequest.prisma`](./prisma/schema/serviceRequest.prisma) ও বাকি Prisma schema — service, user, category, payment এবং relation-এর data model।

প্রতিটি flow নিজে বোঝার সময় তিনটি প্রশ্ন করুন: **input কোথা থেকে এল? কোন business rule এটি আটকাতে পারে? সফল/ব্যর্থ হলে database ও HTTP response-এ কী পরিবর্তন হয়?** এই প্রশ্নগুলো interview-এ পরিষ্কার উত্তর দিতে সাহায্য করবে।
