import {expect,test,type Page} from '@playwright/test';

const zeroUsage={casesSubmitted:0,decisionsApproved:0,precedentsMatched:0,feedback:{yes:0,no:0,not_sure:0}};
const knownUsage={casesSubmitted:12,decisionsApproved:7,precedentsMatched:9,feedback:{yes:4,no:1,not_sure:2}};

async function mockUsage(page:Page,usage=zeroUsage){
  await page.route('**/api/metrics',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(usage)}));
}

async function completeLearningJourney(page:Page){
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Turn one founder decision into a rule your whole team can reuse.'})).toBeVisible();

  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await expect(page.getByRole('heading',{name:'No reliable approved precedent in this demo session'})).toBeVisible({timeout:60_000});
  await page.getByRole('button',{name:'Submit fictional exception'}).click();
  await expect(page.getByText('Pending founder approval',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'Open Founder (demo) to review'}).click();
  await page.getByRole('button',{name:'Review demo exception'}).click();
  await page.getByRole('button',{name:'Use the suggested demo decision'}).click();
  await expect(page.getByRole('textbox',{name:'Decision',exact:true})).not.toHaveValue('');
  await expect(page.getByRole('textbox',{name:'Conditions under which it applies',exact:true})).not.toHaveValue('');
  await page.getByRole('button',{name:'Approve as demo precedent'}).click();
  await expect(page.getByRole('heading',{name:'Precedent created'})).toBeVisible();

  await page.getByRole('button',{name:'Test this decision'}).click();
  await expect(page.getByLabel('Describe the situation')).toHaveValue(/wrong customers.*last-mile hub/i);
  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await expect(page.getByRole('heading',{name:'Approved precedent found'})).toBeVisible();
  await expect(page.getByText('Swapped orders at the final delivery station',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'Conditions match — apply decision'}).click();
  await expect(page.getByRole('article',{name:'Decision from approved precedent'})).toBeVisible();
  await expect(page.getByText(/Precedent used:/)).toBeVisible();
  const worked=page.getByRole('button',{name:'Worked'});
  await worked.click();
  await expect(worked).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('Feedback recorded: Worked')).toBeVisible();
}

async function approveSwappedOrderPrecedent(page:Page){
  await page.goto('/');
  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await page.getByRole('button',{name:'Submit fictional exception'}).click();
  await page.getByRole('button',{name:'Open Founder (demo) to review'}).click();
  await page.getByRole('button',{name:'Review demo exception'}).click();
  await page.getByRole('button',{name:'Use the suggested demo decision'}).click();
  await page.getByRole('button',{name:'Approve as demo precedent'}).click();
  await page.getByRole('button',{name:'Test this decision'}).click();
}

test('complete public demo learning journey',async({page})=>{
  await mockUsage(page);
  await completeLearningJourney(page);
});

test('zero usage stays hidden and demo activity cannot change real totals',async({page})=>{
  await mockUsage(page);
  const realWrites:string[]=[];
  page.on('request',request=>{if(request.url().includes('/api/state')&&request.method()!=='GET')realWrites.push(request.method());});
  await page.goto('/');
  await expect(page.locator('.usage-metrics')).toHaveCount(0);
  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await page.getByRole('button',{name:'Submit fictional exception'}).click();
  await expect(page.locator('.usage-metrics')).toHaveCount(0);
  expect(realWrites).toEqual([]);

  await page.unroute('**/api/metrics');
  await mockUsage(page,knownUsage);
  await page.reload();
  const panel=page.locator('.usage-metrics');
  await expect(panel).toContainText('12');
  await expect(panel).toContainText('7');
  await expect(panel).toContainText('9');
  await expect(panel).toContainText('4 / 1 / 2');
  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await page.getByRole('button',{name:'Submit fictional exception'}).click();
  await expect(panel).toContainText('12');
  await expect(panel).toContainText('7');
  await expect(panel).toContainText('9');
  await expect(panel).toContainText('4 / 1 / 2');
  expect(realWrites).toEqual([]);
});

test('real Founder and CoS access require the PIN screen',async({page})=>{
  await mockUsage(page);
  await page.goto('/');
  await page.getByRole('button',{name:'Staff sign-in'}).click();
  await expect(page.getByRole('heading',{name:'Unlock Founder view'})).toBeVisible();
  await expect(page.getByLabel('Staff PIN')).toBeVisible();
  await page.getByRole('button',{name:'CoS (real)'}).click();
  await expect(page.getByRole('heading',{name:'Unlock CoS view'})).toBeVisible();
  await expect(page.getByLabel('Staff PIN')).toBeVisible();
});

