import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// `@workspace/db` requires DATABASE_URL at import time (see lib/db/src/index.ts), so unit tests
// mock it entirely rather than hitting a real Postgres instance.
const insertedRows: any[] = [];
vi.mock("@workspace/db", () => ({
  db: {
    insert: () => ({
      values: async (row: any) => {
        insertedRows.push(row);
        return undefined;
      },
    }),
  },
  emailLogsTable: {},
}));

import { sendEmail, emailTemplates, type EmailPayload } from "./emailService";

const BASE_PAYLOAD: EmailPayload = {
  to: "customer@example.com",
  toName: "Test Customer",
  subject: "Test Subject",
  html: "<p>Hello</p>",
  template: "test_template",
};

describe("sendEmail", () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    insertedRows.length = 0;
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("logs as 'skipped' and never calls fetch when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    await sendEmail(BASE_PAYLOAD);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]).toMatchObject({
      status: "skipped",
      toEmail: "customer@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      sentAt: null,
    });
  });

  it("logs as 'sent' and stores the rendered html when the Resend API call succeeds", async () => {
    process.env.RESEND_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "resend-msg-123" }),
    }) as any;

    await sendEmail(BASE_PAYLOAD);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]).toMatchObject({
      status: "sent",
      providerId: "resend-msg-123",
      html: "<p>Hello</p>",
    });
    expect(insertedRows[0].sentAt).toBeInstanceOf(Date);
  });

  it("logs as 'failed' with the error message when the Resend API call returns a non-ok response", async () => {
    process.env.RESEND_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "Invalid domain",
    }) as any;

    await sendEmail(BASE_PAYLOAD);

    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]).toMatchObject({
      status: "failed",
      errorMessage: "Invalid domain",
      sentAt: null,
    });
  });

  it("logs as 'failed' when fetch itself throws (network error)", async () => {
    process.env.RESEND_API_KEY = "test-key";
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as any;

    await sendEmail(BASE_PAYLOAD);

    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].status).toBe("failed");
    expect(insertedRows[0].errorMessage).toContain("network down");
  });

  it("never throws even if sending fails, so callers using .catch() don't crash request handlers", async () => {
    process.env.RESEND_API_KEY = "test-key";
    global.fetch = vi.fn().mockRejectedValue(new Error("boom")) as any;

    await expect(sendEmail(BASE_PAYLOAD)).resolves.toBeUndefined();
  });
});

describe("emailTemplates", () => {
  it("bookingConfirmation renders the booking reference data passed in", () => {
    const html = emailTemplates.bookingConfirmation({
      customerName: "Sarah Johnson",
      experienceTitle: "Gorilla Trek & Village Visit",
      date: "2026-07-01",
      participants: 2,
      totalAmount: 1300,
      bookingId: 42,
    });
    expect(html).toContain("Sarah Johnson");
    expect(html).toContain("Gorilla Trek & Village Visit");
    expect(html).toContain("1300.00");
  });

  it("bookingRejected renders distinct rejection copy from bookingCancelled", () => {
    const rejected = emailTemplates.bookingRejected({
      customerName: "Sarah Johnson",
      experienceTitle: "Basket Weaving Workshop",
      date: "2026-08-01",
      bookingId: 7,
    });
    const cancelled = emailTemplates.bookingCancelled({
      customerName: "Sarah Johnson",
      experienceTitle: "Basket Weaving Workshop",
      date: "2026-08-01",
      bookingId: 7,
    });
    expect(rejected).toContain("Declined");
    expect(rejected).not.toEqual(cancelled);
  });

  it("passwordReset renders the provided reset URL", () => {
    const html = emailTemplates.passwordReset({ name: "Sarah", resetUrl: "https://example.com/reset-password?token=abc123" });
    expect(html).toContain("https://example.com/reset-password?token=abc123");
  });
});
