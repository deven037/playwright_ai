import { test, expect } from "@playwright/test";
import { EnvManager } from "../../src/utils/EnvManager";

const env = EnvManager.getInstance();

test.describe("Authentication API Tests", () => {
  test("@api TC_AUTH_001 - Should authenticate user with valid credentials", async ({
    request,
    }) => {
    const apiUrl = `${env.authApi}login`;
    const payload = {
      username: "emilys",
      password: "emilyspass",
    };
    const response = await request.post(apiUrl, { data: payload });
    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.accessToken).toBeTruthy();
    expect(body.username).toBe("emilys");

    console.log(body.accessToken);
  });

  test("@api TC_AUTH_002 - Should fail authentication with invalid credentials", async ({
      request,
    }) => {
    const apiUrl = `${env.authApi}login`;
    const payload = {
      username: "emilys",
      password: "wrongpassword",
    };
    const response = await request.post(apiUrl, { data: payload });
    expect(response.status()).toBe(400);

    const body = await response.json();
    console.log(`Response body: ${JSON.stringify(body)}`);
    expect(body.message).toBe("Invalid credentials");
  });

  test("@api Login And Get Profile", async ({ request }) => {
    const apiUrl = `${env.authApi}login`;
    const payload = {
      username: "emilys",
      password: "emilyspass",
    };
    const loginResponse = await request.post(apiUrl, {
      data: payload,
    });

    expect(loginResponse.status()).toBe(200);

    const loginBody = await loginResponse.json();

    const token = loginBody.accessToken;

    const profileResponse = await request.get(`${env.authApi}me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(profileResponse.status()).toBe(200);

    const profile = await profileResponse.json();

    expect(profile.username).toBe("emilys");
  });
});