test('meaning fallback finds plain rewordings and rejects an unrelated case',async({page})=>{
  await mockUsage(page);
  await approveSwappedOrderPrecedent(page);

  const rewordings=[
    'A parcel meant for another buyer is waiting at the destination depot. Should we send it back now or finish delivery and retrieve it later?',
    'The labels got mixed between two purchases. One package is already with the last local branch. Do we reverse it or hand it over and pick it up afterward?',
    "Two customers' dispatches were crossed, and one consignment is at the destination center. Is immediate return safer than delivery followed by recovery?",
  ];
  for(const wording of rewordings){
    await page.getByLabel('Describe the situation').fill(wording);
    await page.getByRole('button',{name:'Find an approved decision'}).click();
    await expect(page.getByRole('heading',{name:'Approved precedent found'})).toBeVisible();
    await expect(page.getByText('Swapped orders at the final delivery station',{exact:true})).toBeVisible();
  }

  await page.getByLabel('Describe the situation').fill('An influencer published the wrong launch discount code. Should the campaign post be corrected?');
  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await expect(page.getByRole('heading',{name:'No reliable approved precedent in this demo session'})).toBeVisible({timeout:60_000});
});

test('a founder demo approval is searchable from Find a precedent',async({page})=>{
  await mockUsage(page);
  await page.goto('/');
  await page.getByLabel('Describe the situation').fill('How much do we charge for influencer collab?');
  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await page.getByRole('button',{name:'Submit fictional exception'}).click();
  await page.getByRole('button',{name:'Open Founder (demo) to review'}).click();
  await page.getByRole('button',{name:'Review demo exception'}).click();
  await page.getByLabel('Precedent title').fill('Paid influencer collaboration');
  await page.getByLabel('Decision',{exact:true}).fill('Ask for the creator rate card.');
  await page.getByLabel('Reasoning',{exact:true}).fill('Confirm the commercial request first.');
  await page.getByLabel('Conditions under which it applies').fill('An influencer collaboration where the creator asks for payment.');
  await page.getByRole('button',{name:'Approve as demo precedent'}).click();
  await page.getByRole('button',{name:'Manage precedents'}).click();
  await expect(page.getByRole('article',{name:'Decision from approved precedent'})).toContainText('Paid influencer collaboration');
  await expect(page.getByRole('article',{name:'Decision from approved precedent'})).toContainText('An influencer collaboration where the creator asks for payment.');
  await page.getByRole('button',{name:'Demo',exact:true}).click();
  await page.getByRole('button',{name:'Find a precedent'}).click();
  await page.getByLabel('Describe the situation').fill('Are we doing influencer collaboration?');
  await page.getByRole('button',{name:'Find a decision'}).click();
  const learned=page.getByRole('article',{name:'Decision from approved precedent'});
  await expect(learned).toContainText('Paid influencer collaboration');
  await expect(learned).toContainText('Ask for the creator rate card.');
});

test('browser AI matches meaning without shared wording and rejects unrelated requests',async({page})=>{
  test.skip(process.env.RUN_AI_MODEL_TESTS!=='1','Requires downloading the public browser model.');
  test.setTimeout(120_000);
  await mockUsage(page);
  await page.goto('/');
  await page.getByRole('button',{name:'Find a precedent'}).click();
  const examples=[
    ['What is our creator spend ceiling?','Paid influencer collaboration'],
    ['How much do we charge for influencer collab?','Paid influencer collaboration'],
    ['Can we financially support a student festival?','College brand sponsorship request'],
    ['A buyer hates the smell after trying the bottle.',"Opened fragrance doesn't suit the customer"],
    ['customer says the product smell is very overpowering. can we get the product back and refund?',"Opened fragrance doesn't suit the customer"],
    ['Can somebody be absent at the start of the work week?','Monday leave'],
  ];
  for(const [query,title] of examples){
    await page.getByLabel('Describe the situation').fill(query);
    await page.getByRole('button',{name:'Find a decision'}).click();
    await expect(page.locator('.library-section h2')).toHaveText('Closest decisions',{timeout:60_000});
    await expect(page.locator('.library-section article h3')).toHaveText(title);
  }
  for(const query of ['The office air conditioner is broken.','Can we move the team meeting to Friday?','The founder wants a new advertising campaign.']){
    await page.getByLabel('Describe the situation').fill(query);
    await page.getByRole('button',{name:'Find a decision'}).click();
    await expect(page.locator('.library-section h2')).toHaveText('Nothing like this has come up before',{timeout:60_000});
    await expect(page.locator('.library-section article')).toHaveCount(0);
  }
});

test('self-hosted meaning model matches the overpowering smell refund query',async({page})=>{
  test.skip(process.env.RUN_AI_MODEL_TESTS!=='1','Requires downloading the public model weights.');
  test.setTimeout(120_000);
  await mockUsage(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Describe the situation').fill('customer says the product smell is very overpowering. can we get the product back and refund?');
  await page.getByRole('button',{name:'Find an approved decision'}).click();
  await expect(page.getByRole('heading',{name:"Opened fragrance doesn't suit the customer"})).toBeVisible({timeout:60_000});
});
