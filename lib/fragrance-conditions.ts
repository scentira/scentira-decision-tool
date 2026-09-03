export const fragranceConditions=[
  {id:'slight-good-history',situation:'Slight use · good customer history',decision:'Allow the return'},
  {id:'slight-poor-history',situation:'Slight use · poor customer history',decision:'Deny the return'},
  {id:'moderate-very-good-history',situation:'Moderate use · very good customer history',decision:'Offer a replacement'},
  {id:'heavy-poor-history',situation:'Heavy use · poor customer history',decision:'Deny the return'},
  {id:'none-fit',situation:'None of these fit',decision:'Ask the founder'},
] as const;
export const isFragrancePrecedent=(entry:{title:string})=>/opened fragrance doesn'?t suit/i.test(entry.title);
