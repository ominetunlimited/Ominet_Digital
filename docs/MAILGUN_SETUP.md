# Mailgun setup and verification notes

Everything here is something to do in Mailgun and in your DNS. None of it can be done from the code.
Nothing in the app claims an email was delivered until Mailgun says so (see "Delivery tracking").

## 1. What the app expects

- Mails are sent **From `Ominet Digital <info@ominetdigital.com.ng>`** (fixed in `src/lib/mailgun.ts`).
- Credentials are saved once in **Admin, Newsletter, Mailgun setup** (stored in `integration_settings`).
  The environment variables `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` and `MAILGUN_REGION` (`us` or `eu`) work as a fallback.
- The **region must match** the region the domain was created in, or Mailgun answers 401/404.

## 2. Domain and DNS

Use a sending subdomain (for example `mg.ominetdigital.com.ng`) rather than the root domain, so marketing and
transactional mail never touch the DNS records of your normal mailbox provider.

In Mailgun, Sending, Domains, add the domain, then add the records Mailgun shows you at your DNS host.
Copy the values exactly from the Mailgun screen; the shapes are:

| Type | Host | Purpose |
|---|---|---|
| TXT | the sending domain | SPF (`v=spf1 include:mailgun.org ~all`; merge with an existing SPF record, never add a second one) |
| TXT | `<selector>._domainkey.<sending domain>` | DKIM key |
| MX | the sending domain | only if you want Mailgun to receive replies (two records, priority 10) |
| CNAME | `email.<sending domain>` | open and click tracking (optional) |

Then press **Verify DNS settings** in Mailgun. DNS can take from minutes to a few hours.
Do not send until SPF and DKIM both show as verified.

### The "From" address
Because the From is `info@ominetdigital.com.ng` while Mailgun signs for the subdomain, receivers check DMARC alignment.
Relaxed alignment (the default) accepts a subdomain, so this works as long as the root domain's DMARC policy is not `adkim=s` / `aspf=s`.
Add a DMARC record on the root domain if you do not have one, starting gentle:

    _dmarc.ominetdigital.com.ng  TXT  "v=DMARC1; p=none; rua=mailto:info@ominetdigital.com.ng"

Move to `p=quarantine` only after a few weeks of clean reports.

## 3. Delivery tracking (webhook)

1. Mailgun, Sending, Webhooks, add the URL `https://www.ominetdigital.com.ng/api/webhooks/mailgun`
   for: Delivered, Permanent failure, Temporary failure, Spam complaints, Unsubscribes (Opened and Clicked are optional).
2. Copy the **HTTP webhook signing key** (Mailgun, Settings, API security) into **Admin, Newsletter, Mailgun setup, Delivery tracking**.
   Alternatively set `MAILGUN_WEBHOOK_SIGNING_KEY` in Vercel.
3. Send a test from Mailgun's webhook page. A valid event is stored in `email_events`; an invalid signature is answered with 406 and ignored.
4. Email activity in the admin now shows Delivered, Bounced and so on instead of only Accepted.

## 4. Test plan (do this once after deploying)

1. Save the Mailgun details in the admin. In the Mailgun dashboard check the domain shows **Active**.
2. Submit a test enquiry at `/discuss-a-project` with an address you control. Expect two emails: the acknowledgement to you and the internal notification to the office.
3. In Admin, Bookings, open the enquiry, prepare a quotation with a real figure, **Save and send**. Check the quotation email arrives.
4. Create a quotation document, issue it, press **Email PDF to client**. Open the attachment; it should be `QUO-YYYY-NNNN.pdf`, A4, with the logo and no DRAFT mark.
5. Open Admin, Email activity. Rows should move from Accepted to Delivered within a minute or two.
6. Test a bounce by sending to `bounce@simulator.amazonses.com`-style invalid addresses only if you accept the reputation cost; otherwise use a clearly nonexistent mailbox on your own domain.

## 5. What was and was not tested

- Tested locally: the request the app builds (basic auth, `from`, `to`, the PDF attached with the right name and type, byte-identical to the rendered PDF), against a stand-in for Mailgun.
- **Not tested**: a real send through Mailgun. No Mailgun credentials were present in the database during this work, and the build environment cannot reach Mailgun. Step 4 above is the real test.
