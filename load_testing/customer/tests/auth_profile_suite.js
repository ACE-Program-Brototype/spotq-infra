import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, CUSTOMER_EMAIL, CUSTOMER_PASSWORD } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Tests all Customer Authentication, Profile, and Device Management APIs
 */
export function runAuthProfileSuite(token) {
  const headers = getAuthHeaders(token);
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testDeviceId = `k6-device-${generateUuid().substring(0, 8)}`;

  group('01_Auth_And_Identity_APIs', () => {
    // 1. Customer Login
    const loginPayload = JSON.stringify({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
      device: { deviceName: 'k6-load-runner', platform: 'WEB' },
    });
    const loginRes = http.post(ENDPOINTS.LOGIN, loginPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_login' },
    });
    check(loginRes, {
      'customer login responded 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 2. Token Refresh
    const refreshRes = http.post(ENDPOINTS.REFRESH_TOKEN, JSON.stringify({}), {
      ...headers,
      tags: { endpoint: 'customer_refresh_token' },
    });
    check(refreshRes, {
      'customer refresh token responded': (r) => [200, 400, 401].includes(r.status),
    });

    sleep(0.3);

    // 3. Customer Registration (unique email)
    const registerPayload = JSON.stringify({
      fullName: `Test Diner ${randomSuffix}`,
      email: `testdiner_${randomSuffix}_${Date.now()}@spotq.com`,
      phoneNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Customer@12345',
    });
    const regRes = http.post(ENDPOINTS.REGISTER, registerPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_register' },
    });
    check(regRes, {
      'customer registration responded (200, 201, 400, or 409)': (r) =>
        [200, 201, 400, 409].includes(r.status),
    });

    sleep(0.3);

    // 4. Resend Email OTP
    const resendOtpPayload = JSON.stringify({ email: CUSTOMER_EMAIL });
    const resendRes = http.post(ENDPOINTS.RESEND_EMAIL_OTP, resendOtpPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_resend_email_otp' },
    });
    check(resendRes, {
      'resend email otp responded (200, 400, or 429)': (r) =>
        [200, 400, 429].includes(r.status),
    });

    sleep(0.3);

    // 5. Forgot Password Request
    const forgotPayload = JSON.stringify({ email: CUSTOMER_EMAIL });
    const forgotRes = http.post(ENDPOINTS.FORGOT_PASSWORD, forgotPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_forgot_password' },
    });
    check(forgotRes, {
      'forgot password responded (200, 400, or 429)': (r) =>
        [200, 400, 429].includes(r.status),
    });

    sleep(0.3);

    // 6. Forgot Password Resend OTP
    const forgotResendRes = http.post(ENDPOINTS.FORGOT_PASSWORD_RESEND_OTP, forgotPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_forgot_password_resend' },
    });
    check(forgotResendRes, {
      'forgot password resend OTP responded (200, 400, or 429)': (r) =>
        [200, 400, 429].includes(r.status),
    });

    sleep(0.5);
  });

  group('02_Customer_Profile_And_Devices_APIs', () => {
    // 7. Get Customer Profile
    const profileRes = http.get(ENDPOINTS.PROFILE, {
      ...headers,
      tags: { endpoint: 'customer_profile_get' },
    });
    check(profileRes, {
      'get customer profile returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 8. Update Customer Profile
    const updateProfilePayload = JSON.stringify({
      full_name: 'SpotQ Verified Diner',
      gender: 'OTHER',
      dob: '1995-05-15',
    });
    const updateProfileRes = http.patch(ENDPOINTS.PROFILE, updateProfilePayload, {
      ...headers,
      tags: { endpoint: 'customer_profile_update' },
    });
    check(updateProfileRes, {
      'update customer profile returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 9. Get Customer /me
    const meRes = http.get(ENDPOINTS.ME, {
      ...headers,
      tags: { endpoint: 'customer_me' },
    });
    check(meRes, {
      'customer me returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 10. Register Device Token for Push Notifications
    const registerDevicePayload = JSON.stringify({
      deviceId: testDeviceId,
      platform: 'WEB',
      deviceName: 'Chrome on Windows',
      appVersion: '1.0.0',
    });
    const regDevRes = http.post(ENDPOINTS.DEVICES, registerDevicePayload, {
      ...headers,
      tags: { endpoint: 'customer_devices_register' },
    });
    check(regDevRes, {
      'register device responded (200, 201)': (r) => [200, 201].includes(r.status),
    });

    sleep(0.3);

    // 11. List Customer Registered Devices
    const listDevRes = http.get(ENDPOINTS.DEVICES, {
      ...headers,
      tags: { endpoint: 'customer_devices_get' },
    });
    check(listDevRes, {
      'list customer devices returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 12. Deactivate Device
    const deleteDevRes = http.del(ENDPOINTS.DEVICE_BY_ID(testDeviceId), null, {
      ...headers,
      tags: { endpoint: 'customer_device_delete' },
    });
    check(deleteDevRes, {
      'delete customer device responded (200, 204, or 404)': (r) =>
        [200, 204, 404].includes(r.status),
    });

    sleep(0.5);
  });
}
