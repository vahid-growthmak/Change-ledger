import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    buckets: {
      // Private by default, and deliberately so: a change-request attachment
      // is often a screenshot of the client's own site or dashboard. Reads go
      // through an authenticated route that presigns a short-lived URL, never
      // an anonymous public object.
      attachments: {},
    },
  },
});
