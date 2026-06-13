import { test, expect } from "@playwright/test";
import { EnvManager } from "../../src/utils/EnvManager";

const env = EnvManager.getInstance();

test.describe("API Tests", () => {
  test("@api TC_API_001 - Should fetch list of users", async ({ request }) => {
    const url = `${env.apiBaseUrl}users/1`;
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log(body);
    expect(body.id).toBe(1);
    expect(body.name).toBeTruthy();
  });

  test("@api TC_API_002 - Should create a new user", async ({ request }) => {
    const payload = {
      name: "John Doe",
      email: "john.doe@gmail.com",
      message: "Hello, this is a test message.",
    };
    const url = `${env.apiBaseUrl}users`;

    const response = await request.post(url, { data: payload });
    expect(response.status()).toBe(201);
    const body = await response.json();
    console.log(body);
    expect(body.id).toBeTruthy();
    expect(body.name).toBe(payload.name);
    expect(body.email).toBe(payload.email);
    expect(body.message).toBe(payload.message);
  });

  test("@api TC_API_003 - Should update an existing user", async ({
    request,
    }) => {
    const payload = {
      name: "Jane Doe",
      email: "jane.doe@gmail.com",
      message: "Hello, this is an updated test message.",
    };
    const url = `${env.apiBaseUrl}users/1`;

    const response = await request.put(url, { data: payload });
    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log(body);
    expect(body.id).toBe(1);
    expect(body.name).toBe(payload.name);
    expect(body.email).toBe(payload.email);
    expect(body.message).toBe(payload.message);
  });

  test("@api TC_API_004 - Headers Validation", async ({ request }) => {
    const url = `${env.apiBaseUrl}users/1`;
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()).toHaveProperty("content-type");
    expect(response.headers()["content-type"]).toContain("application/json");
  });

  test("@api TC_API_005 - Query Parameters Validation", async ({ request }) => {
    const url = `${env.apiBaseUrl}users`;
    const response = await request.get(url, {
      params: { id: 5 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log(body);
    expect(body.length).toBeLessThanOrEqual(5);
  });

});
