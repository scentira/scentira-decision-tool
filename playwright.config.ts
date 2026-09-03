import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  fullyParallel:false,
  workers:1,
  reporter:'line',
  use:{baseURL:process.env.DEMO_TEST_BASE_URL||'http://127.0.0.1:3107',channel:'chrome',trace:'retain-on-failure'},
  projects:[
    {name:'phone-390',use:{viewport:{width:390,height:844}}},
    {name:'laptop-1440',use:{viewport:{width:1440,height:900}}},
  ],
});
